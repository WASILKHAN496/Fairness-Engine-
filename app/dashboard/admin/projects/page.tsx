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

interface AdminProject {
  id: string
  title: string
  description: string | null
  teacher_id: string
  deadline: string | null
  status: 'active' | 'completed' | 'archived'
  health_status: 'healthy' | 'good' | 'warning' | 'critical'
  created_at: string
  updated_at: string
  teacher: {
    id: string
    name: string | null
    email: string | null
  } | null
  groupCount: number
  studentCount: number
  workLogCount: number
  disputeCount: number
  pendingDisputeCount: number
  peerRatingCount: number
}

type StatusFilter = 'all' | 'active' | 'completed' | 'archived'
type HealthFilter = 'all' | 'healthy' | 'good' | 'warning' | 'critical'

async function fetcher(url: string) {
  const res = await fetch(url, {
    credentials: 'include',
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to fetch admin projects')
  }

  return data
}

function formatDate(value?: string | null) {
  if (!value) return 'No deadline'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return date.toLocaleDateString()
}

function getStatusBadgeClass(status: AdminProject['status']) {
  if (status === 'active') {
    return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200'
  }

  if (status === 'completed') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
  }

  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/70 dark:text-gray-200'
}

function getHealthBadgeClass(status: AdminProject['health_status']) {
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

export default function AdminProjectsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const canFetchProjects = !loading && user?.role === 'admin'

  const {
    data: projects,
    error,
    isLoading,
    mutate,
  } = useSWR<AdminProject[]>(
    canFetchProjects ? '/api/admin/projects' : null,
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const projectList = projects ?? []

  const activeProjects = projectList.filter(
    (project) => project.status === 'active'
  ).length

  const completedProjects = projectList.filter(
    (project) => project.status === 'completed'
  ).length

  const warningProjects = projectList.filter(
    (project) =>
      project.health_status === 'warning' ||
      project.health_status === 'critical'
  ).length

  const pendingDisputes = projectList.reduce(
    (sum, project) => sum + project.pendingDisputeCount,
    0
  )

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return projectList.filter((project) => {
      const matchesSearch =
        !query ||
        project.title.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.teacher?.name?.toLowerCase().includes(query) ||
        project.teacher?.email?.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'all' || project.status === statusFilter

      const matchesHealth =
        healthFilter === 'all' || project.health_status === healthFilter

      return matchesSearch && matchesStatus && matchesHealth
    })
  }, [projectList, searchTerm, statusFilter, healthFilter])

  if (loading || isLoading) {
    return (
      <AppLoading
        title="Preparing admin projects"
        subtitle="Loading projects, teachers, groups, students, work logs, ratings, and disputes."
      />
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-svh bg-background">
      <AdminNav />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="page-hero slide-up">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="page-kicker">Admin Project Management</p>

              <h1 className="page-title">Projects</h1>

              <p className="page-subtitle">
                Monitor all projects, teachers, groups, student participation,
                work logs, peer ratings, disputes, and health status.
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

              <Link href="/dashboard/admin/reports">
                <Button className="rounded-xl">View Reports</Button>
              </Link>

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
              : 'Failed to load projects'}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Total Projects
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {projectList.length}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Active
              </p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-300">
                {activeProjects}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Completed
              </p>
              <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-300">
                {completedProjects}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Needs Attention
              </p>
              <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-300">
                {warningProjects}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {pendingDisputes} pending dispute(s)
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="professional-card">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Project Feed</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Showing {filteredProjects.length} of {projectList.length}{' '}
                  project(s).
                </p>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <Input
                  placeholder="Search project or teacher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-xl"
                />

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as StatusFilter)
                  }
                  className="rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>

                <select
                  value={healthFilter}
                  onChange={(e) =>
                    setHealthFilter(e.target.value as HealthFilter)
                  }
                  className="rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="all">All Health</option>
                  <option value="healthy">Healthy</option>
                  <option value="good">Good</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filteredProjects.length === 0 ? (
              <div className="py-12 text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  No matching projects
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Try changing search or filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-2xl border p-5 transition hover:bg-muted/20"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`badge-soft capitalize ${getStatusBadgeClass(
                              project.status
                            )}`}
                          >
                            {project.status}
                          </span>

                          <span
                            className={`badge-soft capitalize ${getHealthBadgeClass(
                              project.health_status
                            )}`}
                          >
                            {project.health_status}
                          </span>

                          <span className="badge-soft bg-muted text-muted-foreground">
                            Deadline: {formatDate(project.deadline)}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-semibold text-foreground">
                          {project.title}
                        </h3>

                        {project.description && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                            {project.description}
                          </p>
                        )}

                        <div className="mt-4 rounded-xl border bg-muted/20 p-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Teacher
                          </p>

                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {project.teacher?.name ||
                              project.teacher?.email ||
                              'Unknown teacher'}
                          </p>

                          {project.teacher?.email && (
                            <p className="text-xs text-muted-foreground">
                              {project.teacher.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid min-w-full gap-3 text-sm sm:grid-cols-3 lg:min-w-[420px]">
                        <div className="rounded-xl border bg-background/70 p-3">
                          <p className="text-xs text-muted-foreground">
                            Groups
                          </p>
                          <p className="mt-1 text-xl font-bold text-foreground">
                            {project.groupCount}
                          </p>
                        </div>

                        <div className="rounded-xl border bg-background/70 p-3">
                          <p className="text-xs text-muted-foreground">
                            Students
                          </p>
                          <p className="mt-1 text-xl font-bold text-foreground">
                            {project.studentCount}
                          </p>
                        </div>

                        <div className="rounded-xl border bg-background/70 p-3">
                          <p className="text-xs text-muted-foreground">
                            Work Logs
                          </p>
                          <p className="mt-1 text-xl font-bold text-foreground">
                            {project.workLogCount}
                          </p>
                        </div>

                        <div className="rounded-xl border bg-background/70 p-3">
                          <p className="text-xs text-muted-foreground">
                            Peer Ratings
                          </p>
                          <p className="mt-1 text-xl font-bold text-foreground">
                            {project.peerRatingCount}
                          </p>
                        </div>

                        <div className="rounded-xl border bg-background/70 p-3">
                          <p className="text-xs text-muted-foreground">
                            Disputes
                          </p>
                          <p className="mt-1 text-xl font-bold text-foreground">
                            {project.disputeCount}
                          </p>
                          {project.pendingDisputeCount > 0 && (
                            <p className="text-xs text-red-600 dark:text-red-300">
                              {project.pendingDisputeCount} pending
                            </p>
                          )}
                        </div>

                        <div className="rounded-xl border bg-background/70 p-3">
                          <p className="text-xs text-muted-foreground">
                            Created
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {formatDate(project.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link href="/dashboard/admin/reports">
                        <Button variant="outline" className="rounded-xl">
                          View in Reports
                        </Button>
                      </Link>

                      {project.pendingDisputeCount > 0 && (
                        <Link href="/dashboard/admin/disputes">
                          <Button className="rounded-xl">
                            Review Disputes
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