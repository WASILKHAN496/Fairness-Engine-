import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function getUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from('users')
    .select('id, role')
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
    const requestedStudentId = searchParams.get('studentId')

    let query = supabase
      .from('work_logs')
      .select('*')
      .order('week_no', { ascending: true })
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
        const allowed = await isStudentInProject(supabase, user.id, projectId)

        if (!allowed) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      }

      query = query.eq('project_id', projectId)
    }

    if (profile.role === 'student') {
      query = query.eq('student_id', user.id)
    } else if (requestedStudentId) {
      query = query.eq('student_id', requestedStudentId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('Error fetching work logs:', error)

    return NextResponse.json(
      { error: 'Failed to fetch work logs' },
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
        { error: 'Only students can submit work logs' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const projectId = String(body.project_id ?? '').trim()
    const weekNo = Number(body.week_no)
    const workDescription = String(body.work_description ?? '').trim()
    const evidenceLink = String(body.evidence_link ?? '').trim() || null

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(weekNo) || weekNo < 1) {
      return NextResponse.json(
        { error: 'Week number must be a positive number' },
        { status: 400 }
      )
    }

    if (!workDescription) {
      return NextResponse.json(
        { error: 'Work description is required' },
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

    const allowed = await isStudentInProject(supabase, user.id, projectId)

    if (!allowed) {
      return NextResponse.json(
        { error: 'You are not assigned to this project' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('work_logs')
      .insert({
        student_id: user.id,
        project_id: projectId,
        week_no: weekNo,
        work_description: workDescription,
        evidence_link: evidenceLink,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating work log:', error)

    return NextResponse.json(
      { error: 'Failed to create work log' },
      { status: 500 }
    )
  }
}