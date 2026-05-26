import { NextResponse } from 'next/server'

interface StudentInput {
  id?: string
  name?: string | null
  email?: string | null
}

interface RatingInput {
  id?: string
  rater_id?: string
  rated_student_id?: string
  project_id?: string
  rating?: number
  feedback?: string | null
}

interface DisputeInput {
  id?: string
  student_id?: string
  rating_id?: string | null
  project_id?: string
  reason?: string
  evidence?: string | null
  status?: string
  admin_comment?: string | null
  created_at?: string
  student?: StudentInput | null
  rating?: RatingInput | null
}

function generateFallbackDisputeReview(dispute: DisputeInput) {
  const studentName =
    dispute.student?.name || dispute.student?.email || 'the student'

  const ratingText = dispute.rating
    ? `${dispute.rating.rating}/5 related rating`
    : 'no specific related rating selected'

  const evidenceText = dispute.evidence?.trim()
    ? 'The student has provided evidence that should be checked against work logs, peer ratings, and teacher evaluation.'
    : 'No evidence was provided, so the admin should request stronger evidence before making a final decision.'

  return `## Dispute Summary

${studentName} submitted a dispute with ${ratingText}. The dispute reason should be reviewed carefully alongside project activity, work logs, peer ratings, and teacher evaluation records.

## Evidence Review

${evidenceText}

## Fairness Risk

- The dispute may indicate a mismatch between the student's perceived contribution and the rating/evaluation received.
- If evidence is missing or unclear, the case should not be resolved only from the written claim.
- If the related rating is low, compare it with other peer ratings and submitted work logs.

## Recommended Admin Checks

- Review the student's submitted work logs and evidence links.
- Compare peer ratings received from multiple group members.
- Check whether teacher evaluation supports or contradicts the disputed claim.
- Add a clear admin comment before resolving or rejecting the dispute.

## Suggested Next Action

Do not auto-decide this dispute. Review the evidence first, then resolve if the evidence supports the claim, or reject if the evidence is weak or inconsistent.`
}

export async function POST(request: Request) {
  try {
    const { dispute } = (await request.json()) as {
      dispute?: DisputeInput
    }

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute data is required.' },
        { status: 400 }
      )
    }

    const safeDispute: DisputeInput = {
      id: dispute.id,
      student_id: dispute.student_id,
      rating_id: dispute.rating_id ?? null,
      project_id: dispute.project_id,
      reason: dispute.reason ?? '',
      evidence: dispute.evidence ?? null,
      status: dispute.status ?? 'pending',
      admin_comment: dispute.admin_comment ?? null,
      created_at: dispute.created_at,
      student: dispute.student
        ? {
            id: dispute.student.id,
            name: dispute.student.name ?? null,
            email: dispute.student.email ?? null,
          }
        : null,
      rating: dispute.rating
        ? {
            id: dispute.rating.id,
            rater_id: dispute.rating.rater_id,
            rated_student_id: dispute.rating.rated_student_id,
            project_id: dispute.rating.project_id,
            rating: Number(dispute.rating.rating ?? 0),
            feedback: dispute.rating.feedback ?? null,
          }
        : null,
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        review: generateFallbackDisputeReview(safeDispute),
        source: 'fallback',
        note: 'Gemini API key is missing. Showing generated local dispute review.',
      })
    }

    const prompt = `
You are a neutral academic dispute review assistant for admins.

Task:
Review this student dispute and generate admin guidance.

Rules:
- Do not make the final decision.
- Do not accuse the student or other students.
- Be neutral, professional, and evidence-focused.
- Help admin decide what to check before resolving or rejecting.
- Return sections:
  1. Dispute Summary
  2. Evidence Review
  3. Fairness Risk
  4. Recommended Admin Checks
  5. Suggested Next Action

Dispute:
${JSON.stringify(safeDispute, null, 2)}
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
        'Gemini request failed. Showing generated local dispute review.'

      const isQuotaError =
        message.toLowerCase().includes('quota') ||
        message.toLowerCase().includes('rate limit') ||
        message.toLowerCase().includes('exceeded')

      if (isQuotaError) {
        return NextResponse.json({
          review: generateFallbackDisputeReview(safeDispute),
          source: 'fallback',
          note: 'Gemini quota exceeded. Showing generated local dispute review.',
        })
      }

      return NextResponse.json({ error: message }, { status: response.status })
    }

    const review =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      generateFallbackDisputeReview(safeDispute)

    return NextResponse.json({
      review,
      source: 'gemini',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate dispute review.',
      },
      { status: 500 }
    )
  }
}