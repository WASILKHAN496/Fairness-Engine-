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

interface AdminUser {
  id: string
  name: string | null
  email: string | null
  role: 'admin' | 'teacher' | 'student'
  status: 'active' | 'inactive'
}

type RoleFilter = 'all' | 'admin' | 'teacher' | 'student'
type StatusFilter = 'all' | 'active' | 'inactive'

async function fetcher(url: string) {
  const res = await fetch(url, {
    credentials: 'include',
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to fetch users')
  }

  return data
}

function roleBadge(role: string) {
  if (role === 'admin') {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-200'
  }

  if (role === 'teacher') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
  }

  return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200'
}

function statusBadge(status: string) {
  if (status === 'active') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
  }

  return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200'
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const canFetchUsers = !loading && user?.role === 'admin'

  const {
    data: users,
    error,
    isLoading,
    mutate,
  } = useSWR<AdminUser[]>(
    canFetchUsers ? '/api/admin/users' : null,
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  )

  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [savingUserId, setSavingUserId] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const [editForms, setEditForms] = useState<
    Record<string, { role: AdminUser['role']; status: AdminUser['status'] }>
  >({})

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return (users ?? []).filter((item) => {
      const matchesSearch =
        !query ||
        item.name?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query)

      const matchesRole = roleFilter === 'all' || item.role === roleFilter
      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])

  const startEdit = (targetUser: AdminUser) => {
    setEditingUserId(targetUser.id)

    setEditForms({
      ...editForms,
      [targetUser.id]: {
        role: targetUser.role,
        status: targetUser.status,
      },
    })
  }

  const cancelEdit = () => {
    setEditingUserId(null)
  }

  const updateUser = async (targetUserId: string) => {
    const form = editForms[targetUserId]

    if (!form) {
      alert('Missing edit form data.')
      return
    }

    setSavingUserId(targetUserId)

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: targetUserId,
          role: form.role,
          status: form.status,
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to update user')
      }

      setEditingUserId(null)
      await mutate()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setSavingUserId(null)
    }
  }

  const totalUsers = users?.length ?? 0
  const activeUsers =
    users?.filter((item) => item.status === 'active').length ?? 0
  const teachers = users?.filter((item) => item.role === 'teacher').length ?? 0
  const students = users?.filter((item) => item.role === 'student').length ?? 0

  if (loading || isLoading) {
    return (
      <AppLoading
        title="Preparing user management"
        subtitle="Loading users, roles, account statuses, and admin controls."
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
              <p className="page-kicker">Admin Control</p>

              <h1 className="page-title">User Management</h1>

              <p className="page-subtitle">
                View users, change roles, activate accounts, deactivate
                accounts, and manage access across the fairness system.
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
            {error instanceof Error ? error.message : 'Failed to load users'}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Total Users
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {totalUsers}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Active Users
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {activeUsers}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Teachers
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {teachers}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Students
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {students}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="professional-card">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Registered Users</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Showing {filteredUsers.length} of {totalUsers} user(s).
                </p>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <Input
                  placeholder="Search name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-xl"
                />

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                  className="rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as StatusFilter)
                  }
                  className="rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {!users || users.length === 0 ? (
              <div className="py-12 text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  No users found
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  User accounts will appear here after signup.
                </p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  No matching users
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try changing search or filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border">
                <table className="smooth-table min-w-[820px]">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((targetUser) => {
                      const isEditing = editingUserId === targetUser.id
                      const form = editForms[targetUser.id] ?? {
                        role: targetUser.role,
                        status: targetUser.status,
                      }

                      return (
                        <tr key={targetUser.id}>
                          <td>
                            <p className="font-semibold text-foreground">
                              {targetUser.name || 'Unnamed User'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {targetUser.email || 'No email'}
                            </p>
                          </td>

                          <td>
                            {isEditing ? (
                              <div>
                                <Label className="sr-only">Role</Label>
                                <select
                                  value={form.role}
                                  onChange={(e) =>
                                    setEditForms({
                                      ...editForms,
                                      [targetUser.id]: {
                                        ...form,
                                        role:
                                          e.target.value as AdminUser['role'],
                                      },
                                    })
                                  }
                                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                >
                                  <option value="student">Student</option>
                                  <option value="teacher">Teacher</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                            ) : (
                              <span
                                className={`badge-soft capitalize ${roleBadge(
                                  targetUser.role
                                )}`}
                              >
                                {targetUser.role}
                              </span>
                            )}
                          </td>

                          <td>
                            {isEditing ? (
                              <div>
                                <Label className="sr-only">Status</Label>
                                <select
                                  value={form.status}
                                  onChange={(e) =>
                                    setEditForms({
                                      ...editForms,
                                      [targetUser.id]: {
                                        ...form,
                                        status:
                                          e.target
                                            .value as AdminUser['status'],
                                      },
                                    })
                                  }
                                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                >
                                  <option value="active">Active</option>
                                  <option value="inactive">Inactive</option>
                                </select>
                              </div>
                            ) : (
                              <span
                                className={`badge-soft capitalize ${statusBadge(
                                  targetUser.status
                                )}`}
                              >
                                {targetUser.status}
                              </span>
                            )}
                          </td>

                          <td>
                            <div className="flex justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => updateUser(targetUser.id)}
                                    disabled={savingUserId === targetUser.id}
                                    className="rounded-xl"
                                  >
                                    {savingUserId === targetUser.id
                                      ? 'Saving...'
                                      : 'Save'}
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEdit}
                                    disabled={savingUserId === targetUser.id}
                                    className="rounded-xl"
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(targetUser)}
                                  className="rounded-xl"
                                >
                                  Edit
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}