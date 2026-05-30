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

function formatDate(value?: string | null) {
  if (!value) return 'No date'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return date.toLocaleString()
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

  return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200'
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
        alert.description.toLowerCase().includes(query) ||
        alert.type.toLowerCase().includes(query) ||
        alert.severity.toLowerCase().includes(query)

      const matchesSeverity =
        severityFilter === 'all' || alert.severity === severityFilter

      const matchesType = typeFilter === 'all' || alert.type === typeFilter

      return matchesSearch && matchesSeverity && matchesType
    })
  }, [alerts, searchTerm, severityFilter, typeFilter])

  if (loading || isLoading) {
    return (
      <AppLoading
        title="Preparing alerts center"
        subtitle="Loading disputes, inactive users, risky projects, and fairness warnings."
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
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="page-kicker">Admin Control Center</p>

              <h1 className="page-title">System Alerts</h1>

              <p className="page-subtitle">
                Monitor pending disputes, inactive users, risky projects,
                missing work logs, and fairness warnings from one alert center.
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
              <p className="mt-1 text-xs text-muted-foreground">
                System generated warnings
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
                Medium Priority
              </p>
              <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-300">
                {summary.medium}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Monitor and review
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
              <p className="mt-1 text-xs text-muted-foreground">
                Informational alerts
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
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="rounded-xl"
                />

                <select
                  value={severityFilter}
                  onChange={(event) =>
                    setSeverityFilter(event.target.value as SeverityFilter)
                  }
                  className="rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(event.target.value as TypeFilter)
                  }
                  className="rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="all">All Types</option>
                  <option value="dispute">Disputes</option>
                  <option value="user">Users</option>
                  <option value="project">Projects</option>
                  <option value="fairness">Fairness</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {alerts.length === 0 ? (
              <div className="rounded-2xl border bg-muted/40 p-10 text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  No active alerts
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  The system is currently clear.
                </p>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="rounded-2xl border bg-muted/40 p-10 text-center">
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
                    className="professional-card-hover flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`badge-soft capitalize ${getSeverityClass(
                            alert.severity
                          )}`}
                        >
                          {alert.severity}
                        </span>

                        <span
                          className={`badge-soft capitalize ${getTypeClass(
                            alert.type
                          )}`}
                        >
                          {alert.type}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {formatDate(alert.createdAt)}
                        </span>
                      </div>

                      <h3 className="mt-3 font-semibold text-foreground">
                        {alert.title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
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