'use client'

import AppLoading from '@/components/app-loading'
import { useAuth } from '@/hooks/useAuth'
import { useProjects } from '@/hooks/useProjects'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import StudentNav from '@/components/navigation/student-nav'

type StatusFilter = 'all' | 'active' | 'completed' | 'archived'

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

export default function StudentDashboard() {
  const { user, loading } = useAuth()
  const canFetchProjects = !loading && user?.role === 'student'

  const {
    projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjects('student', canFetchProjects)

  const router = useRouter()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        project.title?.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'all' || project.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [projects, searchTerm, statusFilter])

  const activeCount = projects.filter((project) => project.status === 'active').length
  const completedCount = projects.filter(
    (project) => project.status === 'completed'
  ).length
  const archivedCount = projects.filter(
    (project) => project.status === 'archived'
  ).length

  if (loading || projectsLoading) {
    return (
      <AppLoading
        title="Preparing student workspace"
        subtitle="Loading assigned projects, work logs, ratings, and fairness data."
      />
    )
  }

  if (!user || user.role !== 'student') {
    return null
  }

  return (
    <div className="min-h-svh bg-background">
      <StudentNav />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="page-hero slide-up">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="page-kicker">Student Workspace</p>

              <h1 className="page-title">My Projects</h1>

              <p className="page-subtitle">
                View assigned group projects, submit work logs, rate peers,
                monitor fairness score, and raise disputes when needed.
              </p>
            </div>

            <div className="rounded-2xl border bg-background/70 p-4 text-sm">
              <p className="font-semibold text-foreground">
                {user.name || 'Student'}
              </p>
              <p className="mt-1 text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Assigned Projects
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {projects.length}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Active
              </p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-300">
                {activeCount}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Completed
              </p>
              <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-300">
                {completedCount}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Archived
              </p>
              <p className="mt-2 text-3xl font-bold text-muted-foreground">
                {archivedCount}
              </p>
            </CardContent>
          </Card>
        </div>

        {projectsError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {projectsError instanceof Error
              ? projectsError.message
              : 'Failed to load projects'}
          </div>
        )}

        <Card className="professional-card mb-6">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Project Library</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Showing {filteredProjects.length} of {projects.length}{' '}
                  assigned project(s).
                </p>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  placeholder="Search projects..."
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
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {projects.length === 0 ? (
          <Card className="professional-card">
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-semibold text-foreground">
                No assigned projects yet
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Once your teacher adds you to a group, assigned projects will
                appear here.
              </p>
            </CardContent>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card className="professional-card">
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-semibold text-foreground">
                No matching projects
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try changing search or status filter.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredProjects.map((project) => {
              const isArchived = project.status === 'archived'

              return (
                <Card key={project.id} className="professional-card-hover">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle>{project.title}</CardTitle>

                        {project.description && (
                          <CardDescription className="mt-2 leading-6">
                            {project.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`badge-soft capitalize ${getStatusBadgeClass(
                            project.status ?? 'active'
                          )}`}
                        >
                          {project.status ?? 'active'}
                        </span>

                        {project.health_status && (
                          <span
                            className={`badge-soft capitalize ${getHealthBadgeClass(
                              project.health_status
                            )}`}
                          >
                            {project.health_status}
                          </span>
                        )}
                      </div>

                      <div className="rounded-xl border bg-muted/30 p-3 text-sm">
                        <p className="font-semibold text-foreground">
                          Deadline
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          {formatDate(project.deadline)}
                        </p>
                      </div>

                      {isArchived && (
                        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/40 dark:text-yellow-200">
                          This project is archived. You can still view its
                          existing details if available.
                        </div>
                      )}

                      <Link href={`/dashboard/student/project/${project.id}`}>
                        <Button className="w-full rounded-xl">
                          View Project
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}