import { NextResponse } from 'next/server'

function generateFallbackImprovedWorkLog({
  description,
  weekNo,
  evidenceLink,
}: {
  description: string
  weekNo?: string | number | null
  evidenceLink?: string | null
}) {
  const weekText = weekNo ? `During week ${weekNo}, ` : 'This week, '
  const cleanDescription = description.trim()

  return `${weekText}I contributed to the project by working on: ${cleanDescription}. I focused on completing assigned tasks, improving project quality, and supporting overall group progress.${
    evidenceLink
      ? ` Evidence of this contribution is available here: ${evidenceLink}.`
      : ' I should attach a relevant evidence link, such as a GitHub commit, document, screenshot, or task record, to make this work log stronger.'
  }`
}

export async function POST(request: Request) {
  try {
    const { description, weekNo, evidenceLink } = (await request.json()) as {
      description?: string
      weekNo?: string | number | null
      evidenceLink?: string | null
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Work description is required.' },
        { status: 400 }
      )
    }

    const safeDescription = description.trim().slice(0, 1500)
    const safeWeekNo = weekNo ?? null
    const safeEvidenceLink = evidenceLink?.trim() || null

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        improvedText: generateFallbackImprovedWorkLog({
          description: safeDescription,
          weekNo: safeWeekNo,
          evidenceLink: safeEvidenceLink,
        }),
        source: 'fallback',
        note: 'Gemini API key is missing. Showing generated local improvement.',
      })
    }

    const prompt = `
You are an academic writing assistant for student project work logs.

Task:
Improve the student's work log description.

Rules:
- Keep the meaning truthful.
- Do not invent tasks, tools, links, commits, screenshots, or achievements.
- Make it clear, professional, and specific.
- Keep it suitable for a university group project tracking system.
- Write in first person.
- Return only the improved work log paragraph.
- If evidence link is missing, gently mention that evidence should be attached.

Week number:
${safeWeekNo ?? 'Not provided'}

Original work description:
${safeDescription}

Evidence link:
${safeEvidenceLink ?? 'Not provided'}
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
        'Gemini request failed. Showing generated local improvement.'

      const isQuotaError =
        message.toLowerCase().includes('quota') ||
        message.toLowerCase().includes('rate limit') ||
        message.toLowerCase().includes('exceeded')

      if (isQuotaError) {
        return NextResponse.json({
          improvedText: generateFallbackImprovedWorkLog({
            description: safeDescription,
            weekNo: safeWeekNo,
            evidenceLink: safeEvidenceLink,
          }),
          source: 'fallback',
          note: 'Gemini quota exceeded. Showing generated local improvement.',
        })
      }

      return NextResponse.json({ error: message }, { status: response.status })
    }

    const improvedText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      generateFallbackImprovedWorkLog({
        description: safeDescription,
        weekNo: safeWeekNo,
        evidenceLink: safeEvidenceLink,
      })

    return NextResponse.json({
      improvedText,
      source: 'gemini',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to improve work log.',
      },
      { status: 500 }
    )
  }
}