import { NextResponse } from 'next/server'

interface StudentScoreInput {
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

interface ProjectInput {
  title?: string | null
  description?: string | null
  status?: string | null
  health_status?: string | null
  deadline?: string | null
}

function generateFallbackExplanation({
  project,
  score,
}: {
  project: ProjectInput
  score: StudentScoreInput
}) {
  const studentName = score.studentName || 'Student'
  const projectTitle = project.title || 'this project'

  const overallScore = Number(score.overallScore ?? score.fairnessScore ?? 0)
  const peerScore = Number(score.peerScore ?? score.peerRatingScore ?? 0)
  const effortScore = Number(score.effortScore ?? score.workContribution ?? 0)
  const teacherScore = Number(
    score.teacherScore ?? score.teacherEvaluationScore ?? 0
  )
  const workLogCount = Number(score.workLogCount ?? 0)
  const peerRatingCount = Number(score.peerRatingCount ?? 0)
  const status = score.status || 'poor'

  const weakAreas: string[] = []

  if (peerScore < 60) {
    weakAreas.push('peer rating score')
  }

  if (effortScore < 60 || workLogCount === 0) {
    weakAreas.push('effort/work log score')
  }

  if (teacherScore < 60) {
    weakAreas.push('teacher evaluation score')
  }

  const weakAreaText =
    weakAreas.length > 0
      ? weakAreas.join(', ')
      : 'no major weak component detected'

  return `## Score Explanation

${studentName}, your current fairness score for ${projectTitle} is ${overallScore}/100, and your performance status is "${status}". This score is based on your peer rating score, effort score, work log count, and teacher evaluation score.

## Component Breakdown

- Peer Score: ${peerScore}/100 based on ${peerRatingCount} peer rating(s).
- Effort Score: ${effortScore}/100 based on ${workLogCount} submitted work log(s).
- Teacher Score: ${teacherScore}/100 from teacher evaluation.
- Main area to review: ${weakAreaText}.

## What This Means

${
  overallScore >= 85
    ? 'Your contribution looks strong overall. Keep submitting clear work logs and maintaining good collaboration.'
    : overallScore >= 70
      ? 'Your score is good, but there is still room to improve consistency in work logs, peer feedback, or teacher evaluation.'
      : overallScore >= 50
        ? 'Your score is fair. You should improve evidence submission, communication, and visible contribution.'
        : 'Your score needs attention. Missing work logs, low peer feedback, or weak teacher evaluation may be affecting your result.'
}

## Recommended Actions

- Submit clear weekly work logs with evidence links.
- Communicate your contribution with group members and teacher.
- Improve consistency in tasks assigned to you.
- If you believe your score is unfair, create a dispute with proper evidence.`
}

export async function POST(request: Request) {
  try {
    const { project, score } = (await request.json()) as {
      project?: ProjectInput
      score?: StudentScoreInput
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Project data is required.' },
        { status: 400 }
      )
    }

    if (!score) {
      return NextResponse.json(
        { error: 'Student score data is required.' },
        { status: 400 }
      )
    }

    const safeProject: ProjectInput = {
      title: project.title ?? 'Untitled project',
      description: project.description ?? '',
      status: project.status ?? 'active',
      health_status: project.health_status ?? 'healthy',
      deadline: project.deadline ?? null,
    }

    const safeScore: StudentScoreInput = {
      studentName: score.studentName ?? 'Student',
      studentEmail: score.studentEmail ?? null,
      peerAverageRating: Number(score.peerAverageRating ?? 0),
      peerScore: Number(score.peerScore ?? score.peerRatingScore ?? 0),
      peerRatingCount: Number(score.peerRatingCount ?? 0),
      effortScore: Number(score.effortScore ?? score.workContribution ?? 0),
      workLogCount: Number(score.workLogCount ?? 0),
      teacherScore: Number(
        score.teacherScore ?? score.teacherEvaluationScore ?? 0
      ),
      fairnessScore: Number(score.fairnessScore ?? score.overallScore ?? 0),
      overallScore: Number(score.overallScore ?? score.fairnessScore ?? 0),
      status: score.status ?? 'poor',
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        explanation: generateFallbackExplanation({
          project: safeProject,
          score: safeScore,
        }),
        source: 'fallback',
        note: 'Gemini API key is missing. Showing generated local score explanation.',
      })
    }

    const prompt = `
You are a helpful academic fairness assistant for students.

Task:
Explain this student's fairness score in a clear, supportive, and professional way.

Rules:
- Do not blame or accuse the student.
- Do not make final grading decisions.
- Explain which score components affected the result.
- Give practical improvement advice.
- Mention dispute option only if the student believes the score is unfair.
- Return sections:
  1. Score Explanation
  2. Component Breakdown
  3. What This Means
  4. Recommended Actions

Project:
${JSON.stringify(safeProject, null, 2)}

Student Score:
${JSON.stringify(safeScore, null, 2)}
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
        'Gemini request failed. Showing generated local score explanation.'

      const isQuotaError =
        message.toLowerCase().includes('quota') ||
        message.toLowerCase().includes('rate limit') ||
        message.toLowerCase().includes('exceeded')

      if (isQuotaError) {
        return NextResponse.json({
          explanation: generateFallbackExplanation({
            project: safeProject,
            score: safeScore,
          }),
          source: 'fallback',
          note: 'Gemini quota exceeded. Showing generated local score explanation.',
        })
      }

      return NextResponse.json({ error: message }, { status: response.status })
    }

    const explanation =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      generateFallbackExplanation({
        project: safeProject,
        score: safeScore,
      })

    return NextResponse.json({
      explanation,
      source: 'gemini',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate student score explanation.',
      },
      { status: 500 }
    )
  }
}