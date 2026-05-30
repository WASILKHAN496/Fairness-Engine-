'use client'

import AppLoading from '@/components/app-loading'
import TeacherNav from '@/components/navigation/teacher-nav'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useProjects } from '@/hooks/useProjects'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from 'react'

function getInitials(name?: string | null, email?: string | null) {
  const source = name || email || 'Teacher'
  const words = source.trim().split(/\s+/)

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

function formatStatus(status?: string | null) {
  if (!status) return 'Active'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatDate(value: string | null) {
  if (!value) return 'No deadline'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return date.toLocaleDateString()
}

export default function TeacherProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [nameForm, setNameForm] = useState('')
  const [localName, setLocalName] = useState('')
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

  const canFetchProjects = !loading && user?.role === 'teacher'

  const {
    projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjects('teacher', canFetchProjects)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'teacher')) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      setNameForm(user.name || '')
      setLocalName(user.name || '')
      setLocalAvatarUrl(user.avatar_url || null)
    }
  }, [user])

  const handleUpdateName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setProfileSaving(true)
    setProfileError(null)
    setProfileSuccess(null)

    try {
      const name = nameForm.trim()

      if (!name) {
        throw new Error('Name is required.')
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to update profile name')
      }

      setLocalName(payload.name || name)
      setNameForm(payload.name || name)
      setProfileSuccess('Profile name updated successfully.')
      router.refresh()
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : 'Failed to update profile name'
      )
    } finally {
      setProfileSaving(false)
    }
  }

  const handleUploadProfileImage = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (!file) return

    setImageUploading(true)
    setProfileError(null)
    setProfileSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/profile-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to upload profile image')
      }

      setLocalAvatarUrl(payload.avatar_url)
      setProfileSuccess('Profile image updated successfully.')
      router.refresh()
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : 'Failed to upload profile image'
      )
    } finally {
      setImageUploading(false)
      event.target.value = ''
    }
  }

  if (loading || projectsLoading) {
    return (
      <AppLoading
        title="Preparing teacher profile"
        subtitle="Loading your account, projects, and teaching workspace summary."
      />
    )
  }

  if (!user || user.role !== 'teacher') {
    return null
  }

  const activeProjects = projects.filter(
    (project) => project.status === 'active'
  ).length

  const completedProjects = projects.filter(
    (project) => project.status === 'completed'
  ).length

  const archivedProjects = projects.filter(
    (project) => project.status === 'archived'
  ).length

  return (
    <div className="min-h-svh bg-background">
      <TeacherNav />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="page-hero slide-up">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="page-kicker">Teacher Profile</p>

              <h1 className="page-title">My Account</h1>

              <p className="page-subtitle">
                Manage your teacher profile, account status, project summary,
                and workspace activity.
              </p>
            </div>

            <Link href="/dashboard/teacher">
              <Button variant="outline" className="rounded-xl">
                Back to Projects
              </Button>
            </Link>
          </div>
        </div>

        {projectsError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {projectsError instanceof Error
              ? projectsError.message
              : 'Failed to load teacher project summary'}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="professional-card">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <p className="text-sm text-muted-foreground">
                Basic account details connected with your Fairness Engine
                teacher workspace.
              </p>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  {localAvatarUrl ? (
                    <img
                      src={localAvatarUrl}
                      alt={localName || user.email || 'Teacher profile'}
                      className="h-28 w-28 rounded-3xl border object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-primary text-3xl font-bold text-primary-foreground shadow-lg">
                      {getInitials(localName || user.name, user.email)}
                    </div>
                  )}

                  <label
                    htmlFor="teacher-profile-image"
                    className="absolute -bottom-2 -right-2 cursor-pointer rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-md"
                  >
                    {imageUploading ? 'Uploading...' : 'Edit'}
                  </label>

                  <input
                    id="teacher-profile-image"
                    type="file"
                    accept="image/*"
                    onChange={handleUploadProfileImage}
                    disabled={imageUploading}
                    className="hidden"
                  />
                </div>

                <h2 className="mt-6 text-2xl font-bold text-foreground">
                  {localName || user.name || 'Teacher'}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {user.email}
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <span className="badge-soft bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200">
                    Role: Teacher
                  </span>

                  <span className="badge-soft bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200">
                    Status: {formatStatus(user.status)}
                  </span>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border bg-muted/30 p-4">
                <form onSubmit={handleUpdateName} className="space-y-3">
                  <div>
                    <label
                      htmlFor="teacher-name"
                      className="text-sm font-medium text-foreground"
                    >
                      Display Name
                    </label>

                    <input
                      id="teacher-name"
                      value={nameForm}
                      onChange={(event) => {
                        setNameForm(event.target.value)
                        setProfileError(null)
                        setProfileSuccess(null)
                      }}
                      disabled={profileSaving}
                      placeholder="Enter teacher name"
                      className="mt-2 flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </div>

                  {(profileError || profileSuccess) && (
                    <div
                      className={`rounded-xl border p-3 text-sm ${
                        profileError
                          ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200'
                          : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200'
                      }`}
                    >
                      {profileError || profileSuccess}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={
                      profileSaving ||
                      nameForm.trim() === (localName || user.name)
                    }
                    className="w-full rounded-xl"
                  >
                    {profileSaving ? 'Saving...' : 'Save Name'}
                  </Button>
                </form>
              </div>

              <div className="mt-8 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="max-w-[220px] truncate font-medium text-foreground">
                    {user.id}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
                  <span className="text-muted-foreground">Email</span>
                  <span className="max-w-[220px] truncate font-medium text-foreground">
                    {user.email}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
                  <span className="text-muted-foreground">Account Status</span>
                  <span className="font-medium capitalize text-foreground">
                    {user.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
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
                    Active Projects
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
                    Archived
                  </p>
                  <p className="mt-2 text-3xl font-bold text-muted-foreground">
                    {archivedProjects}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle>Teaching Workspace Summary</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Quick overview of your recently created projects.
                </p>
              </CardHeader>

              <CardContent>
                {projects.length === 0 ? (
                  <div className="rounded-2xl border bg-muted/30 p-5 text-center">
                    <h3 className="font-semibold text-foreground">
                      No projects created yet
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Create your first project from the teacher dashboard.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.slice(0, 5).map((project) => (
                      <div
                        key={project.id}
                        className="flex flex-col gap-2 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-foreground">
                            {project.title}
                          </p>
                          <p className="text-xs capitalize text-muted-foreground">
                            {project.status} • {project.health_status} •{' '}
                            Deadline: {formatDate(project.deadline)}
                          </p>
                        </div>

                        <Link href={`/dashboard/teacher/project/${project.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                          >
                            Open
                          </Button>
                        </Link>
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