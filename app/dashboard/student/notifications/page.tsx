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
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string | null
  link_url: string | null
  is_read: boolean
  created_at: string
}

async function fetcher(url: string) {
  const res = await fetch(url, {
    credentials: 'include',
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to fetch notifications')
  }

  return data
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return date.toLocaleString()
}

function getTypeBadgeClass(type?: string | null) {
  if (type === 'success') {
    return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200'
  }

  if (type === 'warning') {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-200'
  }

  if (type === 'danger' || type === 'error') {
    return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200'
  }

  if (type === 'dispute') {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-200'
  }

  return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
}

export default function StudentNotificationsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const canFetchNotifications = !loading && user?.role === 'student'

  const {
    data: notifications,
    error,
    isLoading,
    mutate,
  } = useSWR<Notification[]>(
    canFetchNotifications ? '/api/notifications' : null,
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  )

  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const unreadCount = useMemo(() => {
    return notifications?.filter((item) => !item.is_read).length ?? 0
  }, [notifications])

  const readCount = useMemo(() => {
    return notifications?.filter((item) => item.is_read).length ?? 0
  }, [notifications])

  const markAsRead = async (notificationId: string) => {
    setUpdatingId(notificationId)

    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: notificationId,
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to mark notification as read')
      }

      await mutate()
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to mark notification as read'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const markAllAsRead = async () => {
    setMarkingAll(true)

    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          mark_all: true,
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to mark all as read')
      }

      await mutate()
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to mark all as read'
      )
    } finally {
      setMarkingAll(false)
    }
  }

  if (loading || isLoading) {
    return (
      <AppLoading
        title="Preparing notifications"
        subtitle="Loading your project updates, score alerts, disputes, and system messages."
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
              <p className="page-kicker">Student Notifications</p>

              <h1 className="page-title">Notifications</h1>

              <p className="page-subtitle">
                Track updates about projects, work logs, peer ratings, disputes,
                reports, and system messages.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/student">
                <Button variant="outline" className="rounded-xl">
                  Back to Projects
                </Button>
              </Link>

              <Button
                onClick={markAllAsRead}
                disabled={markingAll || unreadCount === 0}
                className="rounded-xl"
              >
                {markingAll ? 'Updating...' : 'Mark All Read'}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error instanceof Error
              ? error.message
              : 'Failed to load notifications'}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Total Notifications
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {notifications?.length ?? 0}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Unread
              </p>
              <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-300">
                {unreadCount}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Read</p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-300">
                {readCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="professional-card">
          <CardHeader>
            <CardTitle>Notification Center</CardTitle>
            <p className="text-sm text-muted-foreground">
              Showing latest notifications for your student account.
            </p>
          </CardHeader>

          <CardContent>
            {!notifications || notifications.length === 0 ? (
              <div className="py-12 text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  No notifications yet
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Updates about your projects, ratings, disputes, and reports
                  will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-2xl border p-5 transition ${
                      notification.is_read
                        ? 'bg-background'
                        : 'bg-primary/5 ring-1 ring-primary/20'
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`badge-soft capitalize ${getTypeBadgeClass(
                              notification.type
                            )}`}
                          >
                            {notification.type || 'info'}
                          </span>

                          {!notification.is_read && (
                            <span className="badge-soft bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-200">
                              Unread
                            </span>
                          )}

                          <span className="text-xs text-muted-foreground">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-semibold text-foreground">
                          {notification.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        {notification.link_url && (
                          <Link href={notification.link_url}>
                            <Button variant="outline" className="rounded-xl">
                              Open
                            </Button>
                          </Link>
                        )}

                        {!notification.is_read && (
                          <Button
                            onClick={() => markAsRead(notification.id)}
                            disabled={updatingId === notification.id}
                            className="rounded-xl"
                          >
                            {updatingId === notification.id
                              ? 'Updating...'
                              : 'Mark Read'}
                          </Button>
                        )}
                      </div>
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