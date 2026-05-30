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
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import useSWR from 'swr'

interface AdminUser {
  id: string
  name: string | null
  email: string | null
  role: 'admin' | 'teacher' | 'student'
  status: 'active' | 'inactive'
}

interface AlertItem {
  id: string
  type: 'dispute' | 'user' | 'project' | 'fairness'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  createdAt?: string | null
}

interface AlertsResponse {
  alerts: AlertItem[]
  summary: {
    total: number
    high: number
    medium: number
    low: number
  }
}

interface Dispute {
  id: string
  status: 'pending' | 'resolved' | 'rejected'
}

interface AdminAiSummary {
  summary: string
  risks: string[]
  actions: string[]
  generatedBy: 'ai' | 'fallback'
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

function getSeverityClass(severity: AlertItem['severity']) {
  if (severity === 'high') {
    return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200'
  }

  if (severity === 'medium') {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-200'
  }

  return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
}

function getModuleCardClass(type: 'users' | 'disputes' | 'alerts') {
  if (type === 'users') {
    return 'from-blue-500/12 to-blue-500/5'
  }

  if (type === 'disputes') {
    return 'from-yellow-500/12 to-yellow-500/5'
  }

  return 'from-red-500/12 to-red-500/5'
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const canFetch = !loading && user?.role === 'admin'

  const {
    data: adminAiSummary,
    error: adminAiSummaryError,
    isLoading: adminAiSummaryLoading,
    mutate: mutateAdminAiSummary,
  } = useSWR<AdminAiSummary>(
    canFetch ? '/api/admin/ai-summary' : null,
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  )

  const {
    data: users,
    error: usersError,
    isLoading: usersLoading,
  } = useSWR<AdminUser[]>(
    canFetch ? '/api/admin/users' : null,
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  )

  const {
    data: alertsData,
    error: alertsError,
    isLoading: alertsLoading,
  } = useSWR<AlertsResponse>(
    canFetch ? '/api/admin/alerts' : null,
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  )

  const {
    data: disputes,
    error: disputesError,
    isLoading: disputesLoading,
  } = useSWR<Dispute[]>(
    canFetch ? '/api/disputes' : null,
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  )

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading || usersLoading || alertsLoading || disputesLoading) {
    return (
      <AppLoading
        title="Preparing admin dashboard"
        subtitle="Loading users, alerts, disputes, and system monitoring data."
      />
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  const totalUsers = users?.length ?? 0
  const activeUsers =
    users?.filter((item) => item.status === 'active').length ?? 0
  const teachers = users?.filter((item) => item.role === 'teacher').length ?? 0
  const students = users?.filter((item) => item.role === 'student').length ?? 0
  const inactiveUsers =
    users?.filter((item) => item.status === 'inactive').length ?? 0

  const pendingDisputes =
    disputes?.filter((item) => item.status === 'pending').length ?? 0
  const resolvedDisputes =
    disputes?.filter((item) => item.status === 'resolved').length ?? 0
  const rejectedDisputes =
    disputes?.filter((item) => item.status === 'rejected').length ?? 0

  const totalAlerts = alertsData?.summary.total ?? 0
  const highAlerts = alertsData?.summary.high ?? 0
  const mediumAlerts = alertsData?.summary.medium ?? 0

  return (
    <div className="min-h-svh bg-background">
      <AdminNav />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="page-hero slide-up">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="page-kicker">Admin Overview</p>

              <h1 className="page-title">System Dashboard</h1>

              <p className="page-subtitle">
                Monitor users, disputes, alerts, roles, account status, and
                fairness system activity from one professional control center.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/admin/users">
                <Button variant="outline" className="rounded-xl">
                  Manage Users
                </Button>
              </Link>

              <Link href="/dashboard/admin/activity">
                <Button variant="outline" className="rounded-xl">
                  View Activity
                </Button>
              </Link>

              <Link href="/dashboard/admin/alerts">
                <Button className="rounded-xl">View Alerts</Button>
              </Link>
            </div>
          </div>
        </div>

        {(usersError || alertsError || disputesError || adminAiSummaryError) && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {usersError instanceof Error && <p>{usersError.message}</p>}
            {alertsError instanceof Error && <p>{alertsError.message}</p>}
            {disputesError instanceof Error && <p>{disputesError.message}</p>}
            {adminAiSummaryError instanceof Error && (
              <p>{adminAiSummaryError.message}</p>
            )}
          </div>
        )}

        <Card className="professional-card mb-6 overflow-hidden">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>AI System Summary</CardTitle>

                  <span className="inline-flex items-center rounded-full border border-purple-300/40 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-200">
                    AI Powered
                  </span>

                  {adminAiSummary?.generatedBy === 'fallback' && (
                    <span className="inline-flex items-center rounded-full border border-yellow-300/40 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-700 dark:text-yellow-200">
                      Fallback Mode
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Smart admin overview based on users, projects, disputes,
                  alerts, work logs, peer ratings, and project health.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => mutateAdminAiSummary()}
                disabled={adminAiSummaryLoading}
                className="rounded-xl"
              >
                {adminAiSummaryLoading ? 'Refreshing...' : 'Refresh AI'}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {adminAiSummaryLoading ? (
              <div className="rounded-2xl border bg-muted/30 p-5">
                <p className="text-sm font-medium text-foreground">
                  Generating admin AI summary...
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reviewing system health, risks, disputes, users, and
                  contribution activity.
                </p>
              </div>
            ) : adminAiSummary ? (
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-2xl border bg-muted/30 p-5">
                  <p className="text-sm font-semibold text-foreground">
                    System Health Summary
                  </p>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {adminAiSummary.summary}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border bg-red-50 p-5 dark:bg-red-950/20">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-200">
                      Key Risks
                    </p>

                    <ul className="mt-3 space-y-2 text-sm leading-6 text-red-700 dark:text-red-200">
                      {adminAiSummary.risks.map((risk, index) => (
                        <li key={index}>• {risk}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border bg-green-50 p-5 dark:bg-green-950/20">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-200">
                      Recommended Actions
                    </p>

                    <ul className="mt-3 space-y-2 text-sm leading-6 text-green-700 dark:text-green-200">
                      {adminAiSummary.actions.map((action, index) => (
                        <li key={index}>• {action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border bg-muted/30 p-5">
                <p className="text-sm text-muted-foreground">
                  AI summary is not available yet. Click Refresh AI.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Total Users
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {totalUsers}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {teachers} teacher(s), {students} student(s)
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Active Users
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {activeUsers}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {inactiveUsers} inactive account(s)
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Pending Disputes
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {pendingDisputes}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {resolvedDisputes} resolved, {rejectedDisputes} rejected
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                High Alerts
              </p>
              <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-300">
                {highAlerts}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {totalAlerts} total, {mediumAlerts} medium priority
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card
            className={`professional-card-hover bg-gradient-to-br ${getModuleCardClass(
              'users'
            )}`}
          >
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                View registered users, update roles, activate accounts, and
                deactivate suspicious or inactive accounts.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border bg-background/70 p-3">
                  <p className="text-muted-foreground">Teachers</p>
                  <p className="text-xl font-bold text-foreground">
                    {teachers}
                  </p>
                </div>

                <div className="rounded-xl border bg-background/70 p-3">
                  <p className="text-muted-foreground">Students</p>
                  <p className="text-xl font-bold text-foreground">
                    {students}
                  </p>
                </div>
              </div>

              <Link href="/dashboard/admin/users">
                <Button className="mt-5 w-full rounded-xl">Open Users</Button>
              </Link>
            </CardContent>
          </Card>

          <Card
            className={`professional-card-hover bg-gradient-to-br ${getModuleCardClass(
              'disputes'
            )}`}
          >
            <CardHeader>
              <CardTitle>Dispute Resolution</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Review student disputes, add admin comments, and resolve or
                reject submitted claims fairly.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border bg-background/70 p-3">
                  <p className="text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold text-foreground">
                    {pendingDisputes}
                  </p>
                </div>

                <div className="rounded-xl border bg-background/70 p-3">
                  <p className="text-muted-foreground">Resolved</p>
                  <p className="text-xl font-bold text-foreground">
                    {resolvedDisputes}
                  </p>
                </div>
              </div>

              <Link href="/dashboard/admin/disputes">
                <Button className="mt-5 w-full rounded-xl" variant="outline">
                  Open Disputes
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card
            className={`professional-card-hover bg-gradient-to-br ${getModuleCardClass(
              'alerts'
            )}`}
          >
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Monitor pending disputes, inactive accounts, project warnings,
                missing work logs, and fairness risks.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border bg-background/70 p-3">
                  <p className="text-muted-foreground">High</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-300">
                    {highAlerts}
                  </p>
                </div>

                <div className="rounded-xl border bg-background/70 p-3">
                  <p className="text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-foreground">
                    {totalAlerts}
                  </p>
                </div>
              </div>

              <Link href="/dashboard/admin/alerts">
                <Button className="mt-5 w-full rounded-xl" variant="outline">
                  Open Alerts
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="professional-card mt-6">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Recent Alerts</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Latest system warnings requiring attention.
                </p>
              </div>

              <Link href="/dashboard/admin/alerts">
                <Button variant="outline" className="rounded-xl">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent>
            {!alertsData?.alerts || alertsData.alerts.length === 0 ? (
              <div className="rounded-2xl border bg-muted/40 p-6 text-center">
                <h3 className="text-lg font-semibold text-foreground">
                  No active alerts
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  The system is currently clear.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alertsData.alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="professional-card-hover flex flex-col justify-between gap-3 p-4 md:flex-row md:items-center"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`badge-soft capitalize ${getSeverityClass(
                            alert.severity
                          )}`}
                        >
                          {alert.severity}
                        </span>

                        <span className="badge-soft bg-muted text-muted-foreground">
                          {alert.type}
                        </span>
                      </div>

                      <p className="mt-3 font-semibold text-foreground">
                        {alert.title}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {alert.description}
                      </p>
                    </div>

                    {alert.actionHref && alert.actionLabel && (
                      <Link href={alert.actionHref}>
                        <Button
                          variant="outline"
                          className="w-full rounded-xl md:w-auto"
                        >
                          {alert.actionLabel}
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}