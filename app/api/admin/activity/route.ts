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
        { error: 'Only admins can access activity logs' },
        { status: 403 }
      ),
    }
  }

  return { supabase, error: null }
}

function sortByDateDesc<T extends { created_at: string | null }>(items: T[]) {
  return items.sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0

    return bTime - aTime
  })
}

function getSeverity(entityType: string, action: string) {
  const lowerAction = action.toLowerCase()

  if (
    entityType === 'dispute' ||
    lowerAction.includes('critical') ||
    lowerAction.includes('rejected')
  ) {
    return 'high'
  }

  if (
    lowerAction.includes('warning') ||
    lowerAction.includes('inactive') ||
    lowerAction.includes('pending')
  ) {
    return 'medium'
  }

  return 'low'
}

export async function GET() {
  try {
    const { supabase, error } = await requireAdmin()

    if (error) return error

    const [
      activityLogsResult,
      usersResult,
      projectsResult,
      disputesResult,
      workLogsResult,
      peerRatingsResult,
      messagesResult,
      evaluationsResult,
    ] = await Promise.all([
      supabase
        .from('activity_logs')
        .select(
          'id, user_id, role, action, description, entity_type, entity_id, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(80),

      supabase.from('users').select('id, name, email, role, status'),

      supabase
        .from('projects')
        .select('id, title, teacher_id, status, health_status, created_at'),

      supabase
        .from('disputes')
        .select('id, student_id, project_id, reason, status, created_at'),

      supabase
        .from('work_logs')
        .select('id, student_id, project_id, week_no, created_at'),

      supabase
        .from('peer_ratings')
        .select('id, rater_id, rated_student_id, project_id, rating, created_at'),

      supabase
        .from('project_messages')
        .select('id, project_id, sender_id, receiver_id, created_at'),

      supabase
        .from('teacher_evaluations')
        .select('id, teacher_id, student_id, project_id, score, created_at'),
    ])

    if (activityLogsResult.error) throw activityLogsResult.error
    if (usersResult.error) throw usersResult.error
    if (projectsResult.error) throw projectsResult.error
    if (disputesResult.error) throw disputesResult.error
    if (workLogsResult.error) throw workLogsResult.error
    if (peerRatingsResult.error) throw peerRatingsResult.error

    const users = usersResult.data ?? []
    const projects = projectsResult.data ?? []
    const disputes = disputesResult.data ?? []
    const workLogs = workLogsResult.data ?? []
    const peerRatings = peerRatingsResult.data ?? []
    const manualLogs = activityLogsResult.data ?? []

    const messages =
      messagesResult.error || !messagesResult.data ? [] : messagesResult.data

    const evaluations =
      evaluationsResult.error || !evaluationsResult.data
        ? []
        : evaluationsResult.data

    const getUserName = (id?: string | null) => {
      if (!id) return 'System'
      const user = users.find((item) => item.id === id)
      return user?.name || user?.email || 'Unknown user'
    }

    const getUserRole = (id?: string | null) => {
      if (!id) return 'system'
      const user = users.find((item) => item.id === id)
      return user?.role || 'user'
    }

    const getProjectTitle = (id?: string | null) => {
      if (!id) return 'Unknown project'
      const project = projects.find((item) => item.id === id)
      return project?.title || 'Unknown project'
    }

    const manualActivities = manualLogs.map((log) => ({
      id: log.id,
      source: 'logged' as const,
      actorName: getUserName(log.user_id),
      actorRole: log.role || getUserRole(log.user_id),
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      description: log.description,
      created_at: log.created_at,
      severity: getSeverity(log.entity_type, log.action),
    }))

    const generatedActivities = [
      ...projects.map((project) => ({
        id: `project-${project.id}`,
        source: 'generated' as const,
        actorName: getUserName(project.teacher_id),
        actorRole: 'teacher',
        action: 'Project Created',
        entityType: 'project',
        entityId: project.id,
        description: `${project.title} was created or added to the system.`,
        created_at: project.created_at,
        severity:
          project.health_status === 'critical'
            ? 'high'
            : project.health_status === 'warning'
              ? 'medium'
              : 'low',
      })),

      ...disputes.map((dispute) => ({
        id: `dispute-${dispute.id}`,
        source: 'generated' as const,
        actorName: getUserName(dispute.student_id),
        actorRole: 'student',
        action:
          dispute.status === 'pending'
            ? 'Dispute Submitted'
            : `Dispute ${dispute.status}`,
        entityType: 'dispute',
        entityId: dispute.id,
        description: `${getUserName(dispute.student_id)} submitted a dispute for ${getProjectTitle(
          dispute.project_id
        )}.`,
        created_at: dispute.created_at,
        severity: dispute.status === 'pending' ? 'high' : 'low',
      })),

      ...workLogs.map((log) => ({
        id: `work-log-${log.id}`,
        source: 'generated' as const,
        actorName: getUserName(log.student_id),
        actorRole: 'student',
        action: 'Work Log Submitted',
        entityType: 'work_log',
        entityId: log.id,
        description: `${getUserName(log.student_id)} submitted week ${
          log.week_no
        } work log for ${getProjectTitle(log.project_id)}.`,
        created_at: log.created_at,
        severity: 'low',
      })),

      ...peerRatings.map((rating) => ({
        id: `peer-rating-${rating.id}`,
        source: 'generated' as const,
        actorName: getUserName(rating.rater_id),
        actorRole: 'student',
        action: 'Peer Rating Submitted',
        entityType: 'peer_rating',
        entityId: rating.id,
        description: `${getUserName(rating.rater_id)} rated ${getUserName(
          rating.rated_student_id
        )} in ${getProjectTitle(rating.project_id)}.`,
        created_at: rating.created_at,
        severity: 'low',
      })),

      ...messages.map((message) => ({
        id: `message-${message.id}`,
        source: 'generated' as const,
        actorName: getUserName(message.sender_id),
        actorRole: getUserRole(message.sender_id),
        action: 'Project Message Sent',
        entityType: 'message',
        entityId: message.id,
        description: `${getUserName(message.sender_id)} sent a project message in ${getProjectTitle(
          message.project_id
        )}.`,
        created_at: message.created_at,
        severity: 'low',
      })),

      ...evaluations.map((evaluation) => ({
        id: `evaluation-${evaluation.id}`,
        source: 'generated' as const,
        actorName: getUserName(evaluation.teacher_id),
        actorRole: 'teacher',
        action: 'Teacher Evaluation Submitted',
        entityType: 'evaluation',
        entityId: evaluation.id,
        description: `${getUserName(evaluation.teacher_id)} submitted a score for ${getUserName(
          evaluation.student_id
        )} in ${getProjectTitle(evaluation.project_id)}.`,
        created_at: evaluation.created_at,
        severity: 'low',
      })),
    ]

    const activities = sortByDateDesc([
      ...manualActivities,
      ...generatedActivities,
    ]).slice(0, 150)

    return NextResponse.json({
      activities,
      summary: {
        total: activities.length,
        high: activities.filter((item) => item.severity === 'high').length,
        medium: activities.filter((item) => item.severity === 'medium').length,
        low: activities.filter((item) => item.severity === 'low').length,
        projects: projects.length,
        disputes: disputes.length,
        workLogs: workLogs.length,
        peerRatings: peerRatings.length,
        messages: messages.length,
        evaluations: evaluations.length,
      },
    })
  } catch (error) {
    console.error('Error fetching admin activity:', error)

    return NextResponse.json(
      { error: 'Failed to fetch admin activity' },
      { status: 500 }
    )
  }
}