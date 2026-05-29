import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function getUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from('users')
    .select('id, role, status, name, email')
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
    .select('id, title, teacher_id')
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

async function attachUsersToMessages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  messages: any[]
) {
  return Promise.all(
    messages.map(async (message) => {
      const { data: sender } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', message.sender_id)
        .single()

      const { data: receiver } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', message.receiver_id)
        .single()

      return {
        ...message,
        sender,
        receiver,
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

    if (!profile || profile.status === 'inactive') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = String(searchParams.get('projectId') ?? '').trim()

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const project = await getProject(supabase, projectId)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (profile.role === 'student') {
      const allowed = await isStudentInProject(supabase, user.id, projectId)

      if (!allowed) {
        return NextResponse.json(
          { error: 'You are not assigned to this project' },
          { status: 403 }
        )
      }
    }

    if (profile.role === 'teacher' && project.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (profile.role !== 'student' && profile.role !== 'teacher' && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    let query = supabase
      .from('project_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (profile.role !== 'admin') {
      query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    }

    const { data, error } = await query

    if (error) throw error

    const messagesWithUsers = await attachUsersToMessages(supabase, data ?? [])

    return NextResponse.json(messagesWithUsers)
  } catch (error) {
    console.error('Error fetching project messages:', error)

    return NextResponse.json(
      { error: 'Failed to fetch project messages' },
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

    if (!profile || profile.status === 'inactive') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()

    const projectId = String(body.project_id ?? '').trim()
    const message = String(body.message ?? '').trim()

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (message.length > 1500) {
      return NextResponse.json(
        { error: 'Message must be 1500 characters or less' },
        { status: 400 }
      )
    }

    const project = await getProject(supabase, projectId)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    let receiverId = ''

    if (profile.role === 'student') {
      const allowed = await isStudentInProject(supabase, user.id, projectId)

      if (!allowed) {
        return NextResponse.json(
          { error: 'You are not assigned to this project' },
          { status: 403 }
        )
      }

      receiverId = project.teacher_id
    } else if (profile.role === 'teacher') {
      if (project.teacher_id !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      receiverId = String(body.receiver_id ?? '').trim()

      if (!receiverId) {
        return NextResponse.json(
          { error: 'Receiver ID is required for teacher replies' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Only students and teachers can send project messages' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('project_messages')
      .insert({
        project_id: projectId,
        sender_id: user.id,
        receiver_id: receiverId,
        message,
        is_read: false,
      })
      .select()
      .single()

    if (error) throw error

    const [messageWithUsers] = await attachUsersToMessages(supabase, [data])

    return NextResponse.json(messageWithUsers, { status: 201 })
  } catch (error) {
    console.error('Error sending project message:', error)

    return NextResponse.json(
      { error: 'Failed to send project message' },
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

    if (!profile || profile.status === 'inactive') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const projectId = String(body.project_id ?? '').trim()

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('project_messages')
      .update({ is_read: true })
      .eq('project_id', projectId)
      .eq('receiver_id', user.id)
      .eq('is_read', false)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking messages read:', error)

    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}