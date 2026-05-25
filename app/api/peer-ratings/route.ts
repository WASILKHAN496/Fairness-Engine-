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

async function getTeacherProjectIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teacherId: string
) {
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('teacher_id', teacherId)

  if (error) return []

  return (data ?? []).map((project) => project.id)
}

async function getStudentGroupIdsForProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
  projectId: string
) {
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('id')
    .eq('project_id', projectId)

  if (groupsError || !groups || groups.length === 0) {
    return []
  }

  const groupIds = groups.map((group) => group.id)

  const { data: memberships, error: membershipsError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('student_id', studentId)
    .in('group_id', groupIds)

  if (membershipsError) return []

  return (memberships ?? []).map((membership) => membership.group_id)
}

async function areStudentsInSameProjectGroup(
  supabase: Awaited<ReturnType<typeof createClient>>,
  firstStudentId: string,
  secondStudentId: string,
  projectId: string
) {
  const firstStudentGroups = await getStudentGroupIdsForProject(
    supabase,
    firstStudentId,
    projectId
  )

  if (firstStudentGroups.length === 0) return false

  const secondStudentGroups = await getStudentGroupIdsForProject(
    supabase,
    secondStudentId,
    projectId
  )

  return secondStudentGroups.some((groupId) =>
    firstStudentGroups.includes(groupId)
  )
}

async function attachUserNamesToRatings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ratings: any[]
) {
  return Promise.all(
    ratings.map(async (rating) => {
      const { data: rater } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', rating.rater_id)
        .single()

      const { data: ratedStudent } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', rating.rated_student_id)
        .single()

      return {
        ...rating,
        rater,
        rated_student: ratedStudent,
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
      .from('peer_ratings')
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
        const studentGroups = await getStudentGroupIdsForProject(
          supabase,
          user.id,
          projectId
        )

        if (studentGroups.length === 0) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      }

      query = query.eq('project_id', projectId)
    } else if (profile.role === 'teacher') {
      const teacherProjectIds = await getTeacherProjectIds(supabase, user.id)

      if (teacherProjectIds.length === 0) {
        return NextResponse.json([])
      }

      query = query.in('project_id', teacherProjectIds)
    } else if (profile.role !== 'admin' && profile.role !== 'student') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (profile.role === 'student') {
      query = query.or(`rater_id.eq.${user.id},rated_student_id.eq.${user.id}`)
    } else if (studentId) {
      query = query.eq('rated_student_id', studentId)
    }

    const { data, error } = await query

    if (error) throw error

    const ratingsWithUsers = await attachUserNamesToRatings(
      supabase,
      data ?? []
    )

    return NextResponse.json(ratingsWithUsers)
  } catch (error) {
    console.error('Error fetching peer ratings:', error)

    return NextResponse.json(
      { error: 'Failed to fetch peer ratings' },
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

    if (!profile || profile.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can submit peer ratings' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const ratedStudentId = String(body.rated_student_id ?? '').trim()
    const projectId = String(body.project_id ?? '').trim()
    const rating = Number(body.rating)
    const feedback = String(body.feedback ?? '').trim() || null

    if (!ratedStudentId) {
      return NextResponse.json(
        { error: 'Rated student is required' },
        { status: 400 }
      )
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    if (ratedStudentId === user.id) {
      return NextResponse.json(
        { error: 'You cannot rate yourself' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
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

    const ratedStudent = await getUserProfile(supabase, ratedStudentId)

    if (!ratedStudent || ratedStudent.role !== 'student') {
      return NextResponse.json(
        { error: 'Rated user must be a valid student' },
        { status: 400 }
      )
    }

    const sameGroup = await areStudentsInSameProjectGroup(
      supabase,
      user.id,
      ratedStudentId,
      projectId
    )

    if (!sameGroup) {
      return NextResponse.json(
        { error: 'You can only rate students in your project group' },
        { status: 403 }
      )
    }

    const { data: existingRating, error: existingError } = await supabase
      .from('peer_ratings')
      .select('id')
      .eq('rater_id', user.id)
      .eq('rated_student_id', ratedStudentId)
      .eq('project_id', projectId)
      .maybeSingle()

    if (existingError) throw existingError

    if (existingRating) {
      return NextResponse.json(
        { error: 'You have already rated this student for this project' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('peer_ratings')
      .insert({
        rater_id: user.id,
        rated_student_id: ratedStudentId,
        project_id: projectId,
        rating,
        feedback,
      })
      .select()
      .single()

    if (error) throw error

    const [ratingWithUsers] = await attachUserNamesToRatings(supabase, [data])

    return NextResponse.json(ratingWithUsers, { status: 201 })
  } catch (error) {
    console.error('Error creating peer rating:', error)

    return NextResponse.json(
      { error: 'Failed to create peer rating' },
      { status: 500 }
    )
  }
}