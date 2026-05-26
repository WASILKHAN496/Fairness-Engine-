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
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import TeacherNav from '@/components/navigation/teacher-nav'

type ProjectStatus = 'active' | 'completed' | 'archived'
type HealthStatus = 'healthy' | 'good' | 'warning' | 'critical'
type StatusFilter = 'all' | ProjectStatus
type HealthFilter = 'all' | HealthStatus

interface EditProjectForm {
  title: string
  description: string
  deadline: string
  status: ProjectStatus
  health_status: HealthStatus
}

function formatDateTimeLocal(value: string | null) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)

  return localDate.toISOString().slice(0, 16)
}

function formatDisplayDate(value: string | null) {
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

export default function TeacherDashboard() {
  const { user, loading } = useAuth()
  const canFetchProjects = !loading && user?.role === 'teacher'

  const {
    projects,
    isLoading: projectsLoading,
    error: projectsError,
    mutate,
  } = useProjects('teacher', canFetchProjects)

  const router = useRouter()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditProjectForm>({
    title: '',
    description: '',
    deadline: '',
    status: 'active',
    health_status: 'healthy',
  })

  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const [actionProjectId, setActionProjectId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all')

  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [aiSource, setAiSource] = useState<string | null>(null)
  const [aiNote, setAiNote] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'teacher')) {
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

      const matchesHealth =
        healthFilter === 'all' || project.health_status === healthFilter

      return matchesSearch && matchesStatus && matchesHealth
    })
  }, [projects, searchTerm, statusFilter, healthFilter])

  const activeCount = projects.filter(
    (project) => project.status === 'active'
  ).length

  const completedCount = projects.filter(
    (project) => project.status === 'completed'
  ).length

  const archivedCount = projects.filter(
    (project) => project.status === 'archived'
  ).length

  const warningCount = projects.filter(
    (project) =>
      project.health_status === 'warning' ||
      project.health_status === 'critical'
  ).length

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setIsSubmitting(true)
    setFormError(null)

    try {
      const title = formData.title.trim()
      const description = formData.description.trim()
      const deadline = formData.deadline || null

      if (!title) {
        throw new Error('Project title is required')
      }

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          deadline,
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to create project')
      }

      setFormData({ title: '', description: '', deadline: '' })
      setShowCreateForm(false)
      await mutate()
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Failed to create project'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEditingProject = (project: (typeof projects)[number]) => {
    setEditingProjectId(project.id)
    setEditError(null)
    setEditSuccess(null)
    setActionError(null)
    setActionSuccess(null)

    setEditForm({
      title: project.title ?? '',
      description: project.description ?? '',
      deadline: formatDateTimeLocal(project.deadline),
      status: (project.status ?? 'active') as ProjectStatus,
      health_status: (project.health_status ?? 'healthy') as HealthStatus,
    })
  }

  const cancelEditingProject = () => {
    setEditingProjectId(null)
    setEditError(null)
    setEditSuccess(null)
  }

  const handleUpdateProject = async (projectId: string) => {
    setIsUpdating(true)
    setEditError(null)
    setEditSuccess(null)
    setActionError(null)
    setActionSuccess(null)

    try {
      const title = editForm.title.trim()
      const description = editForm.description.trim()
      const deadline = editForm.deadline || null

      if (!title) {
        throw new Error('Project title is required')
      }

      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: projectId,
          title,
          description,
          deadline,
          status: editForm.status,
          health_status: editForm.health_status,
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to update project')
      }

      setEditSuccess('Project updated successfully.')
      setEditingProjectId(null)
      await mutate()
    } catch (error) {
      setEditError(
        error instanceof Error ? error.message : 'Failed to update project'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  const handleArchiveProject = async (project: (typeof projects)[number]) => {
    const confirmed = window.confirm(
      `Archive "${project.title}"? You can delete it permanently only after it is archived.`
    )

    if (!confirmed) return

    setActionProjectId(project.id)
    setActionError(null)
    setActionSuccess(null)
    setEditError(null)
    setEditSuccess(null)

    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: project.id,
          title: project.title,
          description: project.description ?? '',
          deadline: project.deadline ?? null,
          status: 'archived',
          health_status: project.health_status ?? 'good',
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to archive project')
      }

      setActionSuccess('Project archived successfully.')
      await mutate()
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Failed to archive project'
      )
    } finally {
      setActionProjectId(null)
    }
  }

  const handleDeleteArchivedProject = async (
    project: (typeof projects)[number]
  ) => {
    const confirmed = window.confirm(
      `Delete "${project.title}" permanently? This action cannot be undone.`
    )

    if (!confirmed) return

    setActionProjectId(project.id)
    setActionError(null)
    setActionSuccess(null)
    setEditError(null)
    setEditSuccess(null)

    try {
      const res = await fetch(
        `/api/projects?id=${encodeURIComponent(project.id)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to delete project')
      }

      setActionSuccess('Archived project deleted successfully.')
      await mutate()
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Failed to delete project'
      )
    } finally {
      setActionProjectId(null)
    }
  }

  const handleGenerateAiInsight = async () => {
    setAiLoading(true)
    setAiError(null)
    setAiInsight(null)
    setAiSource(null)
    setAiNote(null)

    try {
      const res = await fetch('/api/ai/project-insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          projects: projects.map((project) => ({
            id: project.id,
            title: project.title,
            description: project.description,
            status: project.status,
            health_status: project.health_status,
            deadline: project.deadline,
          })),
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to generate AI insight')
      }

      setAiInsight(payload.insight || 'No insight generated.')
      setAiSource(payload.source || null)
      setAiNote(payload.note || null)
    } catch (error) {
      setAiError(
        error instanceof Error ? error.message : 'Failed to generate AI insight'
      )
    } finally {
      setAiLoading(false)
    }
  }

  if (loading || projectsLoading) {
    return (
      <AppLoading
        title="Preparing teacher workspace"
        subtitle="Loading projects, groups, reports, and fairness tracking tools."
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
              <p className="page-kicker">Teacher Workspace</p>

              <h1 className="page-title">My Projects</h1>

              <p className="page-subtitle">
                Create, update, archive, manage groups, evaluate students, and
                monitor contribution fairness from one dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleGenerateAiInsight}
                disabled={aiLoading || projects.length === 0}
                className="rounded-xl"
              >
                {aiLoading ? 'Generating...' : 'Generate AI Insight'}
              </Button>

              <Link href="/dashboard/teacher/reports">
                <Button variant="outline" className="rounded-xl">
                  View Reports
                </Button>
              </Link>

              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="rounded-xl"
              >
                {showCreateForm ? 'Cancel' : 'New Project'}
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Total Projects
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
                Needs Attention
              </p>
              <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-300">
                {warningCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {archivedCount} archived project(s)
              </p>
            </CardContent>
          </Card>
        </div>

        {(aiInsight || aiError || aiLoading) && (
          <Card className="professional-card mb-6 overflow-hidden">
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                <div className="flex flex-wrap items-center gap-2">
  <CardTitle>AI Project Insight</CardTitle>
  <span className="inline-flex items-center rounded-full border border-purple-300/40 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-200">
    AI Powered
  </span>
</div>

<CardDescription>
  Smart summary based on your project statuses, deadlines, and
  health signals.
</CardDescription>
                  
                    
                    
                  
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
                    Generating AI insight...
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Reviewing project health, activity status, and risk signals.
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

              {aiInsight && (
                <div className="rounded-2xl border bg-muted/25 p-5">
                  {aiNote && (
                    <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/40 dark:text-yellow-200">
                      {aiNote}
                    </div>
                  )}

                  <div className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                    {aiInsight}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {showCreateForm && (
          <Card className="professional-card mb-8">
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>
                Fill in the project information. Groups and students can be
                added after creation.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    disabled={isSubmitting}
                    className="mt-2 rounded-xl"
                    placeholder="Example: Final Year AI Fairness Project"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                    placeholder="Write a short project description..."
                    className="mt-2 flex min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="mt-2 rounded-xl"
                  />
                </div>

                {formError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                    {formError}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl"
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {(editError || actionError || projectsError) && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {editError && <p>{editError}</p>}
            {actionError && <p>{actionError}</p>}
            {projectsError instanceof Error && <p>{projectsError.message}</p>}
          </div>
        )}

        {(editSuccess || actionSuccess) && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200">
            {editSuccess && <p>{editSuccess}</p>}
            {actionSuccess && <p>{actionSuccess}</p>}
          </div>
        )}

        <Card className="professional-card mb-6">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Project Library</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Showing {filteredProjects.length} of {projects.length}{' '}
                  project(s).
                </p>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
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
        </Card>

        {projects.length === 0 ? (
          <Card className="professional-card">
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-semibold text-foreground">
                No projects yet
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first project to start assigning students and
                tracking fairness.
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
                Try changing search, status, or health filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredProjects.map((project) => {
              const isEditing = editingProjectId === project.id
              const isArchived = project.status === 'archived'
              const isActionLoading = actionProjectId === project.id

              return (
                <Card key={project.id} className="professional-card-hover">
                  <CardHeader>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`edit-title-${project.id}`}>
                            Project Title
                          </Label>
                          <Input
                            id={`edit-title-${project.id}`}
                            value={editForm.title}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                title: e.target.value,
                              })
                            }
                            disabled={isUpdating}
                            className="mt-2 rounded-xl"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`edit-description-${project.id}`}>
                            Description
                          </Label>
                          <textarea
                            id={`edit-description-${project.id}`}
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                description: e.target.value,
                              })
                            }
                            disabled={isUpdating}
                            className="mt-2 flex min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <CardTitle>{project.title}</CardTitle>
                        {project.description && (
                          <CardDescription className="mt-2 leading-6">
                            {project.description}
                          </CardDescription>
                        )}
                      </>
                    )}
                  </CardHeader>

                  <CardContent>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`edit-deadline-${project.id}`}>
                            Deadline
                          </Label>
                          <Input
                            id={`edit-deadline-${project.id}`}
                            type="datetime-local"
                            value={editForm.deadline}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                deadline: e.target.value,
                              })
                            }
                            disabled={isUpdating}
                            className="mt-2 rounded-xl"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`edit-status-${project.id}`}>
                            Project Status
                          </Label>
                          <select
                            id={`edit-status-${project.id}`}
                            value={editForm.status}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                status: e.target.value as ProjectStatus,
                              })
                            }
                            disabled={isUpdating}
                            className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                          >
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor={`edit-health-${project.id}`}>
                            Health Status
                          </Label>
                          <select
                            id={`edit-health-${project.id}`}
                            value={editForm.health_status}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                health_status: e.target.value as HealthStatus,
                              })
                            }
                            disabled={isUpdating}
                            className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                          >
                            <option value="healthy">Healthy</option>
                            <option value="good">Good</option>
                            <option value="warning">Warning</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => handleUpdateProject(project.id)}
                            disabled={isUpdating}
                            className="rounded-xl"
                          >
                            {isUpdating ? 'Saving...' : 'Save Changes'}
                          </Button>

                          <Button
                            variant="outline"
                            onClick={cancelEditingProject}
                            disabled={isUpdating}
                            className="rounded-xl"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap gap-2">
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
                        </div>

                        <div className="rounded-xl border bg-muted/30 p-3 text-sm">
                          <p className="font-semibold text-foreground">
                            Deadline
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            {formatDisplayDate(project.deadline)}
                          </p>
                        </div>

                        {isArchived && (
                          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/40 dark:text-yellow-200">
                            This project is archived. It can be deleted
                            permanently if no longer needed.
                          </div>
                        )}

                        <div className="grid gap-2 md:grid-cols-2">
                          {!isArchived && (
                            <Link
                              href={`/dashboard/teacher/project/${project.id}`}
                            >
                              <Button className="w-full rounded-xl">
                                Manage Project
                              </Button>
                            </Link>
                          )}

                          <Button
                            className="w-full rounded-xl"
                            variant="outline"
                            onClick={() => startEditingProject(project)}
                            disabled={isActionLoading}
                          >
                            Edit Project
                          </Button>

                          {!isArchived ? (
                            <Button
                              className="w-full rounded-xl"
                              variant="outline"
                              onClick={() => handleArchiveProject(project)}
                              disabled={isActionLoading}
                            >
                              {isActionLoading ? 'Archiving...' : 'Archive'}
                            </Button>
                          ) : (
                            <Button
                              className="w-full rounded-xl"
                              variant="outline"
                              onClick={() =>
                                handleDeleteArchivedProject(project)
                              }
                              disabled={isActionLoading}
                            >
                              {isActionLoading
                                ? 'Deleting...'
                                : 'Delete Permanently'}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
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