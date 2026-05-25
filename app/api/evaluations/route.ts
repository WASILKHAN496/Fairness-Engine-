import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function getUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from('users')
    .select('id, role, name, email')
    .eq('id', userId)
    .single()

  if (error) return null

  return data
}

async function getProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string
) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) return null

  return data
}

async function isStudentInProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
  projectId: string
) {
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('id')
    .eq('project_id', projectId)

  if (groupsError || !groups || groups.length === 0) {
    return false
  }

  const groupIds = groups.map((group) => group.id)

  const { data: membership, error: membershipError } = await supabase
    .from('group_members')
    .select('id')
    .eq('student_id', studentId)
    .in('group_id', groupIds)
    .maybeSingle()

  if (membershipError) return false

  return Boolean(membership)
}

async function attachUsersToEvaluations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  evaluations: any[]
) {
  return Promise.all(
    evaluations.map(async (evaluation) => {
      const { data: student } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', evaluation.student_id)
        .single()

      const { data: teacher } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', evaluation.teacher_id)
        .single()

      return {
        ...evaluation,
        student,
        teacher,
      }
    })
  )
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile(supabase, user.id)

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const studentId = searchParams.get('studentId')

    let query = supabase
      .from('teacher_evaluations')
      .select('*')
      .order('created_at', { ascending: false })

    if (projectId) {
      const project = await getProject(supabase, projectId)

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      if (profile.role === 'teacher' && project.teacher_id !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      if (profile.role === 'student') {
        const allowed = await isStudentInProject(
          supabase,
          user.id,
          projectId
        )

        if (!allowed) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      }

      query = query.eq('project_id', projectId)
    } else if (profile.role === 'teacher') {
      query = query.eq('teacher_id', user.id)
    }

    if (profile.role === 'student') {
      query = query.eq('student_id', user.id)
    } else if (studentId) {
      query = query.eq('student_id', studentId)
    }

    const { data, error } = await query

    if (error) throw error

    const evaluationsWithUsers = await attachUsersToEvaluations(
      supabase,
      data ?? []
    )

    return NextResponse.json(evaluationsWithUsers)
  } catch (error) {
    console.error('Error fetching evaluations:', error)

    return NextResponse.json(
      { error: 'Failed to fetch evaluations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile(supabase, user.id)

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can create evaluations' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const studentId = String(body.student_id ?? '').trim()
    const projectId = String(body.project_id ?? '').trim()
    const score = Number(body.score)
    const comment = String(body.comment ?? '').trim() || null

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(score) || score < 0 || score > 100) {
      return NextResponse.json(
        { error: 'Score must be between 0 and 100' },
        { status: 400 }
      )
    }

    const project = await getProject(supabase, projectId)

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (project.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const student = await getUserProfile(supabase, studentId)

    if (!student || student.role !== 'student') {
      return NextResponse.json(
        { error: 'Selected user is not a valid student' },
        { status: 400 }
      )
    }

    const allowed = await isStudentInProject(
      supabase,
      studentId,
      projectId
    )

    if (!allowed) {
      return NextResponse.json(
        { error: 'Student is not assigned to this project' },
        { status: 400 }
      )
    }

    const { data: existingEvaluation, error: existingError } = await supabase
      .from('teacher_evaluations')
      .select('id')
      .eq('teacher_id', user.id)
      .eq('student_id', studentId)
      .eq('project_id', projectId)
      .maybeSingle()

    if (existingError) throw existingError

    if (existingEvaluation) {
      return NextResponse.json(
        { error: 'Evaluation already exists for this student/project' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('teacher_evaluations')
      .insert({
        teacher_id: user.id,
        student_id: studentId,
        project_id: projectId,
        score,
        comment,
      })
      .select()
      .single()

    if (error) throw error

    const [evaluationWithUsers] = await attachUsersToEvaluations(
      supabase,
      [data]
    )

    return NextResponse.json(evaluationWithUsers, { status: 201 })
  } catch (error) {
    console.error('Error creating evaluation:', error)

    return NextResponse.json(
      { error: 'Failed to create evaluation' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile(supabase, user.id)

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can update evaluations' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const id = String(body.id ?? '').trim()
    const score = Number(body.score)
    const comment = String(body.comment ?? '').trim() || null

    if (!id) {
      return NextResponse.json(
        { error: 'Evaluation ID is required' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(score) || score < 0 || score > 100) {
      return NextResponse.json(
        { error: 'Score must be between 0 and 100' },
        { status: 400 }
      )
    }

    const { data: evaluation, error: evaluationError } = await supabase
      .from('teacher_evaluations')
      .select('*')
      .eq('id', id)
      .single()

    if (evaluationError || !evaluation) {
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      )
    }

    if (evaluation.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('teacher_evaluations')
      .update({
        score,
        comment,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const [evaluationWithUsers] = await attachUsersToEvaluations(
      supabase,
      [data]
    )

    return NextResponse.json(evaluationWithUsers)
  } catch (error) {
    console.error('Error updating evaluation:', error)

    return NextResponse.json(
      { error: 'Failed to update evaluation' },
      { status: 500 }
    )
  }
}