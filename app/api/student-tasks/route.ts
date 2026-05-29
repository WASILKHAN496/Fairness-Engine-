import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function getUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from('users')
    .select('id, role, status')
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

    if (!profile || profile.role !== 'student' || profile.status === 'inactive') {
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

    const allowed = await isStudentInProject(supabase, user.id, projectId)

    if (!allowed) {
      return NextResponse.json(
        { error: 'You are not assigned to this project' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('project_tasks')
      .select(
        'id, project_id, student_id, title, description, is_completed, created_at, updated_at'
      )
      .eq('project_id', projectId)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('Error fetching student tasks:', error)

    return NextResponse.json(
      { error: 'Failed to fetch student tasks' },
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

    if (!profile || profile.role !== 'student' || profile.status === 'inactive') {
      return NextResponse.json(
        { error: 'Only active students can create tasks' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const projectId = String(body.project_id ?? '').trim()
    const title = String(body.title ?? '').trim()
    const description = String(body.description ?? '').trim() || null

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    if (!title) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      )
    }

    const project = await getProject(supabase, projectId)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const allowed = await isStudentInProject(supabase, user.id, projectId)

    if (!allowed) {
      return NextResponse.json(
        { error: 'You are not assigned to this project' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('project_tasks')
      .insert({
        project_id: projectId,
        student_id: user.id,
        title,
        description,
        is_completed: false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating student task:', error)

    return NextResponse.json(
      { error: 'Failed to create student task' },
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

    if (!profile || profile.role !== 'student' || profile.status === 'inactive') {
      return NextResponse.json(
        { error: 'Only active students can update tasks' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const id = String(body.id ?? '').trim()
    const title = body.title !== undefined ? String(body.title).trim() : null
    const description =
      body.description !== undefined
        ? String(body.description).trim() || null
        : undefined
    const isCompleted =
      typeof body.is_completed === 'boolean' ? body.is_completed : undefined

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    const { data: existingTask, error: existingError } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('id', id)
      .eq('student_id', user.id)
      .single()

    if (existingError || !existingTask) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    const updateData: {
      title?: string
      description?: string | null
      is_completed?: boolean
      updated_at: string
    } = {
      updated_at: new Date().toISOString(),
    }

    if (title !== null) {
      if (!title) {
        return NextResponse.json(
          { error: 'Task title cannot be empty' },
          { status: 400 }
        )
      }

      updateData.title = title
    }

    if (description !== undefined) {
      updateData.description = description
    }

    if (isCompleted !== undefined) {
      updateData.is_completed = isCompleted
    }

    const { data, error } = await supabase
      .from('project_tasks')
      .update(updateData)
      .eq('id', id)
      .eq('student_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating student task:', error)

    return NextResponse.json(
      { error: 'Failed to update student task' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    if (!profile || profile.role !== 'student' || profile.status === 'inactive') {
      return NextResponse.json(
        { error: 'Only active students can delete tasks' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = String(searchParams.get('id') ?? '').trim()

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    const { data: existingTask, error: existingError } = await supabase
      .from('project_tasks')
      .select('id')
      .eq('id', id)
      .eq('student_id', user.id)
      .single()

    if (existingError || !existingTask) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('project_tasks')
      .delete()
      .eq('id', id)
      .eq('student_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting student task:', error)

    return NextResponse.json(
      { error: 'Failed to delete student task' },
      { status: 500 }
    )
  }
}