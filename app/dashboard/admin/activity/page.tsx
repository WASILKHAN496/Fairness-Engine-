'use client'

import AppLoading from '@/components/app-loading'
import AdminNav from '@/components/navigation/admin-nav'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

interface ActivityItem {
  id: string
  source: 'logged' | 'generated'
  actorName: string
  actorRole: string
  action: string
  entityType: string
  entityId: string | null
  description: string
  created_at: string | null
  severity: 'high' | 'medium' | 'low'
}

interface ActivityResponse {
  activities: ActivityItem[]
  summary: {
    total: number
    high: number
    medium: number
    low: number
    projects: number
    disputes: number
    workLogs: number
    peerRatings: number
    messages: number
    evaluations: number
  }
}

type SeverityFilter = 'all' | 'high' | 'medium' | 'low'
type EntityFilter =
  | 'all'
  | 'project'
  | 'dispute'
  | 'work_log'
  | 'peer_rating'
  | 'message'
  | 'evaluation'

async function fetcher(url: string) {
  const res = await fetch(url, {
    credentials: 'include',
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to fetch activity logs')
  }

  return data
}

function formatDate(value?: string | null) {
  if (!value) return 'No date'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Invalid date'

  return date.toLocaleString()
}

function getSeverityBadge(severity: ActivityItem['severity']) {
  if (severity === 'high') {
    return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200'
  }

  if (severity === 'medium') {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-200'
  }

  return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
}

function getSeverityDot(severity: ActivityItem['severity']) {
  if (severity === 'high') return 'bg-red-500'
  if (severity === 'medium') return 'bg-yellow-500'
  return 'bg-blue-500'
}

function getEntityBadge(entityType: string) {
  if (entityType === 'project') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
  }

  if (entityType === 'dispute') {
    return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200'
  }

  if (entityType === 'work_log') {
    return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200'
  }

  if (entityType === 'peer_rating') {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-200'
  }

  if (entityType === 'message') {
    return 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-200'
  }

  if (entityType === 'evaluation') {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-200'
  }

  return 'bg-muted text-muted-foreground'
}

function formatEntityLabel(value: string) {
  return value.replace(/_/g, ' ')
}

export default function AdminActivityPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const canFetchActivity = !loading && user?.role === 'admin'

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<ActivityResponse>(
    canFetchActivity ? '/api/admin/activity' : null,
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const activities = data?.activities ?? []

  const filteredActivities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return activities.filter((activity) => {
      const matchesSearch =
        !query ||
        activity.action.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        activity.actorName.toLowerCase().includes(query)

      const matchesSeverity =
        severityFilter === 'all' || activity.severity === severityFilter

      const matchesEntity =
        entityFilter === 'all' || activity.entityType === entityFilter

      return matchesSearch && matchesSeverity && matchesEntity
    })
  }, [activities, searchTerm, severityFilter, entityFilter])

  if (loading || isLoading) {
    return (
      <AppLoading
        title="Preparing activity logs"
        subtitle="Loading projects, disputes, work logs, messages, ratings, and evaluations."
      />
    )
  }

  if (!user || user.role !== 'admin') return null

  const summary = data?.summary ?? {
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
    projects: 0,
    disputes: 0,
    workLogs: 0,
    peerRatings: 0,
    messages: 0,
    evaluations: 0,
  }

  const latestHigh = filteredActivities.filter(
    (activity) => activity.severity === 'high'
  )

  return (
    <div className="min-h-svh bg-background">
      <AdminNav />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="page-hero slide-up">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="page-kicker">Admin Activity Monitor</p>

              <h1 className="page-title">Activity Logs</h1>

              <p className="page-subtitle">
                Track projects, disputes, work logs, peer ratings, teacher
                evaluations, and project messages from one clean admin activity
                center.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => mutate()}
                disabled={isLoading}
                className="rounded-xl"
              >
                Refresh
              </Button>

              <Link href="/dashboard/admin">
                <Button variant="outline" className="rounded-xl">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error instanceof Error
              ? error.message
              : 'Failed to load activity logs'}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Total Activity
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {summary.total}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Generated + logged activity
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                High Priority
              </p>
              <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-300">
                {summary.high}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Needs admin attention
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Work Logs
              </p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-300">
                {summary.workLogs}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Contribution records
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Messages
              </p>
              <p className="mt-2 text-3xl font-bold text-pink-600 dark:text-pink-300">
                {summary.messages}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Project conversations
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Projects
              </p>
              <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-300">
                {summary.projects}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Disputes
              </p>
              <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-300">
                {summary.disputes}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Peer Ratings
              </p>
              <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-300">
                {summary.peerRatings}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Evaluations
              </p>
              <p className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-300">
                {summary.evaluations}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card className="professional-card">
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Activity Feed</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Showing {filteredActivities.length} of {activities.length}{' '}
                    activity item(s).
                  </p>
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                  <Input
                    placeholder="Search activity..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="rounded-xl"
                  />

                  <select
                    value={severityFilter}
                    onChange={(e) =>
                      setSeverityFilter(e.target.value as SeverityFilter)
                    }
                    className="rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="all">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  <select
                    value={entityFilter}
                    onChange={(e) =>
                      setEntityFilter(e.target.value as EntityFilter)
                    }
                    className="rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="all">All Types</option>
                    <option value="project">Projects</option>
                    <option value="dispute">Disputes</option>
                    <option value="work_log">Work Logs</option>
                    <option value="peer_rating">Peer Ratings</option>
                    <option value="message">Messages</option>
                    <option value="evaluation">Evaluations</option>
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {filteredActivities.length === 0 ? (
                <div className="py-12 text-center">
                  <h2 className="text-xl font-semibold text-foreground">
                    No activity found
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try changing search or filters.
                  </p>
                </div>
              ) : (
                <div className="relative space-y-4">
                  {filteredActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-2xl border bg-background p-5 transition hover:bg-muted/30"
                    >
                      <div className="flex gap-4">
                        <div className="pt-1">
                          <span
                            className={`block h-3 w-3 rounded-full ${getSeverityDot(
                              activity.severity
                            )}`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`badge-soft capitalize ${getSeverityBadge(
                                activity.severity
                              )}`}
                            >
                              {activity.severity}
                            </span>

                            <span
                              className={`badge-soft capitalize ${getEntityBadge(
                                activity.entityType
                              )}`}
                            >
                              {formatEntityLabel(activity.entityType)}
                            </span>

                            <span className="badge-soft bg-muted text-muted-foreground">
                              {activity.source}
                            </span>

                            <span className="text-xs text-muted-foreground">
                              {formatDate(activity.created_at)}
                            </span>
                          </div>

                          <h3 className="mt-3 text-lg font-semibold text-foreground">
                            {activity.action}
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {activity.description}
                          </p>

                          <p className="mt-3 text-xs text-muted-foreground">
                            Actor:{' '}
                            <span className="font-medium text-foreground">
                              {activity.actorName}
                            </span>{' '}
                            • Role: {activity.actorRole}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="professional-card">
              <CardHeader>
                <CardTitle>Activity Mix</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Distribution of system activity.
                </p>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {[
                    ['Projects', summary.projects],
                    ['Disputes', summary.disputes],
                    ['Work Logs', summary.workLogs],
                    ['Peer Ratings', summary.peerRatings],
                    ['Messages', summary.messages],
                    ['Evaluations', summary.evaluations],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold text-foreground">
                          {value}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.min(
                              100,
                              summary.total
                                ? (Number(value) / summary.total) * 100
                                : 0
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle>High Priority</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Latest items that need attention.
                </p>
              </CardHeader>

              <CardContent>
                {latestHigh.length === 0 ? (
                  <div className="rounded-2xl border bg-muted/30 p-5 text-center">
                    <h3 className="font-semibold text-foreground">
                      No high priority activity
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      The system currently has no urgent activity.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {latestHigh.slice(0, 5).map((activity) => (
                      <div
                        key={activity.id}
                        className="rounded-xl border bg-red-50 p-4 dark:bg-red-950/20"
                      >
                        <p className="text-sm font-semibold text-red-700 dark:text-red-200">
                          {activity.action}
                        </p>

                        <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                          {formatDate(activity.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}