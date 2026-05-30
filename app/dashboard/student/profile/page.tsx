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
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'

function getInitials(name?: string | null, email?: string | null) {
  const source = name || email || 'Student'
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

export default function StudentProfilePage() {
  const { user, loading } = useAuth()

  const [nameForm, setNameForm] = useState('')
  const [localName, setLocalName] = useState('')
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

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
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : 'Failed to upload profile image'
      )
    } finally {
      setImageUploading(false)
      event.target.value = ''
    }
  }

  if (loading) {
    return (
      <AppLoading
        title="Loading student profile"
        subtitle="Preparing your account settings."
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
              <p className="page-kicker">Student Profile</p>

              <h1 className="page-title">My Account</h1>

              <p className="page-subtitle">
                Manage your student profile, display name, profile image, and
                account information.
              </p>
            </div>

            <Link href="/dashboard/student">
              <Button variant="outline" className="rounded-xl">
                Back to Projects
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="professional-card">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <p className="text-sm text-muted-foreground">
                Basic account details connected with your Fairness Engine
                student workspace.
              </p>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  {localAvatarUrl ? (
                    <img
                      src={localAvatarUrl}
                      alt={localName || user.email || 'Student profile'}
                      className="h-28 w-28 rounded-3xl border object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-primary text-3xl font-bold text-primary-foreground shadow-lg">
                      {getInitials(localName || user.name, user.email)}
                    </div>
                  )}

                  <label
                    htmlFor="student-profile-image"
                    className="absolute -bottom-2 -right-2 cursor-pointer rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-md"
                  >
                    {imageUploading ? 'Uploading...' : 'Edit'}
                  </label>

                  <input
                    id="student-profile-image"
                    type="file"
                    accept="image/*"
                    onChange={handleUploadProfileImage}
                    disabled={imageUploading}
                    className="hidden"
                  />
                </div>

                <h2 className="mt-6 text-2xl font-bold text-foreground">
                  {localName || user.name || 'Student'}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {user.email}
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <span className="badge-soft bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200">
                    Role: Student
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
                      htmlFor="student-name"
                      className="text-sm font-medium text-foreground"
                    >
                      Display Name
                    </label>

                    <input
                      id="student-name"
                      value={nameForm}
                      onChange={(event) => {
                        setNameForm(event.target.value)
                        setProfileError(null)
                        setProfileSuccess(null)
                      }}
                      disabled={profileSaving}
                      placeholder="Enter student name"
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
                    Workspace Role
                  </p>
                  <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-300">
                    Student
                  </p>
                </CardContent>
              </Card>

              <Card className="professional-card-hover">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    Account Status
                  </p>
                  <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-300">
                    {formatStatus(user.status)}
                  </p>
                </CardContent>
              </Card>

              <Card className="professional-card-hover">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    Profile Image
                  </p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {localAvatarUrl ? 'Set' : 'None'}
                  </p>
                </CardContent>
              </Card>

              <Card className="professional-card-hover">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    Display Name
                  </p>
                  <p className="mt-2 truncate text-2xl font-bold text-foreground">
                    {localName || user.name || 'Student'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle>Student Workspace Summary</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Quick overview of your student workspace actions.
                </p>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <p className="font-semibold text-foreground">
                      Project Workspace
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      View assigned projects, submit work logs, upload evidence,
                      and track fairness progress.
                    </p>
                  </div>

                  <div className="rounded-xl border bg-muted/20 p-4">
                    <p className="font-semibold text-foreground">
                      Peer Feedback
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Submit peer ratings and view feedback received from group
                      members.
                    </p>
                  </div>

                  <div className="rounded-xl border bg-muted/20 p-4">
                    <p className="font-semibold text-foreground">
                      Notifications
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Track project updates, messages, reports, disputes, and
                      system notifications.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}