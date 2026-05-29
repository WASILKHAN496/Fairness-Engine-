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
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
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

function getInitials(name?: string | null, email?: string | null) {
  const source = name || email || 'Admin'
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

export default function AdminProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const canFetch = !loading && user?.role === 'admin'
  const [nameForm, setNameForm] = useState('')
const [profileSaving, setProfileSaving] = useState(false)
const [imageUploading, setImageUploading] = useState(false)
const [profileError, setProfileError] = useState<string | null>(null)
const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
const [localName, setLocalName] = useState('')
const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null)

  const {
    data: users,
    error: usersError,
    isLoading: usersLoading,
  } = useSWR<AdminUser[]>(canFetch ? '/api/admin/users' : null, fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  const {
    data: alertsData,
    error: alertsError,
    isLoading: alertsLoading,
  } = useSWR<AlertsResponse>(canFetch ? '/api/admin/alerts' : null, fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  const {
    data: disputes,
    error: disputesError,
    isLoading: disputesLoading,
  } = useSWR<Dispute[]>(canFetch ? '/api/disputes' : null, fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
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
  const handleUpdateName = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  
    setProfileSaving(true)
    setProfileError(null)
    setProfileSuccess(null)
  
    try {
      const name = nameForm.trim()
  
      if (!name) {
        throw new Error('Name is required.')
      }
  
      const res = await fetch('/api/admin/profile', {
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
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
  
    if (!file) return
  
    setImageUploading(true)
    setProfileError(null)
    setProfileSuccess(null)
  
    try {
      const formData = new FormData()
      formData.append('file', file)
  
      const res = await fetch('/api/admin/profile-image', {
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
      e.target.value = ''
    }
  }
  if (loading || usersLoading || alertsLoading || disputesLoading) {
    return (
      <AppLoading
        title="Preparing admin profile"
        subtitle="Loading account details, system users, disputes, and alerts."
      />
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  const totalUsers = users?.length ?? 0
  const teachers = users?.filter((item) => item.role === 'teacher').length ?? 0
  const students = users?.filter((item) => item.role === 'student').length ?? 0
  const admins = users?.filter((item) => item.role === 'admin').length ?? 0
  const activeUsers =
    users?.filter((item) => item.status === 'active').length ?? 0
  const inactiveUsers =
    users?.filter((item) => item.status === 'inactive').length ?? 0

  const totalDisputes = disputes?.length ?? 0
  const pendingDisputes =
    disputes?.filter((item) => item.status === 'pending').length ?? 0
  const resolvedDisputes =
    disputes?.filter((item) => item.status === 'resolved').length ?? 0
  const rejectedDisputes =
    disputes?.filter((item) => item.status === 'rejected').length ?? 0

  const totalAlerts = alertsData?.summary.total ?? 0
  const highAlerts = alertsData?.summary.high ?? 0
  const mediumAlerts = alertsData?.summary.medium ?? 0
  const lowAlerts = alertsData?.summary.low ?? 0

  return (
    <div className="min-h-svh bg-background">
      <AdminNav />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="page-hero slide-up">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="page-kicker">Admin Profile</p>

              <h1 className="page-title">My Account</h1>

              <p className="page-subtitle">
                View admin account information, system control summary, alerts,
                disputes, and user management overview.
              </p>
            </div>

            <Link href="/dashboard/admin">
              <Button variant="outline" className="rounded-xl">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {(usersError || alertsError || disputesError) && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {usersError instanceof Error && <p>{usersError.message}</p>}
            {alertsError instanceof Error && <p>{alertsError.message}</p>}
            {disputesError instanceof Error && <p>{disputesError.message}</p>}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="professional-card">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <p className="text-sm text-muted-foreground">
                Basic account details connected with your Fairness Engine admin
                workspace.
              </p>
            </CardHeader>

            <CardContent>
            <div className="flex flex-col items-center text-center">
  <div className="relative">
    {localAvatarUrl ? (
      <img
        src={localAvatarUrl}
        alt={localName || user.email || 'Admin profile'}
        className="h-28 w-28 rounded-3xl border object-cover shadow-lg"
      />
    ) : (
      <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-primary text-3xl font-bold text-primary-foreground shadow-lg">
        {getInitials(localName || user.name, user.email)}
      </div>
    )}

    <label
      htmlFor="admin-profile-image"
      className="absolute -bottom-2 -right-2 cursor-pointer rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-md"
    >
      {imageUploading ? 'Uploading...' : 'Edit'}
    </label>

    <input
      id="admin-profile-image"
      type="file"
      accept="image/*"
      onChange={handleUploadProfileImage}
      disabled={imageUploading}
      className="hidden"
    />
  </div>

  <h2 className="mt-6 text-2xl font-bold text-foreground">
    {localName || user.name || 'Admin'}
  </h2>

  <p className="mt-1 text-sm text-muted-foreground">
    {user.email}
  </p>

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <span className="badge-soft bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-200">
                    Role: Admin
                  </span>

                  <span className="badge-soft bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200">
                    Status: {formatStatus(user.status)}
                  </span>
                </div>
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
                  <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-300">
                    {activeUsers}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {inactiveUsers} inactive
                  </p>
                </CardContent>
              </Card>

              <Card className="professional-card-hover">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    Admin Accounts
                  </p>
                  <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-300">
                    {admins}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    System control users
                  </p>
                </CardContent>
              </Card>

              <Card className="professional-card-hover">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Alerts
                  </p>
                  <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-300">
                    {totalAlerts}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {highAlerts} high, {mediumAlerts} medium, {lowAlerts} low
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle>Admin Control Summary</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Quick system management overview for this admin account.
                </p>
              </CardHeader>

              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      Total Disputes
                    </p>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                      {totalDisputes}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-yellow-50 p-4 dark:bg-yellow-950/30">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="mt-2 text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                      {pendingDisputes}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-green-50 p-4 dark:bg-green-950/30">
                    <p className="text-sm text-muted-foreground">Resolved</p>
                    <p className="mt-2 text-2xl font-bold text-green-700 dark:text-green-300">
                      {resolvedDisputes}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border bg-muted/30 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Rejected disputes
                  </p>
                  <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-300">
                    {rejectedDisputes}
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <Link href="/dashboard/admin/users">
                    <Button variant="outline" className="w-full rounded-xl">
                      Manage Users
                    </Button>
                  </Link>

                  <Link href="/dashboard/admin/disputes">
                    <Button variant="outline" className="w-full rounded-xl">
                      Open Disputes
                    </Button>
                  </Link>

                  <Link href="/dashboard/admin/alerts">
                    <Button className="w-full rounded-xl">
                      View Alerts
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}