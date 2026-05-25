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

async function getGroupsWithMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string
) {
  const { data: groups, error } = await supabase
    .from('groups')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) throw error

  const groupsWithMembers = await Promise.all(
    (groups ?? []).map(async (group) => {
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', group.id)
        .order('created_at', { ascending: true })

      if (membersError) throw membersError

      const membersWithStudents = await Promise.all(
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
        group_members: membersWithStudents,
      }
    })
  )

  return groupsWithMembers
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

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
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

    if (profile.role === 'teacher' && project.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (profile.role === 'student') {
      const allowed = await isStudentInProject(supabase, user.id, projectId)

      if (!allowed) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const groups = await getGroupsWithMembers(supabase, projectId)

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Error fetching groups:', error)

    return NextResponse.json(
      { error: 'Failed to fetch groups' },
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
        { error: 'Only teachers can create groups' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const groupName = String(body.group_name ?? '').trim()
    const projectId = String(body.project_id ?? '').trim()
    const members = Array.isArray(body.members) ? body.members : []

    if (!groupName) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
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

    const cleanMembers = [
      ...new Set(
        members
          .map((memberId: unknown) => String(memberId).trim())
          .filter(Boolean)
      ),
    ]

    if (cleanMembers.length > 0) {
      const { data: studentUsers, error: studentsError } = await supabase
        .from('users')
        .select('id, role')
        .in('id', cleanMembers)

      if (studentsError) throw studentsError

      const validStudentIds = (studentUsers ?? [])
        .filter((student) => student.role === 'student')
        .map((student) => student.id)

      if (validStudentIds.length !== cleanMembers.length) {
        return NextResponse.json(
          { error: 'One or more selected members are not valid students' },
          { status: 400 }
        )
      }
    }

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        group_name: groupName,
        project_id: projectId,
      })
      .select()
      .single()

    if (groupError) throw groupError

    if (cleanMembers.length > 0) {
      const memberRows = cleanMembers.map((studentId) => ({
        group_id: group.id,
        student_id: studentId,
      }))

      const { error: memberError } = await supabase
        .from('group_members')
        .insert(memberRows)

      if (memberError) throw memberError
    }

    const groups = await getGroupsWithMembers(supabase, projectId)
    const createdGroup = groups.find((item) => item.id === group.id) ?? group

    return NextResponse.json(createdGroup, { status: 201 })
  } catch (error) {
    console.error('Error creating group:', error)

    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    )
  }
}