'use client'

import AppLoading from '@/components/app-loading'
import StudentNav from '@/components/navigation/student-nav'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useFairnessScores } from '@/hooks/useFairnessScores'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

interface Project {
  id: string
  title: string
  description: string | null
  deadline: string | null
  status: string
  health_status: string
}

interface Student {
  id: string
  name: string
  email: string
}

interface GroupMember {
  id: string
  student_id: string
  student: Student | null
}

interface Group {
  id: string
  group_name: string
  project_id: string
  group_members: GroupMember[]
}

interface WorkLog {
  id: string
  student_id: string
  project_id: string
  week_no: number
  work_description: string
  evidence_link: string | null
  created_at: string
}

interface PeerRating {
  id: string
  rater_id: string
  rated_student_id: string
  project_id: string
  rating: number
  feedback: string | null
  rater?: Student | null
  rated_student?: Student | null
}

interface Dispute {
  id: string
  student_id: string
  project_id: string
  rating_id: string | null
  reason: string
  evidence: string | null
  status: string
  admin_comment: string | null
}

async function fetcher(url: string) {
  const res = await fetch(url, {
    credentials: 'include',
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to fetch data')
  }

  return data
}

function formatDate(value: string | null) {
  if (!value) return 'No deadline'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return date.toLocaleDateString()
}

function getStatusBadgeClass(status: string) {
  if (status === 'active') {
    return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200'
  }

  if (status === 'completed') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
  }

  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/70 dark:text-gray-200'
}

function getHealthBadgeClass(status: string) {
  if (status === 'healthy') {
    return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200'
  }

  if (status === 'good') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
  }

  if (status === 'warning') {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-200'
  }

  return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200'
}

function getFairnessStatusBadge(status: string) {
  if (status === 'excellent') {
    return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200'
  }

  if (status === 'good') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
  }

  if (status === 'fair') {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-200'
  }

  return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200'
}

function getDisputeBadge(status: string) {
  if (status === 'resolved') {
    return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200'
  }

  if (status === 'rejected') {
    return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200'
  }

  return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-200'
}

function getScoreTextClass(score: number) {
  if (score >= 85) return 'text-green-600 dark:text-green-300'
  if (score >= 70) return 'text-blue-600 dark:text-blue-300'
  if (score >= 50) return 'text-yellow-600 dark:text-yellow-300'
  return 'text-red-600 dark:text-red-300'
}

function getScoreWidth(score: number) {
  if (!Number.isFinite(score)) return '0%'
  return `${Math.max(0, Math.min(100, score))}%`
}

export default function StudentProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const { user, loading: userLoading } = useAuth()

  const {
    data: project,
    error: projectError,
    isLoading: projectLoading,
  } = useSWR<Project>(
    projectId ? `/api/projects?id=${encodeURIComponent(projectId)}` : null,
    fetcher
  )

  const {
    data: groups,
    error: groupsError,
    isLoading: groupsLoading,
  } = useSWR<Group[]>(
    projectId ? `/api/groups?projectId=${encodeURIComponent(projectId)}` : null,
    fetcher
  )

  const {
    data: workLogs,
    error: workLogsError,
    isLoading: workLogsLoading,
    mutate: mutateWorkLogs,
  } = useSWR<WorkLog[]>(
    projectId
      ? `/api/work-logs?projectId=${encodeURIComponent(projectId)}`
      : null,
    fetcher
  )

  const {
    data: peerRatings,
    error: peerRatingsError,
    isLoading: peerRatingsLoading,
    mutate: mutatePeerRatings,
  } = useSWR<PeerRating[]>(
    projectId
      ? `/api/peer-ratings?projectId=${encodeURIComponent(projectId)}`
      : null,
    fetcher
  )

  const {
    data: disputes,
    error: disputesError,
    isLoading: disputesLoading,
    mutate: mutateDisputes,
  } = useSWR<Dispute[]>(
    projectId ? `/api/disputes?projectId=${encodeURIComponent(projectId)}` : null,
    fetcher
  )

  const {
    scores,
    loading: scoresLoading,
    error: scoresError,
  } = useFairnessScores(projectId)

  const [workForm, setWorkForm] = useState({
    week_no: '',
    work_description: '',
    evidence_link: '',
  })

  const [ratingForm, setRatingForm] = useState({
    rated_student_id: '',
    rating: '5',
    feedback: '',
  })

  const [disputeForm, setDisputeForm] = useState({
    rating_id: '',
    reason: '',
    evidence: '',
  })

  const [workError, setWorkError] = useState<string | null>(null)
  const [ratingError, setRatingError] = useState<string | null>(null)
  const [disputeError, setDisputeError] = useState<string | null>(null)

  const [workSubmitting, setWorkSubmitting] = useState(false)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [disputeSubmitting, setDisputeSubmitting] = useState(false)

  useEffect(() => {
    if (!userLoading && (!user || user.role !== 'student')) {
      router.push('/auth/login')
    }
  }, [user, userLoading, router])

  const myGroup = useMemo(() => {
    if (!groups || !user) return null

    return groups.find((group) =>
      group.group_members?.some((member) => member.student_id === user.id)
    )
  }, [groups, user])

  const myGroupMembers = useMemo(() => {
    if (!myGroup || !user) return []

    return (
      myGroup.group_members?.filter((member) => member.student_id !== user.id) ??
      []
    )
  }, [myGroup, user])

  const receivedRatings = useMemo(() => {
    if (!peerRatings || !user) return []

    return peerRatings.filter((rating) => rating.rated_student_id === user.id)
  }, [peerRatings, user])

  const myScore = useMemo(() => {
    if (!user) return null

    return scores.find((score) => score.studentId === user.id) ?? scores[0]
  }, [scores, user])

  const myWorkLogs = useMemo(() => {
    if (!workLogs || !user) return []

    return workLogs.filter((log) => log.student_id === user.id)
  }, [workLogs, user])

  const handleSubmitWorkLog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setWorkSubmitting(true)
    setWorkError(null)

    try {
      const res = await fetch('/api/work-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          project_id: projectId,
          week_no: Number(workForm.week_no),
          work_description: workForm.work_description,
          evidence_link: workForm.evidence_link,
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to submit work log')
      }

      setWorkForm({
        week_no: '',
        work_description: '',
        evidence_link: '',
      })

      await mutateWorkLogs()
    } catch (error) {
      setWorkError(
        error instanceof Error ? error.message : 'Failed to submit work log'
      )
    } finally {
      setWorkSubmitting(false)
    }
  }

  const handleSubmitPeerRating = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setRatingSubmitting(true)
    setRatingError(null)

    try {
      const res = await fetch('/api/peer-ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          project_id: projectId,
          rated_student_id: ratingForm.rated_student_id,
          rating: Number(ratingForm.rating),
          feedback: ratingForm.feedback,
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to submit peer rating')
      }

      setRatingForm({
        rated_student_id: '',
        rating: '5',
        feedback: '',
      })

      await mutatePeerRatings()
    } catch (error) {
      setRatingError(
        error instanceof Error ? error.message : 'Failed to submit peer rating'
      )
    } finally {
      setRatingSubmitting(false)
    }
  }

  const handleSubmitDispute = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setDisputeSubmitting(true)
    setDisputeError(null)

    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          project_id: projectId,
          rating_id: disputeForm.rating_id || null,
          reason: disputeForm.reason,
          evidence: disputeForm.evidence,
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to create dispute')
      }

      setDisputeForm({
        rating_id: '',
        reason: '',
        evidence: '',
      })

      await mutateDisputes()
    } catch (error) {
      setDisputeError(
        error instanceof Error ? error.message : 'Failed to create dispute'
      )
    } finally {
      setDisputeSubmitting(false)
    }
  }

  const loading =
    userLoading ||
    projectLoading ||
    groupsLoading ||
    workLogsLoading ||
    peerRatingsLoading ||
    disputesLoading ||
    scoresLoading

    if (loading) {
      return (
        <AppLoading
          title="Preparing student project"
          subtitle="Loading your group, work logs, peer ratings, disputes, and fairness score."
        />
      )
    }

  if (!user || user.role !== 'student') {
    return null
  }

  if (projectError) {
    return (
      <div className="min-h-svh bg-background">
        <StudentNav />
        <main className="container mx-auto max-w-7xl px-4 py-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            Back
          </Button>

          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {projectError instanceof Error
              ? projectError.message
              : 'Failed to load project'}
          </div>
        </main>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-svh bg-background">
        <StudentNav />
        <main className="container mx-auto max-w-7xl px-4 py-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            Back
          </Button>

          <div className="mt-6 rounded-xl border bg-muted/40 p-6 text-center">
            <h2 className="text-xl font-semibold text-foreground">
              Project not found
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This project may be unavailable or no longer assigned to you.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <StudentNav />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="page-hero slide-up">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="mb-4 rounded-xl"
              >
                Back
              </Button>

              <p className="page-kicker">Student Project Workspace</p>
              <h1 className="page-title">{project.title}</h1>

              {project.description && (
                <p className="page-subtitle">{project.description}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`badge-soft capitalize ${getStatusBadgeClass(
                    project.status
                  )}`}
                >
                  {project.status ?? 'active'}
                </span>

                <span
                  className={`badge-soft capitalize ${getHealthBadgeClass(
                    project.health_status
                  )}`}
                >
                  {project.health_status ?? 'healthy'}
                </span>

                <span className="badge-soft bg-muted text-muted-foreground">
                  Deadline: {formatDate(project.deadline)}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <Card className="professional-card">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Work Logs</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {myWorkLogs.length}
                  </p>
                </CardContent>
              </Card>

              <Card className="professional-card">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Ratings In</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {receivedRatings.length}
                  </p>
                </CardContent>
              </Card>

              <Card className="professional-card">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Disputes</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {disputes?.length ?? 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {(groupsError ||
          workLogsError ||
          peerRatingsError ||
          disputesError ||
          scoresError) && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {groupsError instanceof Error && <p>{groupsError.message}</p>}
            {workLogsError instanceof Error && <p>{workLogsError.message}</p>}
            {peerRatingsError instanceof Error && (
              <p>{peerRatingsError.message}</p>
            )}
            {disputesError instanceof Error && <p>{disputesError.message}</p>}
            {scoresError && <p>{scoresError}</p>}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-8">
            <Card className="professional-card">
              <CardHeader>
                <CardTitle>My Fairness Score</CardTitle>
              </CardHeader>

              <CardContent>
                {myScore ? (
                  <div className="space-y-5">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Overall Score
                        </p>
                        <p
                          className={`mt-1 text-5xl font-bold ${getScoreTextClass(
                            myScore.overallScore
                          )}`}
                        >
                          {myScore.overallScore}
                        </p>
                        <p className="text-xs text-muted-foreground">/100</p>
                      </div>

                      <span
                        className={`badge-soft capitalize ${getFairnessStatusBadge(
                          myScore.status
                        )}`}
                      >
                        {myScore.status}
                      </span>
                    </div>

                    <div>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{myScore.overallScore}%</span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: getScoreWidth(myScore.overallScore),
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm sm:grid-cols-3">
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Peer</p>
                        <p className="mt-1 font-bold text-foreground">
                          {myScore.peerScore}/100
                        </p>
                      </div>

                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Effort</p>
                        <p className="mt-1 font-bold text-foreground">
                          {myScore.effortScore}/100
                        </p>
                      </div>

                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">
                          Teacher
                        </p>
                        <p className="mt-1 font-bold text-foreground">
                          {myScore.teacherScore}/100
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-xl border bg-background/70 p-3">
                        <p className="text-muted-foreground">Work Logs</p>
                        <p className="mt-1 font-semibold text-foreground">
                          {myScore.workLogCount}
                        </p>
                      </div>

                      <div className="rounded-xl border bg-background/70 p-3">
                        <p className="text-muted-foreground">
                          Peer Ratings Received
                        </p>
                        <p className="mt-1 font-semibold text-foreground">
                          {myScore.peerRatingCount}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <h2 className="text-lg font-semibold text-foreground">
                      No fairness score yet
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Your score will appear after enough work logs, peer
                      ratings, and teacher evaluation data are available.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle>My Group</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {myGroup?.group_name ?? 'Group information'}
                </p>
              </CardHeader>

              <CardContent>
                {myGroupMembers.length > 0 ? (
                  <div className="space-y-2">
                    {myGroupMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-3 text-sm"
                      >
                        <span className="font-medium text-foreground">
                          {member.student?.name ?? 'Unknown student'}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {member.student?.email ?? member.student_id}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No other members found in your group.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle>My Work Logs</CardTitle>
              </CardHeader>

              <CardContent>
                {myWorkLogs.length > 0 ? (
                  <div className="space-y-4">
                    {myWorkLogs.map((log) => (
                      <div key={log.id} className="rounded-2xl border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-foreground">
                            Week {log.week_no}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(log.created_at)}
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {log.work_description}
                        </p>

                        {log.evidence_link && (
                          <a
                            href={log.evidence_link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex text-sm font-medium text-primary underline"
                          >
                            View evidence
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No work logs submitted yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="professional-card">
              <CardHeader>
                <CardTitle>Submit Work Log</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Record your weekly contribution with optional evidence.
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmitWorkLog} className="space-y-4">
                  <div>
                    <Label htmlFor="week-no">Week Number</Label>
                    <Input
                      id="week-no"
                      type="number"
                      min="1"
                      value={workForm.week_no}
                      onChange={(e) =>
                        setWorkForm({
                          ...workForm,
                          week_no: e.target.value,
                        })
                      }
                      disabled={workSubmitting}
                      required
                      className="mt-2 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="work-description">Work Description</Label>
                    <textarea
                      id="work-description"
                      value={workForm.work_description}
                      onChange={(e) =>
                        setWorkForm({
                          ...workForm,
                          work_description: e.target.value,
                        })
                      }
                      disabled={workSubmitting}
                      required
                      className="mt-2 flex min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="Describe what you contributed this week..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="evidence-link">Evidence Link</Label>
                    <Input
                      id="evidence-link"
                      type="url"
                      value={workForm.evidence_link}
                      onChange={(e) =>
                        setWorkForm({
                          ...workForm,
                          evidence_link: e.target.value,
                        })
                      }
                      disabled={workSubmitting}
                      placeholder="https://..."
                      className="mt-2 rounded-xl"
                    />
                  </div>

                  {workError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                      {workError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={workSubmitting}
                    className="rounded-xl"
                  >
                    {workSubmitting ? 'Submitting...' : 'Submit Work Log'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle>Submit Peer Rating</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Rate another member of your group based on contribution.
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmitPeerRating} className="space-y-4">
                  <div>
                    <Label htmlFor="rated-student">Student</Label>
                    <select
                      id="rated-student"
                      value={ratingForm.rated_student_id}
                      onChange={(e) =>
                        setRatingForm({
                          ...ratingForm,
                          rated_student_id: e.target.value,
                        })
                      }
                      disabled={ratingSubmitting}
                      required
                      className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                    >
                      <option value="">Select student</option>
                      {myGroupMembers.map((member) => (
                        <option key={member.id} value={member.student_id}>
                          {member.student?.name ?? member.student_id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="rating">Rating</Label>
                    <select
                      id="rating"
                      value={ratingForm.rating}
                      onChange={(e) =>
                        setRatingForm({
                          ...ratingForm,
                          rating: e.target.value,
                        })
                      }
                      disabled={ratingSubmitting}
                      className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                    >
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Average</option>
                      <option value="2">2 - Poor</option>
                      <option value="1">1 - Very Poor</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="feedback">Feedback</Label>
                    <textarea
                      id="feedback"
                      value={ratingForm.feedback}
                      onChange={(e) =>
                        setRatingForm({
                          ...ratingForm,
                          feedback: e.target.value,
                        })
                      }
                      disabled={ratingSubmitting}
                      className="mt-2 flex min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="Optional feedback..."
                    />
                  </div>

                  {ratingError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                      {ratingError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={ratingSubmitting}
                    className="rounded-xl"
                  >
                    {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle>Create Dispute</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Raise a dispute if you believe your evaluation is unfair.
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmitDispute} className="space-y-4">
                  <div>
                    <Label htmlFor="rating-id">Rating to Dispute</Label>
                    <select
                      id="rating-id"
                      value={disputeForm.rating_id}
                      onChange={(e) =>
                        setDisputeForm({
                          ...disputeForm,
                          rating_id: e.target.value,
                        })
                      }
                      disabled={disputeSubmitting}
                      className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                    >
                      <option value="">General project dispute</option>
                      {receivedRatings.map((rating) => (
                        <option key={rating.id} value={rating.id}>
                          Rating {rating.rating}/5 from{' '}
                          {rating.rater?.name ?? 'another student'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <textarea
                      id="reason"
                      value={disputeForm.reason}
                      onChange={(e) =>
                        setDisputeForm({
                          ...disputeForm,
                          reason: e.target.value,
                        })
                      }
                      disabled={disputeSubmitting}
                      required
                      className="mt-2 flex min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="Explain why you are submitting this dispute..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="evidence">Evidence</Label>
                    <textarea
                      id="evidence"
                      value={disputeForm.evidence}
                      onChange={(e) =>
                        setDisputeForm({
                          ...disputeForm,
                          evidence: e.target.value,
                        })
                      }
                      disabled={disputeSubmitting}
                      className="mt-2 flex min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="Optional evidence or explanation..."
                    />
                  </div>

                  {disputeError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                      {disputeError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={disputeSubmitting}
                    className="rounded-xl"
                  >
                    {disputeSubmitting ? 'Submitting...' : 'Create Dispute'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle>My Disputes</CardTitle>
              </CardHeader>

              <CardContent>
                {disputes && disputes.length > 0 ? (
                  <div className="space-y-4">
                    {disputes.map((dispute) => (
                      <div key={dispute.id} className="rounded-2xl border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span
                            className={`badge-soft capitalize ${getDisputeBadge(
                              dispute.status
                            )}`}
                          >
                            {dispute.status}
                          </span>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {dispute.reason}
                        </p>

                        {dispute.evidence && (
                          <div className="mt-3 rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
                            {dispute.evidence}
                          </div>
                        )}

                        {dispute.admin_comment && (
                          <div className="mt-3 rounded-xl border bg-background/70 p-3 text-sm">
                            <p className="font-semibold text-foreground">
                              Admin Comment
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              {dispute.admin_comment}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No disputes submitted yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}