import { NextResponse } from 'next/server'

interface SupportRequest {
  question?: string
}

function generateFallbackSupportAnswer(question: string) {
  const lowerQuestion = question.toLowerCase()

  if (
    lowerQuestion.includes('dispute') ||
    lowerQuestion.includes('unfair') ||
    lowerQuestion.includes('rating')
  ) {
    return `## Support Answer

If you believe your score or peer rating is unfair, you can create a dispute from your Student Project page.

## Steps

1. Open your assigned project.
2. Go to the Create Dispute section.
3. Select a related rating if available, or choose a general project dispute.
4. Write a clear reason.
5. Add evidence such as work logs, screenshots, GitHub commits, documents, or task links.
6. Submit the dispute.

## Tip

A strong dispute should include clear evidence. Admins review disputes manually, and AI only provides review assistance.`
  }

  if (
    lowerQuestion.includes('fairness score') ||
    lowerQuestion.includes('score') ||
    lowerQuestion.includes('calculated')
  ) {
    return `## Support Answer

Fairness score is based on multiple contribution signals.

## Main Components

- Peer score: feedback and ratings from group members.
- Effort score: submitted work logs and contribution evidence.
- Teacher score: teacher evaluation of your contribution.
- Overall score: combined score from these components.

## Tip

To improve your score, submit consistent work logs, attach evidence, communicate with your group, and complete assigned tasks.`
  }

  if (
    lowerQuestion.includes('work log') ||
    lowerQuestion.includes('submit work') ||
    lowerQuestion.includes('evidence')
  ) {
    return `## Support Answer

Students can submit work logs from their project workspace.

## Steps

1. Open your Student Dashboard.
2. Open the assigned project.
3. Go to Submit Work Log.
4. Enter week number.
5. Describe your contribution clearly.
6. Add an evidence link if available.
7. Click Submit Work Log.

## Tip

Use the Improve with AI button to make your work log clearer before submitting.`
  }

  if (
    lowerQuestion.includes('teacher') ||
    lowerQuestion.includes('create project') ||
    lowerQuestion.includes('group')
  ) {
    return `## Support Answer

Teachers can manage projects from the Teacher Dashboard.

## Teacher Actions

- Create new projects.
- Set project title, description, and deadline.
- Manage project status and health.
- Create groups and assign students.
- Review fairness reports.
- Generate AI summaries for project risk and fairness reports.

## Tip

Use the Reports page to view peer score, effort score, teacher score, and overall fairness score.`
  }

  if (
    lowerQuestion.includes('admin') ||
    lowerQuestion.includes('resolve') ||
    lowerQuestion.includes('review')
  ) {
    return `## Support Answer

Admins manage system-level review tasks.

## Admin Actions

- Manage users.
- Review alerts.
- Review student disputes.
- Add admin comments.
- Resolve or reject disputes after reviewing evidence.
- Use AI Dispute Review Assistant for neutral review guidance.

## Important

AI does not make final decisions. Admins should review evidence manually before resolving or rejecting disputes.`
  }

  return `## Support Answer

Fairness Engine helps teachers, students, and admins manage group project fairness.

## Main Features

- Teachers create projects, manage groups, and review reports.
- Students submit work logs, rate peers, view scores, and create disputes.
- Admins manage users, alerts, and dispute decisions.
- AI assists with project insights, report summaries, score explanations, work log improvement, and dispute review.

## Tip

Ask a more specific question such as:
- How do I submit a work log?
- How is fairness score calculated?
- How do I create a dispute?
- How does admin review disputes?`
}

export async function POST(request: Request) {
  try {
    const { question } = (await request.json()) as SupportRequest

    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: 'Support question is required.' },
        { status: 400 }
      )
    }

    const safeQuestion = question.trim().slice(0, 1000)
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        answer: generateFallbackSupportAnswer(safeQuestion),
        source: 'fallback',
        note: 'Gemini API key is missing. Showing generated local support answer.',
      })
    }

    const prompt = `
You are the AI Support Assistant for a web app called Fairness Engine.

Fairness Engine is a fairness-based group project management system with these roles:
- Teacher: creates projects, manages groups, evaluates students, views fairness reports.
- Student: views assigned projects, submits work logs, rates peers, views fairness score, creates disputes.
- Admin: manages users, alerts, and dispute resolution.

AI features already available:
- Teacher project insights
- Teacher fairness report summaries
- Student score explanations
- Student work log improvement
- Admin dispute review guidance

Task:
Answer the user's support question clearly and practically.

Rules:
- Be concise and helpful.
- Do not invent unavailable features.
- Do not make final grading or dispute decisions.
- Use step-by-step guidance when useful.
- Return sections with markdown headings when helpful.

User question:
${safeQuestion}
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
        'Gemini request failed. Showing generated local support answer.'

      const isQuotaError =
        message.toLowerCase().includes('quota') ||
        message.toLowerCase().includes('rate limit') ||
        message.toLowerCase().includes('exceeded')

      if (isQuotaError) {
        return NextResponse.json({
          answer: generateFallbackSupportAnswer(safeQuestion),
          source: 'fallback',
          note: 'Gemini quota exceeded. Showing generated local support answer.',
        })
      }

      return NextResponse.json({ error: message }, { status: response.status })
    }

    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      generateFallbackSupportAnswer(safeQuestion)

    return NextResponse.json({
      answer,
      source: 'gemini',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate support answer.',
      },
      { status: 500 }
    )
  }
}