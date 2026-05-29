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
        { error: 'Only admins can access AI summary' },
        { status: 403 }
      ),
    }
  }

  return { supabase, error: null }
}

function buildFallbackSummary(input: {
  totalUsers: number
  inactiveUsers: number
  totalProjects: number
  warningProjects: number
  criticalProjects: number
  pendingDisputes: number
  totalWorkLogs: number
  totalPeerRatings: number
}) {
  const risks: string[] = []
  const actions: string[] = []

  if (input.pendingDisputes > 0) {
    risks.push(`${input.pendingDisputes} pending dispute(s) need admin review.`)
    actions.push('Open the Disputes page and resolve or reject pending claims.')
  }

  if (input.criticalProjects > 0) {
    risks.push(`${input.criticalProjects} project(s) are marked critical.`)
    actions.push('Review critical project health and contact assigned teachers.')
  }

  if (input.warningProjects > 0) {
    risks.push(`${input.warningProjects} project(s) are in warning state.`)
    actions.push('Check project reports for missing work logs or low activity.')
  }

  if (input.inactiveUsers > 0) {
    risks.push(`${input.inactiveUsers} inactive user account(s) exist.`)
    actions.push('Review inactive users and activate/deactivate accounts as needed.')
  }

  if (risks.length === 0) {
    risks.push('No major system risks detected right now.')
    actions.push('Continue monitoring alerts, reports, and disputes regularly.')
  }

  return {
    summary:
      'The system is operational. Admin should continue monitoring projects, disputes, inactive accounts, and fairness contribution activity.',
    risks,
    actions,
    generatedBy: 'fallback',
  }
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
    ] = await Promise.all([
      supabase.from('users').select('id, role, status'),
      supabase.from('projects').select('id, title, status, health_status'),
      supabase.from('disputes').select('id, status'),
      supabase.from('work_logs').select('id'),
      supabase.from('peer_ratings').select('id'),
    ])

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

    const input = {
      totalUsers: users.length,
      teachers: users.filter((user) => user.role === 'teacher').length,
      students: users.filter((user) => user.role === 'student').length,
      inactiveUsers: users.filter((user) => user.status === 'inactive').length,
      totalProjects: projects.length,
      activeProjects: projects.filter((project) => project.status === 'active')
        .length,
      completedProjects: projects.filter(
        (project) => project.status === 'completed'
      ).length,
      warningProjects: projects.filter(
        (project) => project.health_status === 'warning'
      ).length,
      criticalProjects: projects.filter(
        (project) => project.health_status === 'critical'
      ).length,
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
    }

    const apiKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY

    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

    if (!apiKey) {
      return NextResponse.json(buildFallbackSummary(input))
    }

    const prompt = `
You are an admin assistant for a university project fairness monitoring system.

Analyze this live system data and return ONLY valid JSON in this exact format:
{
  "summary": "2-3 sentence admin summary",
  "risks": ["risk 1", "risk 2", "risk 3"],
  "actions": ["action 1", "action 2", "action 3"],
  "generatedBy": "ai"
}

System data:
${JSON.stringify(input, null, 2)}

Rules:
- Be concise.
- Focus on admin actions.
- Mention disputes, critical projects, inactive users, missing contribution signals if relevant.
- Do not use markdown.
`

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    )

    if (!aiRes.ok) {
      return NextResponse.json(buildFallbackSummary(input))
    }

    const aiData = await aiRes.json()
    const text =
      aiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

    try {
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleanText)

      return NextResponse.json({
        summary:
          typeof parsed.summary === 'string'
            ? parsed.summary
            : buildFallbackSummary(input).summary,
        risks: Array.isArray(parsed.risks)
          ? parsed.risks.slice(0, 4)
          : buildFallbackSummary(input).risks,
        actions: Array.isArray(parsed.actions)
          ? parsed.actions.slice(0, 4)
          : buildFallbackSummary(input).actions,
        generatedBy: 'ai',
      })
    } catch {
      return NextResponse.json(buildFallbackSummary(input))
    }
  } catch (error) {
    console.error('Error generating admin AI summary:', error)

    return NextResponse.json(
      { error: 'Failed to generate admin AI summary' },
      { status: 500 }
    )
  }
}