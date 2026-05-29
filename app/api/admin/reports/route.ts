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
        { error: 'Only admins can access reports' },
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
      usersResult,
      projectsResult,
      disputesResult,
      workLogsResult,
      peerRatingsResult,
      groupsResult,
      groupMembersResult,
    ] = await Promise.all([
      supabase.from('users').select('id, role, status'),
      supabase
        .from('projects')
        .select('id, title, status, health_status, deadline, created_at'),
      supabase.from('disputes').select('id, project_id, status, created_at'),
      supabase.from('work_logs').select('id, project_id, student_id'),
      supabase.from('peer_ratings').select('id, project_id'),
      supabase.from('groups').select('id, project_id'),
      supabase.from('group_members').select('id, group_id, student_id'),
    ])

    if (usersResult.error) throw usersResult.error
    if (projectsResult.error) throw projectsResult.error
    if (disputesResult.error) throw disputesResult.error
    if (workLogsResult.error) throw workLogsResult.error
    if (peerRatingsResult.error) throw peerRatingsResult.error
    if (groupsResult.error) throw groupsResult.error
    if (groupMembersResult.error) throw groupMembersResult.error

    const users = usersResult.data ?? []
    const projects = projectsResult.data ?? []
    const disputes = disputesResult.data ?? []
    const workLogs = workLogsResult.data ?? []
    const peerRatings = peerRatingsResult.data ?? []
    const groups = groupsResult.data ?? []
    const groupMembers = groupMembersResult.data ?? []

    const projectReports = projects.map((project) => {
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

      const projectDisputes = disputes.filter(
        (dispute) => dispute.project_id === project.id
      )

      const pendingDisputes = projectDisputes.filter(
        (dispute) => dispute.status === 'pending'
      )

      const projectWorkLogs = workLogs.filter(
        (log) => log.project_id === project.id
      )

      const projectPeerRatings = peerRatings.filter(
        (rating) => rating.project_id === project.id
      )

      return {
        id: project.id,
        title: project.title,
        status: project.status,
        health_status: project.health_status,
        deadline: project.deadline,
        created_at: project.created_at,
        groupCount: projectGroups.length,
        studentCount: uniqueStudents.size,
        workLogCount: projectWorkLogs.length,
        peerRatingCount: projectPeerRatings.length,
        disputeCount: projectDisputes.length,
        pendingDisputeCount: pendingDisputes.length,
      }
    })

    return NextResponse.json({
      summary: {
        totalUsers: users.length,
        activeUsers: users.filter((user) => user.status === 'active').length,
        inactiveUsers: users.filter((user) => user.status === 'inactive').length,
        teachers: users.filter((user) => user.role === 'teacher').length,
        students: users.filter((user) => user.role === 'student').length,
        admins: users.filter((user) => user.role === 'admin').length,
        totalProjects: projects.length,
        activeProjects: projects.filter(
          (project) => project.status === 'active'
        ).length,
        completedProjects: projects.filter(
          (project) => project.status === 'completed'
        ).length,
        archivedProjects: projects.filter(
          (project) => project.status === 'archived'
        ).length,
        warningProjects: projects.filter(
          (project) => project.health_status === 'warning'
        ).length,
        criticalProjects: projects.filter(
          (project) => project.health_status === 'critical'
        ).length,
        totalDisputes: disputes.length,
        pendingDisputes: disputes.filter(
          (dispute) => dispute.status === 'pending'
        ).length,
        resolvedDisputes: disputes.filter(
          (dispute) => dispute.status === 'resolved'
        ).length,
        rejectedDisputes: disputes.filter(
          (dispute) => dispute.status === 'rejected'
        ).length,
        totalWorkLogs: workLogs.length,
        totalPeerRatings: peerRatings.length,
        totalGroups: groups.length,
      },
      projectReports,
    })
  } catch (error) {
    console.error('Error fetching admin reports:', error)

    return NextResponse.json(
      { error: 'Failed to fetch admin reports' },
      { status: 500 }
    )
  }
}