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
        { error: 'Only admins can access alerts' },
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

    const alerts: Array<{
      id: string
      type: 'dispute' | 'user' | 'project' | 'fairness'
      severity: 'high' | 'medium' | 'low'
      title: string
      description: string
      actionLabel?: string
      actionHref?: string
      createdAt?: string | null
    }> = []

    const { data: pendingDisputes, error: disputesError } = await supabase
      .from('disputes')
      .select('id, reason, created_at, status, student_id, project_id')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (disputesError) {
      throw disputesError
    }

    ;(pendingDisputes ?? []).forEach((dispute) => {
      alerts.push({
        id: `dispute-${dispute.id}`,
        type: 'dispute',
        severity: 'high',
        title: 'Pending dispute requires review',
        description:
          dispute.reason ||
          'A student has submitted a dispute that needs admin review.',
        actionLabel: 'Review Disputes',
        actionHref: '/dashboard/admin/disputes',
        createdAt: dispute.created_at,
      })
    })

    const { data: inactiveUsers, error: inactiveUsersError } = await supabase
      .from('users')
      .select('id, name, email, role, status')
      .eq('status', 'inactive')
      .order('name', { ascending: true })

    if (inactiveUsersError) {
      throw inactiveUsersError
    }

    ;(inactiveUsers ?? []).forEach((user) => {
      alerts.push({
        id: `inactive-user-${user.id}`,
        type: 'user',
        severity: 'medium',
        title: 'Inactive user account',
        description: `${user.name || user.email || 'A user'} is currently inactive.`,
        actionLabel: 'Manage Users',
        actionHref: '/dashboard/admin/users',
        createdAt: null,
      })
    })

    const { data: riskyProjects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, health_status, status, deadline, created_at')
      .in('health_status', ['warning', 'critical'])
      .order('created_at', { ascending: false })

    if (projectsError) {
      throw projectsError
    }

    ;(riskyProjects ?? []).forEach((project) => {
      alerts.push({
        id: `project-${project.id}`,
        type: 'project',
        severity: project.health_status === 'critical' ? 'high' : 'medium',
        title: `Project health is ${project.health_status}`,
        description: `${project.title} needs attention.`,
        actionLabel: 'View Projects',
        actionHref: '/dashboard/admin',
        createdAt: project.created_at,
      })
    })

    const { data: projects, error: allProjectsError } = await supabase
      .from('projects')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })

    if (allProjectsError) {
      throw allProjectsError
    }

    for (const project of projects ?? []) {
      const { data: groups } = await supabase
        .from('groups')
        .select('id')
        .eq('project_id', project.id)

      const groupIds = (groups ?? []).map((group) => group.id)

      if (groupIds.length === 0) continue

      const { data: members } = await supabase
        .from('group_members')
        .select('student_id')
        .in('group_id', groupIds)

      const studentIds = [
        ...new Set((members ?? []).map((member) => member.student_id)),
      ]

      if (studentIds.length === 0) continue

      const { data: workLogs } = await supabase
        .from('work_logs')
        .select('student_id')
        .eq('project_id', project.id)

      const studentsWithLogs = new Set(
        (workLogs ?? []).map((log) => log.student_id)
      )

      const studentsWithoutLogs = studentIds.filter(
        (studentId) => !studentsWithLogs.has(studentId)
      )

      if (studentsWithoutLogs.length > 0) {
        alerts.push({
          id: `fairness-worklogs-${project.id}`,
          type: 'fairness',
          severity: 'medium',
          title: 'Students missing work logs',
          description: `${studentsWithoutLogs.length} student(s) in ${project.title} have no work logs yet.`,
          actionLabel: 'View Reports',
          actionHref: '/dashboard/admin/reports',
          createdAt: project.created_at,
        })
      }
    }

    const severityOrder = {
      high: 1,
      medium: 2,
      low: 3,
    }

    alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]

      if (severityDiff !== 0) return severityDiff

      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0

      return bTime - aTime
    })

    return NextResponse.json({
      alerts,
      summary: {
        total: alerts.length,
        high: alerts.filter((alert) => alert.severity === 'high').length,
        medium: alerts.filter((alert) => alert.severity === 'medium').length,
        low: alerts.filter((alert) => alert.severity === 'low').length,
      },
    })
  } catch (error) {
    console.error('Error fetching admin alerts:', error)

    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}