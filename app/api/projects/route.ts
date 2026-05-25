import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function getUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from('users')
    .select('id, role, name, email, status')
    .eq('id', userId)
    .single()

  if (error) {
    return null
  }

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

  if (membershipError) {
    return false
  }

  return Boolean(membership)
}

async function getProjectWithGroups(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string
) {
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return { project: null, error: projectError }
  }

  const { data: teacher } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('id', project.teacher_id)
    .single()

  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  const groupsWithMembers = await Promise.all(
    (groups ?? []).map(async (group) => {
      const { data: members } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', group.id)
        .order('created_at', { ascending: true })

      const membersWithUsers = await Promise.all(
        (members ?? []).map(async (member) => {
          const { data: student } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', member.student_id)
            .single()

          return {
            ...member,
            student,
          }
        })
      )

      return {
        ...group,
        group_members: membersWithUsers,
      }
    })
  )

  return {
    project: {
      ...project,
      teacher,
      groups: groupsWithMembers,
    },
    error: null,
  }
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
    const role = searchParams.get('role')
    const id = searchParams.get('id')

    if (id) {
      const { project, error } = await getProjectWithGroups(supabase, id)

      if (error || !project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      if (profile.role === 'teacher' && project.teacher_id !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      if (profile.role === 'student') {
        const allowed = await isStudentInProject(supabase, user.id, id)

        if (!allowed) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      }

      return NextResponse.json(project)
    }

    if (role === 'student' || profile.role === 'student') {
      const { data: memberships, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('student_id', user.id)

      if (membershipError) {
        throw membershipError
      }

      const groupIds = (memberships ?? []).map((member) => member.group_id)

      if (groupIds.length === 0) {
        return NextResponse.json([])
      }

      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('project_id')
        .in('id', groupIds)

      if (groupsError) {
        throw groupsError
      }

      const projectIds = [
        ...new Set((groups ?? []).map((group) => group.project_id)),
      ]

      if (projectIds.length === 0) {
        return NextResponse.json([])
      }

      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)
        .order('created_at', { ascending: false })

      if (projectsError) {
        throw projectsError
      }

      return NextResponse.json(projects ?? [])
    }

    let query = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (role === 'teacher' || profile.role === 'teacher') {
      query = query.eq('teacher_id', user.id)
    } else if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('Error fetching projects:', error)

    return NextResponse.json(
      { error: 'Failed to fetch projects' },
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
        { error: 'Only teachers can create projects' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const title = String(body.title ?? '').trim()
    const description = String(body.description ?? '').trim()
    const deadline = body.deadline || null

    if (!title) {
      return NextResponse.json(
        { error: 'Project title is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        title,
        description,
        deadline,
        teacher_id: user.id,
        status: 'active',
        health_status: 'healthy',
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)

    return NextResponse.json(
      { error: 'Failed to create project' },
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
        { error: 'Only teachers can update projects' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const id = String(body.id ?? '').trim()
    const title = String(body.title ?? '').trim()
    const description = String(body.description ?? '').trim()
    const deadline = body.deadline || null
    const status = String(body.status ?? '').trim()
    const healthStatus = String(body.health_status ?? '').trim()

    const allowedStatuses = ['active', 'completed', 'archived']
    const allowedHealthStatuses = ['healthy', 'good', 'warning', 'critical']

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    if (!title) {
      return NextResponse.json(
        { error: 'Project title is required' },
        { status: 400 }
      )
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid project status' },
        { status: 400 }
      )
    }

    if (!allowedHealthStatuses.includes(healthStatus)) {
      return NextResponse.json(
        { error: 'Invalid health status' },
        { status: 400 }
      )
    }

    const { data: existingProject, error: existingError } = await supabase
      .from('projects')
      .select('id, teacher_id')
      .eq('id', id)
      .single()

    if (existingError || !existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (existingProject.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('projects')
      .update({
        title,
        description,
        deadline,
        status,
        health_status: healthStatus,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating project:', error)

    return NextResponse.json(
      { error: 'Failed to update project' },
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

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can delete projects' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = String(searchParams.get('id') ?? '').trim()

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, teacher_id, status')
      .eq('id', id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (project.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (project.status !== 'archived') {
      return NextResponse.json(
        { error: 'Only archived projects can be deleted' },
        { status: 400 }
      )
    }

    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: 'Archived project deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting project:', error)

    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}