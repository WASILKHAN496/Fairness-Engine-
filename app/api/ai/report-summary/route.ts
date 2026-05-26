import { NextResponse } from 'next/server'

interface ScoreInput {
  studentId?: string
  studentName?: string
  studentEmail?: string | null
  peerAverageRating?: number
  peerScore?: number
  peerRatingCount?: number
  effortScore?: number
  workLogCount?: number
  teacherScore?: number
  fairnessScore?: number
  workContribution?: number
  peerRatingScore?: number
  teacherEvaluationScore?: number
  overallScore?: number
  status?: string
}

function generateFallbackReportSummary({
  projectTitle,
  scores,
}: {
  projectTitle: string
  scores: ScoreInput[]
}) {
  const totalStudents = scores.length

  const averageScore =
    totalStudents > 0
      ? Math.round(
          scores.reduce(
            (sum, score) => sum + Number(score.overallScore ?? 0),
            0
          ) / totalStudents
        )
      : 0

  const excellentStudents = scores.filter(
    (score) => score.status === 'excellent'
  )

  const goodStudents = scores.filter((score) => score.status === 'good')

  const fairStudents = scores.filter((score) => score.status === 'fair')

  const poorStudents = scores.filter((score) => score.status === 'poor')

  const lowScoreStudents = scores
    .filter((score) => Number(score.overallScore ?? 0) < 50)
    .slice(0, 5)

  const weakWorkLogStudents = scores
    .filter((score) => Number(score.workLogCount ?? 0) === 0)
    .slice(0, 5)

  const weakPeerRatingStudents = scores
    .filter((score) => Number(score.peerRatingCount ?? 0) === 0)
    .slice(0, 5)

  const lowScoreNames =
    lowScoreStudents
      .map((score) => score.studentName || 'Unknown student')
      .join(', ') || 'None'

  const weakWorkLogNames =
    weakWorkLogStudents
      .map((score) => score.studentName || 'Unknown student')
      .join(', ') || 'None'

  const weakPeerRatingNames =
    weakPeerRatingStudents
      .map((score) => score.studentName || 'Unknown student')
      .join(', ') || 'None'

  return `## Summary

${projectTitle} currently has ${totalStudents} student(s) in the fairness report with an average fairness score of ${averageScore}/100. There are ${excellentStudents.length} excellent, ${goodStudents.length} good, ${fairStudents.length} fair, and ${poorStudents.length} poor performance record(s).

## Key Risks

- Low-score students needing attention: ${lowScoreNames}.
- Students with no submitted work logs: ${weakWorkLogNames}.
- Students with no peer ratings recorded: ${weakPeerRatingNames}.

## Recommended Actions

- Review students with scores below 50 and compare their peer, effort, and teacher evaluation components.
- Ask students with missing work logs to submit weekly evidence before final grading.
- Use peer rating count and work log count together before making any fairness-related decision.
- Recheck teacher evaluations for students with very low or inconsistent scores.`
}

export async function POST(request: Request) {
  try {
    const { projectTitle, scores } = (await request.json()) as {
      projectTitle?: string
      scores?: ScoreInput[]
    }

    if (!projectTitle) {
      return NextResponse.json(
        { error: 'Project title is required.' },
        { status: 400 }
      )
    }

    if (!Array.isArray(scores)) {
      return NextResponse.json(
        { error: 'Scores array is required.' },
        { status: 400 }
      )
    }

    const safeScores = scores.slice(0, 60).map((score) => ({
      studentName: score.studentName ?? 'Unknown student',
      studentEmail: score.studentEmail ?? null,
      peerScore: Number(score.peerScore ?? score.peerRatingScore ?? 0),
      peerAverageRating: Number(score.peerAverageRating ?? 0),
      peerRatingCount: Number(score.peerRatingCount ?? 0),
      effortScore: Number(score.effortScore ?? score.workContribution ?? 0),
      workLogCount: Number(score.workLogCount ?? 0),
      teacherScore: Number(
        score.teacherScore ?? score.teacherEvaluationScore ?? 0
      ),
      overallScore: Number(score.overallScore ?? score.fairnessScore ?? 0),
      status: score.status ?? 'poor',
    }))

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        summary: generateFallbackReportSummary({
          projectTitle,
          scores: safeScores,
        }),
        source: 'fallback',
        note: 'Gemini API key is missing. Showing generated local report summary.',
      })
    }

    const prompt = `
You are an academic fairness report assistant for teachers.

Task:
Analyze the fairness report data for this project and generate a professional teacher summary.

Project:
${projectTitle}

Rules:
- Be concise and practical.
- Do not make disciplinary decisions.
- Do not accuse students.
- Focus on fairness monitoring, missing evidence, score risks, and teacher next steps.
- Return sections:
  1. Summary
  2. Key Risks
  3. Recommended Actions

Scores:
${JSON.stringify(safeScores, null, 2)}
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
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      const message =
        data?.error?.message ||
        'Gemini request failed. Showing generated local report summary.'

      const isQuotaError =
        message.toLowerCase().includes('quota') ||
        message.toLowerCase().includes('rate limit') ||
        message.toLowerCase().includes('exceeded')

      if (isQuotaError) {
        return NextResponse.json({
          summary: generateFallbackReportSummary({
            projectTitle,
            scores: safeScores,
          }),
          source: 'fallback',
          note: 'Gemini quota exceeded. Showing generated local report summary.',
        })
      }

      return NextResponse.json({ error: message }, { status: response.status })
    }

    const summary =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      generateFallbackReportSummary({
        projectTitle,
        scores: safeScores,
      })

    return NextResponse.json({
      summary,
      source: 'gemini',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate AI report summary.',
      },
      { status: 500 }
    )
  }
}