import { useCallback, useEffect, useState } from 'react'

export interface FairnessScore {
  studentId: string
  studentName: string
  studentEmail: string | null
  peerAverageRating: number
  peerScore: number
  peerRatingCount: number
  effortScore: number
  workLogCount: number
  teacherScore: number
  fairnessScore: number

  // Backward-compatible fields for existing UI
  workContribution: number
  peerRatingScore: number
  teacherEvaluationScore: number
  overallScore: number

  status: 'excellent' | 'good' | 'fair' | 'poor'
}

interface FairnessScoreApiItem {
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

interface FairnessScoreApiResponse {
  projectId: string
  projectTitle?: string
  weights?: {
    peer: number
    effort: number
    teacher: number
  }
  scores: FairnessScoreApiItem[]
}

function getStatus(score: number): FairnessScore['status'] {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'fair'
  return 'poor'
}

export function useFairnessScores(projectId: string) {
  const [scores, setScores] = useState<FairnessScore[]>([])
  const [loading, setLoading] = useState(Boolean(projectId))
  const [error, setError] = useState<string | null>(null)

  const fetchScores = useCallback(async () => {
    if (!projectId) {
      setScores([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/reports/fairness-score?projectId=${encodeURIComponent(projectId)}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      )

      const payload = (await response.json()) as
        | FairnessScoreApiResponse
        | { error?: string }

      if (!response.ok) {
        throw new Error(
          'error' in payload && payload.error
            ? payload.error
            : 'Failed to fetch fairness scores'
        )
      }

      const data = payload as FairnessScoreApiResponse

      const mappedScores = (data.scores ?? []).map((item) => ({
        ...item,
        studentName: item.studentName ?? 'Unknown',
        workContribution: item.effortScore,
        peerRatingScore: item.peerScore,
        teacherEvaluationScore: item.teacherScore,
        overallScore: item.fairnessScore,
        status: getStatus(item.fairnessScore),
      }))

      setScores(mappedScores)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setScores([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchScores()
  }, [fetchScores])

  return {
    scores,
    loading,
    error,
    refetch: fetchScores,
  }
}