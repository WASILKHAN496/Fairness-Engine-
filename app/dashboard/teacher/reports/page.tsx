'use client'

import BackLoadingButton from '@/components/back-loading-button'
import AppLoading from '@/components/app-loading'
import TeacherNav from '@/components/navigation/teacher-nav'
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
import { useProjects } from '@/hooks/useProjects'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type ScoreFilter = 'all' | 'excellent' | 'good' | 'fair' | 'poor'

function getStatusBadgeClass(status: string) {
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

function getScoreTextClass(score: number) {
  if (score >= 85) return 'text-green-600 dark:text-green-300'
  if (score >= 70) return 'text-blue-600 dark:text-blue-300'
  if (score >= 50) return 'text-yellow-600 dark:text-yellow-300'
  return 'text-red-600 dark:text-red-300'
}

function getScoreBarWidth(score: number) {
  if (!Number.isFinite(score)) return '0%'
  return `${Math.max(0, Math.min(100, score))}%`
}

function formatDate(value?: string | null) {
  if (!value) return 'No deadline'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return date.toLocaleDateString()
}

export default function TeacherReportsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const canFetchProjects = !loading && user?.role === 'teacher'

  const {
    projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjects('teacher', canFetchProjects)

  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all')

  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiSource, setAiSource] = useState<string | null>(null)
  const [aiNote, setAiNote] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'teacher')) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  const {
    scores,
    loading: scoresLoading,
    error: scoresError,
    refetch,
  } = useFairnessScores(selectedProjectId)

  const selectedProject = useMemo(() => {
    return projects.find((project) => project.id === selectedProjectId)
  }, [projects, selectedProjectId])

  const filteredScores = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return scores.filter((score) => {
      const matchesSearch =
        !query ||
        score.studentName.toLowerCase().includes(query) ||
        score.studentEmail?.toLowerCase().includes(query)

      const matchesStatus =
        scoreFilter === 'all' || score.status === scoreFilter

      return matchesSearch && matchesStatus
    })
  }, [scores, searchTerm, scoreFilter])

  const averageScore = useMemo(() => {
    if (scores.length === 0) return 0

    const total = scores.reduce((sum, score) => sum + score.overallScore, 0)
    return Math.round(total / scores.length)
  }, [scores])

  const excellentCount = scores.filter(
    (score) => score.status === 'excellent'
  ).length

  const lowScoreCount = scores.filter((score) => score.overallScore < 50).length

  const highestScore = scores.length
    ? Math.max(...scores.map((score) => score.overallScore))
    : 0

  const lowestScore = scores.length
    ? Math.min(...scores.map((score) => score.overallScore))
    : 0

  const handleGenerateAiSummary = async () => {
    if (!selectedProject) {
      setAiError('Please select a project first.')
      return
    }

    setAiLoading(true)
    setAiError(null)
    setAiSummary(null)
    setAiSource(null)
    setAiNote(null)

    try {
      const res = await fetch('/api/ai/report-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          projectTitle: selectedProject.title,
          scores,
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to generate AI report summary')
      }

      setAiSummary(payload.summary || 'No AI summary generated.')
      setAiSource(payload.source || null)
      setAiNote(payload.note || null)
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : 'Failed to generate AI report summary'
      )
    } finally {
      setAiLoading(false)
    }
  }

  if (loading || projectsLoading) {
    return (
      <AppLoading
        title="Preparing reports dashboard"
        subtitle="Loading project analytics, score breakdowns, and fairness reports."
      />
    )
  }

  if (!user || user.role !== 'teacher') {
    return null
  }

  return (
    <div className="min-h-svh bg-background">
      <TeacherNav />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="page-hero slide-up">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="page-kicker">Teacher Analytics</p>

              <h1 className="page-title">Fairness Reports</h1>

              <p className="page-subtitle">
                Review contribution patterns, fairness scores, peer ratings,
                work logs, and teacher evaluation impact for every project.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleGenerateAiSummary}
                disabled={aiLoading || scoresLoading || scores.length === 0}
                className="rounded-xl"
              >
                {aiLoading ? 'Generating...' : 'Generate AI Summary'}
              </Button>

              <BackLoadingButton href="/dashboard/teacher">
                Back to Projects
              </BackLoadingButton>
            </div>
          </div>
        </div>

        {projectsError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {projectsError instanceof Error
              ? projectsError.message
              : 'Failed to load projects'}
          </div>
        )}

        {projects.length === 0 ? (
          <Card className="professional-card">
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-semibold text-foreground">
                No projects found
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a project first to generate fairness reports.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="professional-card mb-6">
              <CardContent className="pt-6">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
                  <div>
                    <Label htmlFor="project-select">Select Project</Label>
                    <select
                      id="project-select"
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value)
                        setSearchTerm('')
                        setScoreFilter('all')
                        setAiSummary(null)
                        setAiSource(null)
                        setAiNote(null)
                        setAiError(null)
                      }}
                      className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground"
                    >
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    onClick={() => refetch()}
                    disabled={scoresLoading}
                    className="rounded-xl"
                  >
                    {scoresLoading ? 'Refreshing...' : 'Refresh Report'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleGenerateAiSummary}
                    disabled={aiLoading || scoresLoading || scores.length === 0}
                    className="rounded-xl"
                  >
                    {aiLoading ? 'Generating...' : 'AI Summary'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {selectedProject && (
              <Card className="professional-card mb-6">
                <CardHeader>
                  <CardTitle>{selectedProject.title}</CardTitle>
                </CardHeader>

                <CardContent>
                  {selectedProject.description && (
                    <p className="text-sm leading-6 text-muted-foreground">
                      {selectedProject.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <span className="badge-soft bg-muted text-muted-foreground">
                      Status: {selectedProject.status ?? 'active'}
                    </span>

                    <span className="badge-soft bg-muted text-muted-foreground">
                      Health: {selectedProject.health_status ?? 'healthy'}
                    </span>

                    <span className="badge-soft bg-muted text-muted-foreground">
                      Deadline: {formatDate(selectedProject.deadline)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {(aiSummary || aiError || aiLoading) && (
              <Card className="professional-card mb-6 overflow-hidden">
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>AI Fairness Report Summary</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Smart summary based on student fairness score, peer
                        score, effort score, work logs, and teacher evaluation.
                      </p>
                    </div>

                    {aiSource && (
                      <span className="badge-soft bg-muted text-muted-foreground capitalize">
                        Source: {aiSource}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  {aiLoading && (
                    <div className="rounded-2xl border bg-muted/30 p-5">
                      <p className="text-sm font-medium text-foreground">
                        Generating AI report summary...
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Reviewing student scores, missing work logs, peer
                        ratings, and fairness risks.
                      </p>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full w-1/2 rounded-full bg-primary loading-progress" />
                      </div>
                    </div>
                  )}

                  {aiError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                      {aiError}
                    </div>
                  )}

                  {aiSummary && (
                    <div className="rounded-2xl border bg-muted/25 p-5">
                      {aiNote && (
                        <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/40 dark:text-yellow-200">
                          {aiNote}
                        </div>
                      )}

                      <div className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                        {aiSummary}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {scoresError && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                {scoresError}
              </div>
            )}

            {scoresLoading ? (
              <Card className="professional-card">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading report...</p>
                </CardContent>
              </Card>
            ) : scores.length === 0 ? (
              <Card className="professional-card">
                <CardContent className="py-12 text-center">
                  <h2 className="text-xl font-semibold text-foreground">
                    No report data yet
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add students to groups and collect work logs, peer ratings,
                    and teacher evaluations.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <Card className="professional-card-hover">
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium text-muted-foreground">
                        Average Score
                      </p>
                      <p className="mt-2 text-3xl font-bold text-foreground">
                        {averageScore}/100
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="professional-card-hover">
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium text-muted-foreground">
                        Highest Score
                      </p>
                      <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-300">
                        {highestScore}/100
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="professional-card-hover">
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium text-muted-foreground">
                        Lowest Score
                      </p>
                      <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-300">
                        {lowestScore}/100
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="professional-card-hover">
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium text-muted-foreground">
                        Excellent
                      </p>
                      <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-300">
                        {excellentCount}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="professional-card-hover">
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium text-muted-foreground">
                        Needs Attention
                      </p>
                      <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-300">
                        {lowScoreCount}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="professional-card mb-6">
                  <CardHeader>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <CardTitle>Student Performance Report</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Showing {filteredScores.length} of {scores.length}{' '}
                          student score(s).
                        </p>
                      </div>

                      <div className="grid gap-2 md:grid-cols-2">
                        <Input
                          placeholder="Search student..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="rounded-xl"
                        />

                        <select
                          value={scoreFilter}
                          onChange={(e) =>
                            setScoreFilter(e.target.value as ScoreFilter)
                          }
                          className="rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                        >
                          <option value="all">All Statuses</option>
                          <option value="excellent">Excellent</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                          <option value="poor">Poor</option>
                        </select>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {filteredScores.length === 0 ? (
                      <div className="py-12 text-center">
                        <h2 className="text-xl font-semibold text-foreground">
                          No matching records
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Try changing search or status filter.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border">
                        <table className="smooth-table min-w-[780px]">
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th>Status</th>
                              <th>Peer</th>
                              <th>Effort</th>
                              <th>Teacher</th>
                              <th className="text-right">Overall</th>
                            </tr>
                          </thead>

                          <tbody>
                            {filteredScores.map((score) => (
                              <tr key={score.studentId}>
                                <td>
                                  <p className="font-semibold text-foreground">
                                    {score.studentName}
                                  </p>
                                  {score.studentEmail && (
                                    <p className="text-xs text-muted-foreground">
                                      {score.studentEmail}
                                    </p>
                                  )}
                                </td>

                                <td>
                                  <span
                                    className={`badge-soft capitalize ${getStatusBadgeClass(
                                      score.status
                                    )}`}
                                  >
                                    {score.status}
                                  </span>
                                </td>

                                <td>
                                  <p className="font-semibold text-foreground">
                                    {score.peerScore}/100
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {score.peerRatingCount} rating(s)
                                  </p>
                                </td>

                                <td>
                                  <p className="font-semibold text-foreground">
                                    {score.effortScore}/100
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {score.workLogCount} log(s)
                                  </p>
                                </td>

                                <td>
                                  <p className="font-semibold text-foreground">
                                    {score.teacherScore}/100
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Evaluation
                                  </p>
                                </td>

                                <td className="text-right">
                                  <p
                                    className={`text-2xl font-bold ${getScoreTextClass(
                                      score.overallScore
                                    )}`}
                                  >
                                    {score.overallScore}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    /100
                                  </p>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  {filteredScores.map((score) => (
                    <Card
                      key={score.studentId}
                      className="professional-card-hover"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle className="text-lg">
                              {score.studentName}
                            </CardTitle>

                            {score.studentEmail && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {score.studentEmail}
                              </p>
                            )}

                            <span
                              className={`mt-3 inline-flex ${getStatusBadgeClass(
                                score.status
                              )} rounded-full px-3 py-1 text-xs font-semibold capitalize`}
                            >
                              {score.status}
                            </span>
                          </div>

                          <div className="text-right">
                            <p
                              className={`text-3xl font-bold ${getScoreTextClass(
                                score.overallScore
                              )}`}
                            >
                              {score.overallScore}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              /100
                            </p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div>
                          <div className="mb-1 flex justify-between text-xs font-medium text-muted-foreground">
                            <span>Overall Progress</span>
                            <span>{score.overallScore}%</span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: getScoreBarWidth(score.overallScore),
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid gap-3 text-sm md:grid-cols-3">
                          <div className="rounded-xl border bg-muted/30 p-3">
                            <p className="text-xs font-medium text-muted-foreground">
                              Peer
                            </p>
                            <p className="mt-1 font-bold text-foreground">
                              {score.peerScore}/100
                            </p>
                          </div>

                          <div className="rounded-xl border bg-muted/30 p-3">
                            <p className="text-xs font-medium text-muted-foreground">
                              Effort
                            </p>
                            <p className="mt-1 font-bold text-foreground">
                              {score.effortScore}/100
                            </p>
                          </div>

                          <div className="rounded-xl border bg-muted/30 p-3">
                            <p className="text-xs font-medium text-muted-foreground">
                              Teacher
                            </p>
                            <p className="mt-1 font-bold text-foreground">
                              {score.teacherScore}/100
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}