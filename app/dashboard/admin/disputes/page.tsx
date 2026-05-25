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
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

interface Student {
  id: string
  name: string
  email: string
}

interface Rating {
  id: string
  rater_id: string
  rated_student_id: string
  project_id: string
  rating: number
  feedback: string | null
}

interface Dispute {
  id: string
  student_id: string
  rating_id: string | null
  project_id: string
  reason: string
  evidence: string | null
  status: 'pending' | 'resolved' | 'rejected'
  admin_comment: string | null
  created_at: string
  student: Student | null
  rating: Rating | null
}

type StatusFilter = 'all' | 'pending' | 'resolved' | 'rejected'

async function fetcher(url: string) {
  const res = await fetch(url, {
    credentials: 'include',
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to fetch disputes')
  }

  return data
}

function getStatusBadge(status: Dispute['status']) {
  if (status === 'pending') {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-200'
  }

  if (status === 'resolved') {
    return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200'
  }

  return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200'
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return date.toLocaleDateString()
}

export default function AdminDisputesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const canFetchDisputes = !loading && user?.role === 'admin'

  const {
    data: disputes,
    error,
    isLoading,
    mutate,
  } = useSWR<Dispute[]>(
    canFetchDisputes ? '/api/disputes' : null,
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  )

  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const filteredDisputes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return (disputes ?? []).filter((dispute) => {
      const matchesSearch =
        !query ||
        dispute.reason.toLowerCase().includes(query) ||
        dispute.evidence?.toLowerCase().includes(query) ||
        dispute.student?.name?.toLowerCase().includes(query) ||
        dispute.student?.email?.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'all' || dispute.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [disputes, searchTerm, statusFilter])

  const updateDispute = async (
    disputeId: string,
    status: 'resolved' | 'rejected'
  ) => {
    setUpdatingId(disputeId)

    try {
      const res = await fetch('/api/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: disputeId,
          status,
          admin_comment: comments[disputeId] ?? '',
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to update dispute')
      }

      await mutate()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update dispute')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading || isLoading) {
    return (
      <AppLoading
        title="Preparing dispute center"
        subtitle="Loading student disputes, evidence, ratings, and admin decisions."
      />
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  const totalDisputes = disputes?.length ?? 0
  const pendingCount =
    disputes?.filter((item) => item.status === 'pending').length ?? 0
  const resolvedCount =
    disputes?.filter((item) => item.status === 'resolved').length ?? 0
  const rejectedCount =
    disputes?.filter((item) => item.status === 'rejected').length ?? 0

  return (
    <div className="min-h-svh bg-background">
      <AdminNav />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="page-hero slide-up">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="page-kicker">Admin Review</p>
              <h1 className="page-title">Dispute Resolution</h1>
              <p className="page-subtitle">
                Review student disputes, inspect evidence, add admin comments,
                and resolve or reject fairness-related claims.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/admin')}
              className="rounded-xl"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error instanceof Error ? error.message : 'Failed to load disputes'}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Total Disputes
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {totalDisputes}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Pending
              </p>
              <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-300">
                {pendingCount}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Resolved
              </p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-300">
                {resolvedCount}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Rejected
              </p>
              <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-300">
                {rejectedCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="professional-card">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Dispute Queue</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Showing {filteredDisputes.length} of {totalDisputes}{' '}
                  dispute(s).
                </p>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  placeholder="Search disputes..."
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
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {!disputes || disputes.length === 0 ? (
              <div className="py-12 text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  No disputes found
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Student disputes will appear here after submission.
                </p>
              </div>
            ) : filteredDisputes.length === 0 ? (
              <div className="py-12 text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  No matching disputes
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try changing your search or status filter.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDisputes.map((dispute) => (
                  <div key={dispute.id} className="professional-card-hover p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`badge-soft capitalize ${getStatusBadge(
                              dispute.status
                            )}`}
                          >
                            {dispute.status}
                          </span>

                          <span className="text-xs text-muted-foreground">
                            {formatDate(dispute.created_at)}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-semibold text-foreground">
                          {dispute.student?.name ?? 'Unknown student'}
                        </h3>

                        <p className="text-sm text-muted-foreground">
                          {dispute.student?.email ?? dispute.student_id}
                        </p>
                      </div>

                      {dispute.rating && (
                        <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
                          <p className="font-semibold text-foreground">
                            Related Rating
                          </p>
                          <p className="text-muted-foreground">
                            {dispute.rating.rating}/5
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border bg-muted/30 p-4">
                        <p className="text-sm font-semibold text-foreground">
                          Reason
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {dispute.reason}
                        </p>
                      </div>

                      <div className="rounded-xl border bg-muted/30 p-4">
                        <p className="text-sm font-semibold text-foreground">
                          Evidence
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {dispute.evidence || 'No evidence provided.'}
                        </p>
                      </div>
                    </div>

                    {dispute.admin_comment && (
                      <div className="mt-4 rounded-xl border bg-background/70 p-4">
                        <p className="text-sm font-semibold text-foreground">
                          Admin Comment
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {dispute.admin_comment}
                        </p>
                      </div>
                    )}

                    {dispute.status === 'pending' && (
                      <div className="mt-5 space-y-3">
                        <div>
                          <Label htmlFor={`comment-${dispute.id}`}>
                            Admin Comment
                          </Label>
                          <textarea
                            id={`comment-${dispute.id}`}
                            value={comments[dispute.id] ?? ''}
                            onChange={(e) =>
                              setComments({
                                ...comments,
                                [dispute.id]: e.target.value,
                              })
                            }
                            className="mt-2 flex min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                            placeholder="Write admin decision notes..."
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() =>
                              updateDispute(dispute.id, 'resolved')
                            }
                            disabled={updatingId === dispute.id}
                            className="rounded-xl"
                          >
                            {updatingId === dispute.id
                              ? 'Updating...'
                              : 'Resolve'}
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() =>
                              updateDispute(dispute.id, 'rejected')
                            }
                            disabled={updatingId === dispute.id}
                            className="rounded-xl"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
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