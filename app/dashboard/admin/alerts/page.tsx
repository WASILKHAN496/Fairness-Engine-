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

type SeverityFilter = 'all' | 'high' | 'medium' | 'low'
type TypeFilter = 'all' | 'dispute' | 'user' | 'project' | 'fairness'

async function fetcher(url: string) {
  const res = await fetch(url, {
    credentials: 'include',
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to fetch alerts')
  }

  return data
}

function getSeverityClass(severity: AlertItem['severity']) {
  if (severity === 'high') {
    return 'border-red-200 bg-red-100 text-red-800 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200'
  }

  if (severity === 'medium') {
    return 'border-yellow-200 bg-yellow-100 text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/60 dark:text-yellow-200'
  }

  return 'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-200'
}

function getTypeClass(type: AlertItem['type']) {
  if (type === 'dispute') {
    return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200'
  }

  if (type === 'user') {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-200'
  }

  if (type === 'project') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
  }

  return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
}

function getTypeLabel(type: AlertItem['type']) {
  if (type === 'dispute') return 'Dispute'
  if (type === 'user') return 'User'
  if (type === 'project') return 'Project'
  return 'Fairness'
}

function formatDate(value?: string | null) {
  if (!value) return 'No date'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return date.toLocaleDateString()
}

export default function AdminAlertsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const canFetchAlerts = !loading && user?.role === 'admin'

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<AlertsResponse>(
    canFetchAlerts ? '/api/admin/alerts' : null,
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const alerts = data?.alerts ?? []

  const filteredAlerts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return alerts.filter((alert) => {
      const matchesSearch =
        !query ||
        alert.title.toLowerCase().includes(query) ||
        alert.description.toLowerCase().includes(query)

      const matchesSeverity =
        severityFilter === 'all' || alert.severity === severityFilter

      const matchesType = typeFilter === 'all' || alert.type === typeFilter

      return matchesSearch && matchesSeverity && matchesType
    })
  }, [alerts, searchTerm, severityFilter, typeFilter])

  if (loading || isLoading) {
    return (
      <AppLoading
        title="Preparing system alerts"
        subtitle="Loading disputes, inactive users, project warnings, and fairness risks."
      />
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  const summary = data?.summary ?? {
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
  }

  return (
    <div className="min-h-svh bg-background">
      <AdminNav />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="page-hero slide-up">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="page-kicker">Admin Monitoring</p>

              <h1 className="page-title">System Alerts</h1>

              <p className="page-subtitle">
                Monitor pending disputes, inactive accounts, project health, and
                fairness-related warnings across the system.
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

              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/admin')}
                className="rounded-xl"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error instanceof Error ? error.message : 'Failed to load alerts'}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Total Alerts
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {summary.total}
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
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Medium Priority
              </p>
              <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-300">
                {summary.medium}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Low Priority
              </p>
              <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-300">
                {summary.low}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="professional-card">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Alert Feed</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Showing {filteredAlerts.length} of {alerts.length} alert(s).
                </p>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <Input
                  placeholder="Search alerts..."
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
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                  className="rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="all">All Types</option>
                  <option value="dispute">Dispute</option>
                  <option value="user">User</option>
                  <option value="project">Project</option>
                  <option value="fairness">Fairness</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {alerts.length === 0 ? (
              <div className="py-12 text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  No active alerts
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  The system is currently clear. Pending disputes, inactive
                  accounts, and fairness warnings will appear here.
                </p>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="py-12 text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  No matching alerts
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Try changing search or filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="professional-card-hover p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getSeverityClass(
                              alert.severity
                            )}`}
                          >
                            {alert.severity}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypeClass(
                              alert.type
                            )}`}
                          >
                            {getTypeLabel(alert.type)}
                          </span>

                          <span className="text-xs text-muted-foreground">
                            {formatDate(alert.createdAt)}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-semibold text-foreground">
                          {alert.title}
                        </h3>

                        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
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