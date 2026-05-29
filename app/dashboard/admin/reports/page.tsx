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
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

interface ProjectReport {
  id: string
  title: string
  status: string
  health_status: string
  deadline: string | null
  created_at: string | null
  groupCount: number
  studentCount: number
  workLogCount: number
  peerRatingCount: number
  disputeCount: number
  pendingDisputeCount: number
}

interface AdminReportsResponse {
  summary: {
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    teachers: number
    students: number
    admins: number
    totalProjects: number
    activeProjects: number
    completedProjects: number
    archivedProjects: number
    warningProjects: number
    criticalProjects: number
    totalDisputes: number
    pendingDisputes: number
    resolvedDisputes: number
    rejectedDisputes: number
    totalWorkLogs: number
    totalPeerRatings: number
    totalGroups: number
  }
  projectReports: ProjectReport[]
}

type StatusFilter = 'all' | 'active' | 'completed' | 'archived'
type HealthFilter = 'all' | 'healthy' | 'good' | 'warning' | 'critical'

async function fetcher(url: string) {
  const res = await fetch(url, {
    credentials: 'include',
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to fetch admin reports')
  }

  return data
}

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

export default function AdminReportsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const canFetchReports = !loading && user?.role === 'admin'

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<AdminReportsResponse>(
    canFetchReports ? '/api/admin/reports' : null,
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

  const projectReports = data?.projectReports ?? []

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return projectReports.filter((project) => {
      const matchesSearch =
        !query || project.title.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'all' || project.status === statusFilter

      const matchesHealth =
        healthFilter === 'all' || project.health_status === healthFilter

      return matchesSearch && matchesStatus && matchesHealth
    })
  }, [projectReports, searchTerm, statusFilter, healthFilter])

  if (loading || isLoading) {
    return (
      <AppLoading
        title="Preparing admin reports"
        subtitle="Loading users, projects, disputes, groups, work logs, and peer ratings."
      />
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  const summary = data?.summary
  const handlePrintAdminReport = () => {
    if (!data || !summary) {
      alert('Report data is not available yet.')
      return
    }
  
    const generatedAt = new Date().toLocaleString()
    const reportId = `FE-ADMIN-${Date.now()}`
  
    const projectRows =
      filteredReports.length > 0
        ? filteredReports
            .map(
              (project, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>
                    <strong>${project.title}</strong>
                    <br />
                    <span class="muted">Created: ${formatDate(project.created_at)}</span>
                  </td>
                  <td><span class="pill">${project.status}</span></td>
                  <td><span class="pill ${project.health_status}">${project.health_status}</span></td>
                  <td>${project.groupCount}</td>
                  <td>${project.studentCount}</td>
                  <td>${project.workLogCount}</td>
                  <td>${project.peerRatingCount}</td>
                  <td>${project.disputeCount}</td>
                  <td>${project.pendingDisputeCount}</td>
                  <td>${formatDate(project.deadline)}</td>
                </tr>
              `
            )
            .join('')
        : `
          <tr>
            <td colspan="11" class="empty">No project reports available.</td>
          </tr>
        `
  
    const reportWindow = window.open('', '_blank')
  
    if (!reportWindow) {
      alert('Popup blocked. Please allow popups to print/download the report.')
      return
    }
  
    reportWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fairness Engine Admin Report</title>
          <style>
            * {
              box-sizing: border-box;
            }
  
            body {
              margin: 0;
              background: #f3f4f6;
              color: #111827;
              font-family: Arial, sans-serif;
              line-height: 1.55;
            }
  
            .page {
              width: 100%;
              max-width: 1120px;
              margin: 24px auto;
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 18px;
              overflow: hidden;
              box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
            }
  
            .topbar {
              background: linear-gradient(135deg, #111827, #312e81, #4c1d95);
              color: #ffffff;
              padding: 30px 34px;
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 24px;
            }
  
            .brand-row {
              display: flex;
              align-items: center;
              gap: 14px;
            }
  
            .logo {
              width: 54px;
              height: 54px;
              border-radius: 16px;
              background: rgba(255, 255, 255, 0.14);
              border: 1px solid rgba(255, 255, 255, 0.22);
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 900;
              font-size: 18px;
              letter-spacing: 1px;
            }
  
            .brand {
              margin: 0;
              font-size: 12px;
              letter-spacing: 2px;
              text-transform: uppercase;
              opacity: 0.75;
              font-weight: 700;
            }
  
            h1 {
              margin: 4px 0 0;
              font-size: 30px;
              line-height: 1.15;
            }
  
            .meta-box {
              text-align: right;
              font-size: 12px;
              color: rgba(255, 255, 255, 0.76);
            }
  
            .meta-box strong {
              color: #ffffff;
            }
  
            .toolbar {
              padding: 18px 34px;
              border-bottom: 1px solid #e5e7eb;
              background: #f9fafb;
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 16px;
            }
  
            .print-button {
              padding: 10px 16px;
              border: 0;
              border-radius: 12px;
              background: #111827;
              color: white;
              font-weight: 700;
              cursor: pointer;
            }
  
            .hint {
              margin: 0;
              color: #6b7280;
              font-size: 12px;
            }
  
            .content {
              padding: 30px 34px 36px;
            }
  
            .section {
              margin-bottom: 28px;
            }
  
            .section-title {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 10px;
              margin-bottom: 16px;
            }
  
            h2 {
              margin: 0;
              font-size: 18px;
            }
  
            .section-note {
              margin: 0;
              color: #6b7280;
              font-size: 12px;
            }
  
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 14px;
            }
  
            .stat-card {
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              padding: 16px;
              background: #f9fafb;
            }
  
            .stat-label {
              margin: 0;
              color: #6b7280;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }
  
            .stat-value {
              margin: 8px 0 0;
              font-size: 28px;
              font-weight: 900;
              color: #111827;
            }
  
            .stat-sub {
              margin: 4px 0 0;
              font-size: 12px;
              color: #6b7280;
            }
  
            .risk-card {
              background: #fff7ed;
              border-color: #fed7aa;
            }
  
            .danger-card {
              background: #fef2f2;
              border-color: #fecaca;
            }
  
            .success-card {
              background: #f0fdf4;
              border-color: #bbf7d0;
            }
  
            .blue-card {
              background: #eff6ff;
              border-color: #bfdbfe;
            }
  
            table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              font-size: 12px;
              overflow: hidden;
              border: 1px solid #e5e7eb;
              border-radius: 14px;
            }
  
            th {
              background: #111827;
              color: #ffffff;
              text-align: left;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              padding: 11px 10px;
              white-space: nowrap;
            }
  
            td {
              border-top: 1px solid #e5e7eb;
              padding: 11px 10px;
              vertical-align: top;
            }
  
            tr:nth-child(even) td {
              background: #f9fafb;
            }
  
            .pill {
              display: inline-flex;
              border-radius: 999px;
              padding: 4px 9px;
              background: #eef2ff;
              color: #3730a3;
              font-size: 11px;
              font-weight: 700;
              text-transform: capitalize;
            }
  
            .pill.warning {
              background: #fef3c7;
              color: #92400e;
            }
  
            .pill.critical {
              background: #fee2e2;
              color: #991b1b;
            }
  
            .pill.healthy,
            .pill.good {
              background: #dcfce7;
              color: #166534;
            }
  
            .muted {
              color: #6b7280;
              font-size: 11px;
            }
  
            .empty {
              text-align: center;
              color: #6b7280;
              padding: 22px;
            }
  
            .signature-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 28px;
              margin-top: 34px;
            }
  
            .signature-box {
              border-top: 1px solid #9ca3af;
              padding-top: 10px;
              color: #6b7280;
              font-size: 12px;
            }
  
            .footer {
              background: #f9fafb;
              border-top: 1px solid #e5e7eb;
              padding: 18px 34px;
              color: #6b7280;
              font-size: 12px;
              display: flex;
              justify-content: space-between;
              gap: 16px;
            }
  
            @media print {
              body {
                background: #ffffff;
              }
  
              .page {
                margin: 0;
                max-width: none;
                border: 0;
                border-radius: 0;
                box-shadow: none;
              }
  
              .toolbar,
              .print-button {
                display: none;
              }
  
              .topbar {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
  
              .stat-card,
              th,
              .pill {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
  
              .content {
                padding: 24px;
              }
  
              .summary-grid {
                grid-template-columns: repeat(4, 1fr);
                gap: 10px;
              }
  
              table {
                font-size: 10px;
              }
  
              th,
              td {
                padding: 7px;
              }
            }
          </style>
        </head>
  
        <body>
          <div class="page">
            <div class="topbar">
              <div class="brand-row">
                <div class="logo">FE</div>
                <div>
                  <p class="brand">Fairness Engine</p>
                  <h1>Admin System Report</h1>
                </div>
              </div>
  
              <div class="meta-box">
                <div><strong>Report ID:</strong> ${reportId}</div>
                <div><strong>Generated:</strong> ${generatedAt}</div>
                <div><strong>Scope:</strong> Users, Projects, Disputes, Fairness</div>
              </div>
            </div>
  
            <div class="toolbar">
              <p class="hint">
                Use browser print and choose “Save as PDF” to download this report.
              </p>
  
              <button class="print-button" onclick="window.print()">
                Print / Save as PDF
              </button>
            </div>
  
            <div class="content">
              <div class="section">
                <div class="section-title">
                  <h2>Executive Summary</h2>
                  <p class="section-note">System-wide overview</p>
                </div>
  
                <div class="summary-grid">
                  <div class="stat-card blue-card">
                    <p class="stat-label">Total Users</p>
                    <p class="stat-value">${summary.totalUsers}</p>
                    <p class="stat-sub">${summary.teachers} teachers • ${summary.students} students</p>
                  </div>
  
                  <div class="stat-card success-card">
                    <p class="stat-label">Active Users</p>
                    <p class="stat-value">${summary.activeUsers}</p>
                    <p class="stat-sub">${summary.inactiveUsers} inactive users</p>
                  </div>
  
                  <div class="stat-card">
                    <p class="stat-label">Projects</p>
                    <p class="stat-value">${summary.totalProjects}</p>
                    <p class="stat-sub">${summary.activeProjects} active • ${summary.completedProjects} completed</p>
                  </div>
  
                  <div class="stat-card danger-card">
                    <p class="stat-label">Pending Disputes</p>
                    <p class="stat-value">${summary.pendingDisputes}</p>
                    <p class="stat-sub">${summary.totalDisputes} total disputes</p>
                  </div>
                </div>
              </div>
  
              <div class="section">
                <div class="section-title">
                  <h2>Fairness and Contribution Summary</h2>
                  <p class="section-note">Work logs, peer ratings, and project health</p>
                </div>
  
                <div class="summary-grid">
                  <div class="stat-card">
                    <p class="stat-label">Work Logs</p>
                    <p class="stat-value">${summary.totalWorkLogs}</p>
                    <p class="stat-sub">Student contribution records</p>
                  </div>
  
                  <div class="stat-card">
                    <p class="stat-label">Peer Ratings</p>
                    <p class="stat-value">${summary.totalPeerRatings}</p>
                    <p class="stat-sub">Submitted peer reviews</p>
                  </div>
  
                  <div class="stat-card risk-card">
                    <p class="stat-label">Warning Projects</p>
                    <p class="stat-value">${summary.warningProjects}</p>
                    <p class="stat-sub">Need monitoring</p>
                  </div>
  
                  <div class="stat-card danger-card">
                    <p class="stat-label">Critical Projects</p>
                    <p class="stat-value">${summary.criticalProjects}</p>
                    <p class="stat-sub">Need immediate attention</p>
                  </div>
                </div>
              </div>
  
              <div class="section">
                <div class="section-title">
                  <h2>Project Report Table</h2>
                  <p class="section-note">Filtered report records shown from current admin view</p>
                </div>
  
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Health</th>
                      <th>Groups</th>
                      <th>Students</th>
                      <th>Logs</th>
                      <th>Ratings</th>
                      <th>Disputes</th>
                      <th>Pending</th>
                      <th>Deadline</th>
                    </tr>
                  </thead>
  
                  <tbody>
                    ${projectRows}
                  </tbody>
                </table>
              </div>
  
              <div class="signature-row">
                <div class="signature-box">
                  Prepared by Admin
                </div>
  
                <div class="signature-box">
                  Reviewed / Approved
                </div>
              </div>
            </div>
  
            <div class="footer">
              <span>
                Fairness Engine Admin Report
              </span>
  
              <span>
                Generated automatically from live system data.
              </span>
            </div>
          </div>
        </body>
      </html>
    `)
  
    reportWindow.document.close()
  }

  return (
    <div className="min-h-svh bg-background">
      <AdminNav />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="page-hero slide-up">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="page-kicker">Admin Reports</p>

              <h1 className="page-title">System Reports</h1>

              <p className="page-subtitle">
                View system-wide analytics for users, projects, disputes, work
                logs, peer ratings, and fairness health.
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
  type="button"
  onClick={handlePrintAdminReport}
  className="rounded-xl"
>
  Download / Print Report
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
            {error instanceof Error
              ? error.message
              : 'Failed to load admin reports'}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Total Users
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {summary?.totalUsers ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary?.teachers ?? 0} teachers • {summary?.students ?? 0}{' '}
                students
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Projects
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {summary?.totalProjects ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary?.activeProjects ?? 0} active •{' '}
                {summary?.completedProjects ?? 0} completed
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Pending Disputes
              </p>
              <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-300">
                {summary?.pendingDisputes ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary?.totalDisputes ?? 0} total disputes
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Contributions
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {summary?.totalWorkLogs ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary?.totalPeerRatings ?? 0} peer ratings
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Active Users
              </p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-300">
                {summary?.activeUsers ?? 0}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Inactive Users
              </p>
              <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-300">
                {summary?.inactiveUsers ?? 0}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Warning Projects
              </p>
              <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-300">
                {summary?.warningProjects ?? 0}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Critical Projects
              </p>
              <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-300">
                {summary?.criticalProjects ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="professional-card">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Project Report Feed</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Showing {filteredReports.length} of {projectReports.length}{' '}
                  project report(s).
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
            {filteredReports.length === 0 ? (
              <div className="py-12 text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  No matching reports
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Try changing search or filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3">Project</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Health</th>
                      <th className="px-4 py-3">Groups</th>
                      <th className="px-4 py-3">Students</th>
                      <th className="px-4 py-3">Work Logs</th>
                      <th className="px-4 py-3">Peer Ratings</th>
                      <th className="px-4 py-3">Disputes</th>
                      <th className="px-4 py-3">Deadline</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredReports.map((project) => (
                      <tr
                        key={project.id}
                        className="border-b transition hover:bg-muted/30"
                      >
                        <td className="px-4 py-4">
                          <p className="font-semibold text-foreground">
                            {project.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created: {formatDate(project.created_at)}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`badge-soft capitalize ${getStatusBadgeClass(
                              project.status
                            )}`}
                          >
                            {project.status}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`badge-soft capitalize ${getHealthBadgeClass(
                              project.health_status
                            )}`}
                          >
                            {project.health_status}
                          </span>
                        </td>

                        <td className="px-4 py-4">{project.groupCount}</td>
                        <td className="px-4 py-4">{project.studentCount}</td>
                        <td className="px-4 py-4">{project.workLogCount}</td>
                        <td className="px-4 py-4">{project.peerRatingCount}</td>

                        <td className="px-4 py-4">
                          <span
                            className={
                              project.pendingDisputeCount > 0
                                ? 'font-bold text-red-600 dark:text-red-300'
                                : ''
                            }
                          >
                            {project.disputeCount}
                          </span>

                          {project.pendingDisputeCount > 0 && (
                            <p className="text-xs text-red-600 dark:text-red-300">
                              {project.pendingDisputeCount} pending
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {formatDate(project.deadline)}
                        </td>
                      </tr>
                    ))}
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