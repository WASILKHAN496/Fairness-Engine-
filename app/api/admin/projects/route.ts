import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      supabase,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const profile = await getUserProfile(supabase, user.id)

  if (!profile || profile.role !== 'admin') {
    return {
      supabase,
      error: NextResponse.json(
        { error: 'Only admins can access projects' },
        { status: 403 }
      ),
    }
  }

  return { supabase, error: null }
}

export async function GET() {
  try {
    const { supabase, error } = await requireAdmin()

    if (error) {
      return error
    }

    const [
      projectsResult,
      usersResult,
      groupsResult,
      groupMembersResult,
      workLogsResult,
      disputesResult,
      peerRatingsResult,
    ] = await Promise.all([
      supabase
        .from('projects')
        .select(
          'id, title, description, teacher_id, deadline, status, health_status, created_at, updated_at'
        )
        .order('created_at', { ascending: false }),
      supabase.from('users').select('id, name, email, role'),
      supabase.from('groups').select('id, project_id'),
      supabase.from('group_members').select('id, group_id, student_id'),
      supabase.from('work_logs').select('id, project_id, student_id'),
      supabase.from('disputes').select('id, project_id, status'),
      supabase.from('peer_ratings').select('id, project_id'),
    ])

    if (projectsResult.error) throw projectsResult.error
    if (usersResult.error) throw usersResult.error
    if (groupsResult.error) throw groupsResult.error
    if (groupMembersResult.error) throw groupMembersResult.error
    if (workLogsResult.error) throw workLogsResult.error
    if (disputesResult.error) throw disputesResult.error
    if (peerRatingsResult.error) throw peerRatingsResult.error

    const projects = projectsResult.data ?? []
    const users = usersResult.data ?? []
    const groups = groupsResult.data ?? []
    const groupMembers = groupMembersResult.data ?? []
    const workLogs = workLogsResult.data ?? []
    const disputes = disputesResult.data ?? []
    const peerRatings = peerRatingsResult.data ?? []

    const projectList = projects.map((project) => {
      const teacher = users.find((item) => item.id === project.teacher_id)

      const projectGroups = groups.filter(
        (group) => group.project_id === project.id
      )

      const groupIds = projectGroups.map((group) => group.id)

      const projectMembers = groupMembers.filter((member) =>
        groupIds.includes(member.group_id)
      )

      const uniqueStudents = new Set(
        projectMembers.map((member) => member.student_id)
      )

      const projectWorkLogs = workLogs.filter(
        (log) => log.project_id === project.id
      )

      const projectDisputes = disputes.filter(
        (dispute) => dispute.project_id === project.id
      )

      const pendingDisputes = projectDisputes.filter(
        (dispute) => dispute.status === 'pending'
      )

      const projectPeerRatings = peerRatings.filter(
        (rating) => rating.project_id === project.id
      )

      return {
        ...project,
        teacher: teacher
          ? {
              id: teacher.id,
              name: teacher.name,
              email: teacher.email,
            }
          : null,
        groupCount: projectGroups.length,
        studentCount: uniqueStudents.size,
        workLogCount: projectWorkLogs.length,
        disputeCount: projectDisputes.length,
        pendingDisputeCount: pendingDisputes.length,
        peerRatingCount: projectPeerRatings.length,
      }
    })

    return NextResponse.json(projectList)
  } catch (error) {
    console.error('Error fetching admin projects:', error)

    return NextResponse.json(
      { error: 'Failed to fetch admin projects' },
      { status: 500 }
    )
  }
}