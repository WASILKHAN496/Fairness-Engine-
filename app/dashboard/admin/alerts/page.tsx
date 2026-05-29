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

interface DisputeUser {
  id: string
  name: string
  email: string
}

interface DisputeProject {
  id: string
  title: string
}

interface Dispute {
  id: string
  student_id: string
  project_id: string
  rating_id: string | null
  reason: string
  evidence: string | null
  status: 'pending' | 'resolved' | 'rejected'
  admin_comment: string | null
  created_at?: string | null
  student?: DisputeUser | null
  project?: DisputeProject | null
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

function formatDate(value?: string | null) {
  if (!value) return 'No date'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return date.toLocaleString()
}

function getStatusBadgeClass(status: Dispute['status']) {
  if (status === 'resolved') {
    return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200'
  }

  if (status === 'rejected') {
    return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200'
  }

  return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-200'
}

export default function AdminDisputesPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

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

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(
    null
  )
  const [adminComment, setAdminComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const pendingCount =
    disputes?.filter((dispute) => dispute.status === 'pending').length ?? 0

  const resolvedCount =
    disputes?.filter((dispute) => dispute.status === 'resolved').length ?? 0

  const rejectedCount =
    disputes?.filter((dispute) => dispute.status === 'rejected').length ?? 0

  const filteredDisputes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return (disputes ?? []).filter((dispute) => {
      const matchesStatus =
        statusFilter === 'all' || dispute.status === statusFilter

      const matchesSearch =
        !query ||
        dispute.reason.toLowerCase().includes(query) ||
        dispute.evidence?.toLowerCase().includes(query) ||
        dispute.admin_comment?.toLowerCase().includes(query) ||
        dispute.student?.name?.toLowerCase().includes(query) ||
        dispute.student?.email?.toLowerCase().includes(query) ||
        dispute.project?.title?.toLowerCase().includes(query)

      return matchesStatus && matchesSearch
    })
  }, [disputes, searchTerm, statusFilter])

  const selectedDispute = useMemo(() => {
    return disputes?.find((dispute) => dispute.id === selectedDisputeId) ?? null
  }, [disputes, selectedDisputeId])

  const openReview = (dispute: Dispute) => {
    setSelectedDisputeId(dispute.id)
    setAdminComment(dispute.admin_comment ?? '')
    setActionError(null)
    setActionSuccess(null)
  }

  const closeReview = () => {
    setSelectedDisputeId(null)
    setAdminComment('')
    setActionError(null)
    setActionSuccess(null)
  }

  const updateDisputeStatus = async (
    disputeId: string,
    status: 'resolved' | 'rejected'
  ) => {
    setActionLoading(true)
    setActionError(null)
    setActionSuccess(null)

    try {
      const res = await fetch('/api/disputes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: disputeId,
          status,
          admin_comment: adminComment.trim(),
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to update dispute')
      }

      setActionSuccess(
        status === 'resolved'
          ? 'Dispute resolved successfully.'
          : 'Dispute rejected successfully.'
      )

      await mutate()
      closeReview()
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Failed to update dispute'
      )
    } finally {
      setActionLoading(false)
    }
  }

  if (loading || isLoading) {
    return (
      <AppLoading
        title="Preparing dispute center"
        subtitle="Loading submitted disputes, student claims, evidence, and admin review tools."
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="page-kicker">Admin Control Center</p>

              <h1 className="page-title">Dispute Resolution</h1>

              <p className="page-subtitle">
                Review student disputes, inspect evidence, add admin comments,
                and resolve or reject claims fairly.
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
            {error instanceof Error ? error.message : 'Failed to load disputes'}
          </div>
        )}

        {(actionError || actionSuccess) && (
          <div
            className={`mb-6 rounded-xl border p-4 text-sm ${
              actionError
                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200'
                : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200'
            }`}
          >
            {actionError || actionSuccess}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Total Disputes
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {disputes?.length ?? 0}
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

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="professional-card">
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Dispute Feed</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Showing {filteredDisputes.length} of {disputes?.length ?? 0}{' '}
                    dispute(s).
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
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
                    <option value="all">All Status</option>
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
                    No disputes submitted yet
                  </h2>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Student disputes will appear here when submitted.
                  </p>
                </div>
              ) : filteredDisputes.length === 0 ? (
                <div className="py-12 text-center">
                  <h2 className="text-xl font-semibold text-foreground">
                    No matching disputes
                  </h2>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Try changing search or filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDisputes.map((dispute) => (
                    <div
                      key={dispute.id}
                      className={`rounded-2xl border p-5 transition hover:bg-muted/20 ${
                        selectedDisputeId === dispute.id
                          ? 'ring-2 ring-primary/30'
                          : ''
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`badge-soft capitalize ${getStatusBadgeClass(
                                dispute.status
                              )}`}
                            >
                              {dispute.status}
                            </span>

                            <span className="text-xs text-muted-foreground">
                              {formatDate(dispute.created_at)}
                            </span>
                          </div>

                          <h3 className="mt-3 font-semibold text-foreground">
                            {dispute.project?.title || 'Unknown Project'}
                          </h3>

                          <p className="mt-1 text-sm text-muted-foreground">
                            Student:{' '}
                            <span className="font-medium text-foreground">
                              {dispute.student?.name ||
                                dispute.student?.email ||
                                dispute.student_id}
                            </span>
                          </p>

                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                            {dispute.reason}
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => openReview(dispute)}
                          className="rounded-xl"
                        >
                          {dispute.status === 'pending'
                            ? 'Review'
                            : 'View Details'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="professional-card">
            <CardHeader>
              <CardTitle>Review Panel</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select a dispute to inspect details, evidence, and update status.
              </p>
            </CardHeader>

            <CardContent>
              {!selectedDispute ? (
                <div className="rounded-2xl border bg-muted/30 p-6 text-center">
                  <h3 className="font-semibold text-foreground">
                    No dispute selected
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Click Review or View Details from the dispute feed.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Project
                    </p>
                    <p className="mt-1 font-semibold text-foreground">
                      {selectedDispute.project?.title || 'Unknown Project'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Student
                    </p>
                    <p className="mt-1 font-semibold text-foreground">
                      {selectedDispute.student?.name ||
                        selectedDispute.student?.email ||
                        selectedDispute.student_id}
                    </p>
                    {selectedDispute.student?.email && (
                      <p className="text-xs text-muted-foreground">
                        {selectedDispute.student.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Status
                    </p>
                    <span
                      className={`mt-2 inline-flex badge-soft capitalize ${getStatusBadgeClass(
                        selectedDispute.status
                      )}`}
                    >
                      {selectedDispute.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Reason
                    </p>
                    <div className="mt-2 rounded-xl border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
                      {selectedDispute.reason}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Evidence
                    </p>

                    {selectedDispute.evidence ? (
                      <a
                        href={selectedDispute.evidence}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-sm font-medium text-primary underline"
                      >
                        Open Evidence
                      </a>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No evidence provided.
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="admin-comment">Admin Comment</Label>
                    <textarea
                      id="admin-comment"
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      disabled={
                        actionLoading || selectedDispute.status !== 'pending'
                      }
                      placeholder="Write admin review comment..."
                      className="mt-2 flex min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </div>

                  {selectedDispute.status === 'pending' ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() =>
                          updateDisputeStatus(selectedDispute.id, 'resolved')
                        }
                        disabled={actionLoading}
                        className="rounded-xl"
                      >
                        {actionLoading ? 'Updating...' : 'Resolve'}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() =>
                          updateDisputeStatus(selectedDispute.id, 'rejected')
                        }
                        disabled={actionLoading}
                        className="rounded-xl border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40"
                      >
                        Reject
                      </Button>

                      <Button
                        variant="outline"
                        onClick={closeReview}
                        disabled={actionLoading}
                        className="rounded-xl"
                      >
                        Close
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={closeReview}
                      className="rounded-xl"
                    >
                      Close
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}