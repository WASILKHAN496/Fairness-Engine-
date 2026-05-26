import { NextResponse } from 'next/server'

interface ProjectInput {
  id?: string
  title?: string | null
  description?: string | null
  status?: string | null
  health_status?: string | null
  deadline?: string | null
}

function generateFallbackInsight(projects: ProjectInput[]) {
  const total = projects.length

  const active = projects.filter(
    (project) => project.status === 'active'
  ).length

  const completed = projects.filter(
    (project) => project.status === 'completed'
  ).length

  const archived = projects.filter(
    (project) => project.status === 'archived'
  ).length

  const riskyProjects = projects.filter(
    (project) =>
      project.health_status === 'warning' ||
      project.health_status === 'critical'
  )

  const riskyTitles = riskyProjects
    .slice(0, 3)
    .map((project) => project.title || 'Untitled project')
    .join(', ')

  return `## Summary

You currently have ${total} project(s): ${active} active, ${completed} completed, and ${archived} archived. ${
    riskyProjects.length > 0
      ? `${riskyProjects.length} project(s) need attention based on warning or critical health status.`
      : 'All visible projects appear stable based on the current health status.'
  }

## Risks

- ${
    riskyProjects.length > 0
      ? `Projects needing attention: ${riskyTitles}.`
      : 'No warning or critical project health status detected.'
  }
- Projects with missing or delayed deadlines should be reviewed regularly.
- Fairness monitoring depends on complete work logs, peer ratings, and teacher evaluations.

## Recommended Actions

- Review warning or critical projects first and check group activity.
- Make sure every student has submitted work logs and peer ratings.
- Use the reports page to compare peer score, effort score, teacher score, and overall fairness score.`
}

export async function POST(request: Request) {
  try {
    const { projects } = (await request.json()) as {
      projects?: ProjectInput[]
    }

    if (!Array.isArray(projects)) {
      return NextResponse.json(
        { error: 'Projects array is required.' },
        { status: 400 }
      )
    }

    const safeProjects = projects.slice(0, 30).map((project) => ({
      title: project.title ?? 'Untitled project',
      description: project.description ?? '',
      status: project.status ?? 'active',
      health_status: project.health_status ?? 'healthy',
      deadline: project.deadline ?? null,
    }))

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        insight: generateFallbackInsight(safeProjects),
        source: 'fallback',
        note: 'Gemini API key is missing. Showing generated local insight.',
      })
    }

    const prompt = `
You are an academic project fairness assistant for teachers.

Task:
Analyze these teacher projects and generate a short dashboard insight.

Rules:
- Be concise and professional.
- Do not make disciplinary decisions.
- Focus on project risk, fairness monitoring, and next actions.
- Return the answer with these sections:
  1. Summary
  2. Risks
  3. Recommended Actions

Projects:
${JSON.stringify(safeProjects, null, 2)}
`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      const message =
        data?.error?.message ||
        'Gemini request failed. Showing generated local insight.'

      const isQuotaError =
        message.toLowerCase().includes('quota') ||
        message.toLowerCase().includes('rate limit') ||
        message.toLowerCase().includes('exceeded')

      if (isQuotaError) {
        return NextResponse.json({
          insight: generateFallbackInsight(safeProjects),
          source: 'fallback',
          note: 'Gemini quota exceeded. Showing generated local insight.',
        })
      }

      return NextResponse.json(
        {
          error: message,
        },
        { status: response.status }
      )
    }

    const insight =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      generateFallbackInsight(safeProjects)

    return NextResponse.json({
      insight,
      source: 'gemini',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate AI insight.',
      },
      { status: 500 }
    )
  }
}