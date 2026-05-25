import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type FairnessBreakdown = {
  studentId: string
  studentName: string | null
  studentEmail: string | null
  peerAverageRating: number
  peerScore: number
  peerRatingCount: number
  effortScore: number
  workLogCount: number
  teacherScore: number
  fairnessScore: number
}

const WEIGHTS = {
  peer: 0.3,
  effort: 0.3,
  teacher: 0.4,
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10
}

function calculateEffortScore(workLogCount: number) {
  return Math.min(100, workLogCount * 20)
}

function calculatePeerScore(peerAverageRating: number) {
  return Math.min(100, Math.max(0, peerAverageRating * 20))
}

function calculateFairnessScore(params: {
  peerScore: number
  effortScore: number
  teacherScore: number
}) {
  return (
    params.peerScore * WEIGHTS.peer +
    params.effortScore * WEIGHTS.effort +
    params.teacherScore * WEIGHTS.teacher
  )
}

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

async function getProjectStudentIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string
) {
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('id')
    .eq('project_id', projectId)

  if (groupsError) throw groupsError

  if (!groups || groups.length === 0) {
    return []
  }

  const groupIds = groups.map((group) => group.id)

  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('student_id')
    .in('group_id', groupIds)

  if (membersError) throw membersError

  return [...new Set((members ?? []).map((member) => member.student_id))]
}

async function calculateStudentFairnessScore(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  studentId: string
): Promise<FairnessBreakdown> {
  const { data: student } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('id', studentId)
    .single()

  const { data: peerRatings, error: peerRatingsError } = await supabase
    .from('peer_ratings')
    .select('rating')
    .eq('rated_student_id', studentId)
    .eq('project_id', projectId)

  if (peerRatingsError) throw peerRatingsError

  const { data: workLogs, error: workLogsError } = await supabase
    .from('work_logs')
    .select('id')
    .eq('student_id', studentId)
    .eq('project_id', projectId)

  if (workLogsError) throw workLogsError

  const { data: evaluation, error: evaluationError } = await supabase
    .from('teacher_evaluations')
    .select('score')
    .eq('student_id', studentId)
    .eq('project_id', projectId)
    .maybeSingle()

  if (evaluationError) throw evaluationError

  const peerRatingCount = peerRatings?.length ?? 0

  const peerAverageRating =
    peerRatingCount > 0
      ? peerRatings.reduce((sum, item) => sum + Number(item.rating), 0) /
        peerRatingCount
      : 0

  const peerScore = calculatePeerScore(peerAverageRating)
  const workLogCount = workLogs?.length ?? 0
  const effortScore = calculateEffortScore(workLogCount)
  const teacherScore = Number(evaluation?.score ?? 0)

  const fairnessScore = calculateFairnessScore({
    peerScore,
    effortScore,
    teacherScore,
  })

  return {
    studentId,
    studentName: student?.name ?? null,
    studentEmail: student?.email ?? null,
    peerAverageRating: roundOne(peerAverageRating),
    peerScore: roundOne(peerScore),
    peerRatingCount,
    effortScore: roundOne(effortScore),
    workLogCount,
    teacherScore: roundOne(teacherScore),
    fairnessScore: roundOne(fairnessScore),
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

    const projectId = request.nextUrl.searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId' },
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
      return NextResponse.json(
        { error: 'Not authorized to view this project' },
        { status: 403 }
      )
    }

    if (profile.role === 'student') {
      const allowed = await isStudentInProject(supabase, user.id, projectId)

      if (!allowed) {
        return NextResponse.json(
          { error: 'Not authorized to view this project' },
          { status: 403 }
        )
      }
    }

    if (!['teacher', 'admin', 'student'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const studentIds = await getProjectStudentIds(supabase, projectId)

    if (studentIds.length === 0) {
      return NextResponse.json({
        projectId,
        projectTitle: project.title,
        weights: WEIGHTS,
        scores: [],
      })
    }

    let scores = await Promise.all(
      studentIds.map((studentId) =>
        calculateStudentFairnessScore(supabase, projectId, studentId)
      )
    )

    if (profile.role === 'student') {
      scores = scores.filter((score) => score.studentId === user.id)
    }

    return NextResponse.json({
      projectId,
      projectTitle: project.title,
      weights: WEIGHTS,
      scores: scores.sort((a, b) => b.fairnessScore - a.fairnessScore),
    })
  } catch (error) {
    console.error('Error generating fairness report:', error)

    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}