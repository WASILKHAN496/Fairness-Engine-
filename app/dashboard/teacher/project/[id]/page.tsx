'use client'

import AppLoading from '@/components/app-loading'
import { useAuth } from '@/hooks/useAuth'
import { useFairnessScores } from '@/hooks/useFairnessScores'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import TeacherNav from '@/components/navigation/teacher-nav'
import useSWR from 'swr'

interface Project {
  id: string
  title: string
  description: string | null
  deadline: string | null
  status: string
  health_status: string
}

interface Student {
  id: string
  name: string
  email: string
}

interface Group {
  id: string
  group_name: string
  project_id: string
  group_members: Array<{
    id: string
    student_id: string
    student: {
      id: string
      name: string
      email: string
    } | null
  }>
}
interface ProjectMessageUser {
  id: string
  name: string
  email: string
  role: string
}

interface ProjectMessage {
  id: string
  project_id: string
  sender_id: string
  receiver_id: string
  message: string
  is_read: boolean
  created_at: string
  sender?: ProjectMessageUser | null
  receiver?: ProjectMessageUser | null
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

function getScoreTextClass(score: number) {
  if (score >= 85) return 'text-green-600 dark:text-green-300'
  if (score >= 70) return 'text-blue-600 dark:text-blue-300'
  if (score >= 50) return 'text-yellow-600 dark:text-yellow-300'
  return 'text-red-600 dark:text-red-300'
}

function getScoreWidth(score: number) {
  if (!Number.isFinite(score)) return '0%'
  return `${Math.max(0, Math.min(100, score))}%`
}

export default function ProjectDetailPage() {
  const { user, loading: userLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const {
    data: project,
    error: projectError,
    isLoading: projectLoading,
  } = useSWR<Project>(
    projectId ? `/api/projects?id=${encodeURIComponent(projectId)}` : null,
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  )

  const {
    data: students,
    error: studentsError,
    isLoading: studentsLoading,
  } = useSWR<Student[]>(
    !userLoading && user?.role === 'teacher' ? '/api/students' : null,
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  )

  const {
    data: groups,
    error: groupsError,
    isLoading: groupsLoading,
    mutate: mutateGroups,
  } = useSWR<Group[]>(
    projectId ? `/api/groups?projectId=${encodeURIComponent(projectId)}` : null,
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  )
  const {
    data: projectMessages,
    error: projectMessagesError,
    isLoading: projectMessagesLoading,
    mutate: mutateProjectMessages,
  } = useSWR<ProjectMessage[]>(
    projectId
      ? `/api/project-messages?projectId=${encodeURIComponent(projectId)}`
      : null,
    fetcher,
    {
      shouldRetryOnError: false,
      refreshInterval: 8000,
      revalidateOnFocus: true,
    }
  )

  const {
    scores,
    loading: scoresLoading,
    error: scoresError,
    refetch: refetchScores,
  } = useFairnessScores(projectId)

  const [showAddGroup, setShowAddGroup] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [groupFormData, setGroupFormData] = useState({
    group_name: '',
    members: [] as string[],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [evaluationForm, setEvaluationForm] = useState({
    student_id: '',
    score: '',
    comment: '',
  })

  const [evaluationSubmitting, setEvaluationSubmitting] = useState(false)
  const [evaluationError, setEvaluationError] = useState<string | null>(null)
  const [evaluationSuccess, setEvaluationSuccess] = useState<string | null>(
    null
  )
  const [selectedChatStudentId, setSelectedChatStudentId] = useState('')
const [teacherReply, setTeacherReply] = useState('')
const [teacherReplySending, setTeacherReplySending] = useState(false)
const [teacherReplyError, setTeacherReplyError] = useState<string | null>(null)
const [teacherReplySuccess, setTeacherReplySuccess] = useState<string | null>(
  null
)

  useEffect(() => {
    if (!userLoading && (!user || user.role !== 'teacher')) {
      router.push('/auth/login')
    }
  }, [user, userLoading, router])
  

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase()

    return (students ?? []).filter((student) => {
      if (!query) return true

      return (
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
      )
    })
  }, [students, studentSearch])

  const totalMembers = useMemo(() => {
    return (groups ?? []).reduce(
      (sum, group) => sum + (group.group_members?.length ?? 0),
      0
    )
  }, [groups])

  const averageScore = useMemo(() => {
    if (scores.length === 0) return 0

    const total = scores.reduce((sum, score) => sum + score.overallScore, 0)
    return Math.round(total / scores.length)
  }, [scores])

  const excellentCount = scores.filter(
    (score) => score.status === 'excellent'
  ).length

  const needsAttentionCount = scores.filter(
    (score) => score.overallScore < 50
  ).length
  const chatStudents = useMemo(() => {
    if (!projectMessages) return []
  
    const map = new Map<string, ProjectMessageUser>()
  
    projectMessages.forEach((message) => {
      if (message.sender?.role === 'student') {
        map.set(message.sender.id, message.sender)
      }
  
      if (message.receiver?.role === 'student') {
        map.set(message.receiver.id, message.receiver)
      }
    })
  
    return Array.from(map.values())
  }, [projectMessages])
  useEffect(() => {
    if (!selectedChatStudentId && chatStudents.length > 0) {
      setSelectedChatStudentId(chatStudents[0].id)
    }
  }, [chatStudents, selectedChatStudentId])
  
  const selectedChatMessages = useMemo(() => {
    if (!projectMessages || !selectedChatStudentId) return []
  
    return projectMessages.filter(
      (message) =>
        message.sender_id === selectedChatStudentId ||
        message.receiver_id === selectedChatStudentId
    )
  }, [projectMessages, selectedChatStudentId])
  
  const selectedChatStudent = useMemo(() => {
    return chatStudents.find((student) => student.id === selectedChatStudentId)
  }, [chatStudents, selectedChatStudentId])
  
  const unreadStudentMessages = useMemo(() => {
    if (!projectMessages || !user) return 0
  
    return projectMessages.filter(
      (message) => message.receiver_id === user.id && !message.is_read
    ).length
  }, [projectMessages, user])

  const handleAddGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setIsSubmitting(true)
    setFormError(null)

    try {
      const groupName = groupFormData.group_name.trim()

      if (!groupName) {
        throw new Error('Group name is required.')
      }

      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          group_name: groupName,
          project_id: projectId,
          members: groupFormData.members,
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to create group')
      }

      setGroupFormData({ group_name: '', members: [] })
      setStudentSearch('')
      setShowAddGroup(false)
      await mutateGroups()
      await refetchScores()
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Failed to create group'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitEvaluation = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    setEvaluationSubmitting(true)
    setEvaluationError(null)
    setEvaluationSuccess(null)

    try {
      const score = Number(evaluationForm.score)

      if (!evaluationForm.student_id) {
        throw new Error('Please select a student.')
      }

      if (!Number.isInteger(score) || score < 0 || score > 100) {
        throw new Error('Score must be a whole number between 0 and 100.')
      }

      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          student_id: evaluationForm.student_id,
          project_id: projectId,
          score,
          comment: evaluationForm.comment,
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to submit evaluation')
      }

      setEvaluationForm({
        student_id: '',
        score: '',
        comment: '',
      })

      setEvaluationSuccess('Teacher evaluation submitted successfully.')
      await refetchScores()
    } catch (error) {
      setEvaluationError(
        error instanceof Error ? error.message : 'Failed to submit evaluation'
      )
    } finally {
      setEvaluationSubmitting(false)
    }
  }
  const handleSendTeacherReply = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()
  
    setTeacherReplySending(true)
    setTeacherReplyError(null)
    setTeacherReplySuccess(null)
  
    try {
      const message = teacherReply.trim()
  
      if (!selectedChatStudentId) {
        throw new Error('Please select a student conversation first.')
      }
  
      if (!message) {
        throw new Error('Write a reply before sending.')
      }
  
      const res = await fetch('/api/project-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          project_id: projectId,
          receiver_id: selectedChatStudentId,
          message,
        }),
      })
  
      const payload = await res.json()
  
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to send reply')
      }
  
      setTeacherReply('')
      setTeacherReplySuccess('Reply sent successfully.')
      await mutateProjectMessages()
    } catch (error) {
      setTeacherReplyError(
        error instanceof Error ? error.message : 'Failed to send reply'
      )
    } finally {
      setTeacherReplySending(false)
    }
  }

  const loading =
  userLoading ||
  projectLoading ||
  groupsLoading ||
  projectMessagesLoading ||
  scoresLoading ||
  studentsLoading

    if (loading) {
      return (
        <AppLoading
          title="Preparing project workspace"
          subtitle="Loading groups, students, evaluations, and fairness scores."
        />
      )
    }

  if (!user || user.role !== 'teacher') {
    return null
  }

  if (projectError) {
    return (
      <div className="min-h-svh bg-background">
        <TeacherNav />

        <main className="container mx-auto max-w-7xl px-4 py-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            Back
          </Button>

          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {projectError instanceof Error
              ? projectError.message
              : 'Failed to load project'}
          </div>
        </main>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-svh bg-background">
        <TeacherNav />

        <main className="container mx-auto max-w-7xl px-4 py-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            Back
          </Button>

          <div className="mt-6 rounded-xl border bg-muted/40 p-6 text-center">
            <h2 className="text-xl font-semibold text-foreground">
              Project not found
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This project may have been archived, deleted, or is unavailable.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <TeacherNav />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="page-hero slide-up">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="mb-4 rounded-xl"
              >
                Back
              </Button>

              <p className="page-kicker">Project Workspace</p>
              <h1 className="page-title">{project.title}</h1>

              {project.description && (
                <p className="page-subtitle">{project.description}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
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

                <span className="badge-soft bg-muted text-muted-foreground">
                  Deadline: {formatDate(project.deadline)}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <Card className="professional-card">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Groups</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {groups?.length ?? 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="professional-card">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Members</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {totalMembers}
                  </p>
                </CardContent>
              </Card>

              <Card className="professional-card">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Avg. Score</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {averageScore}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Evaluated Students
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {scores.length}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Excellent
              </p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-300">
                {excellentCount}
              </p>
            </CardContent>
          </Card>

          <Card className="professional-card-hover">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Needs Attention
              </p>
              <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-300">
                {needsAttentionCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Card className="professional-card mb-6">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Groups</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Create project groups and assign active students.
                    </p>
                  </div>

                  <Button
                    onClick={() => setShowAddGroup(!showAddGroup)}
                    className="rounded-xl"
                  >
                    {showAddGroup ? 'Cancel' : 'Add Group'}
                  </Button>
                </div>
              </CardHeader>

              {showAddGroup && (
                <CardContent>
                  <form onSubmit={handleAddGroup} className="space-y-4">
                    <div>
                      <Label htmlFor="group-name">Group Name</Label>
                      <Input
                        id="group-name"
                        value={groupFormData.group_name}
                        onChange={(e) =>
                          setGroupFormData({
                            ...groupFormData,
                            group_name: e.target.value,
                          })
                        }
                        required
                        disabled={isSubmitting}
                        className="mt-2 rounded-xl"
                        placeholder="Example: Group A"
                      />
                    </div>

                    <div>
                      <Label>Students</Label>

                      <Input
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Search students by name or email..."
                        className="mt-2 rounded-xl"
                        disabled={isSubmitting}
                      />

                      {studentsError && (
                        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                          {studentsError instanceof Error
                            ? studentsError.message
                            : 'Failed to load students'}
                        </div>
                      )}

                      {!students || students.length === 0 ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                          No active student accounts found.
                        </p>
                      ) : filteredStudents.length === 0 ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                          No students match your search.
                        </p>
                      ) : (
                        <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-xl border bg-muted/20 p-3">
                          {filteredStudents.map((student) => (
                            <label
                              key={student.id}
                              className="flex cursor-pointer items-center gap-3 rounded-xl border bg-background/60 p-3 text-sm transition hover:bg-muted/40"
                            >
                              <input
                                type="checkbox"
                                checked={groupFormData.members.includes(
                                  student.id
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setGroupFormData({
                                      ...groupFormData,
                                      members: [
                                        ...groupFormData.members,
                                        student.id,
                                      ],
                                    })
                                  } else {
                                    setGroupFormData({
                                      ...groupFormData,
                                      members: groupFormData.members.filter(
                                        (id) => id !== student.id
                                      ),
                                    })
                                  }
                                }}
                                disabled={isSubmitting}
                              />

                              <span>
                                <span className="font-medium text-foreground">
                                  {student.name}
                                </span>{' '}
                                <span className="text-muted-foreground">
                                  — {student.email}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      )}

                      <p className="mt-2 text-xs text-muted-foreground">
                        Selected members: {groupFormData.members.length}
                      </p>
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
                      {isSubmitting ? 'Creating...' : 'Create Group'}
                    </Button>
                  </form>
                </CardContent>
              )}
            </Card>

            {groupsError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                {groupsError instanceof Error
                  ? groupsError.message
                  : 'Failed to load groups'}
              </div>
            )}

            <div className="space-y-4">
              {groups && groups.length > 0 ? (
                groups.map((group) => (
                  <Card key={group.id} className="professional-card-hover">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg">
                            {group.group_name}
                          </CardTitle>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {group.group_members?.length ?? 0} member(s)
                          </p>
                        </div>

                        <span className="badge-soft bg-muted text-muted-foreground">
                          Group
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {group.group_members &&
                      group.group_members.length > 0 ? (
                        <div className="space-y-2">
                          {group.group_members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-3 text-sm"
                            >
                              <span className="font-medium text-foreground">
                                {member.student?.name ?? 'Unknown student'}
                              </span>

                              <span className="text-xs text-muted-foreground">
                                {member.student?.email ?? member.student_id}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No members added yet.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="professional-card">
                  <CardContent className="py-10 text-center">
                    <h2 className="text-xl font-semibold text-foreground">
                      No groups created yet
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Create a group and assign students to begin fairness
                      tracking.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div>
          <Card className="mb-6 overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white shadow-2xl">
  <CardHeader className="border-b border-white/10 bg-white/5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <CardTitle className="text-white">Teacher Inbox</CardTitle>
        <p className="mt-1 text-sm text-white/60">
          Reply to student project questions, task concerns, work log issues,
          and fairness score questions.
        </p>
      </div>

      {unreadStudentMessages > 0 && (
        <span className="rounded-full bg-pink-500 px-3 py-1 text-xs font-semibold text-white">
          {unreadStudentMessages} unread
        </span>
      )}
    </div>
  </CardHeader>

  <CardContent className="space-y-5 p-5">
    {projectMessagesError && (
      <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
        {projectMessagesError instanceof Error
          ? projectMessagesError.message
          : 'Failed to load project messages'}
      </div>
    )}

    {chatStudents.length === 0 ? (
      <div className="rounded-3xl border border-white/10 bg-black/20 p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-2xl">
          📥
        </div>

        <h3 className="mt-4 font-semibold text-white">
          No student messages yet
        </h3>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/55">
          Student help messages for this project will appear here when they
          contact you.
        </p>
      </div>
    ) : (
      <>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {chatStudents.map((student) => {
            const isSelected = selectedChatStudentId === student.id
            const studentUnread =
              projectMessages?.filter(
                (message) =>
                  message.sender_id === student.id &&
                  message.receiver_id === user?.id &&
                  !message.is_read
              ).length ?? 0

            return (
              <button
                key={student.id}
                type="button"
                onClick={() => {
                  setSelectedChatStudentId(student.id)
                  setTeacherReplyError(null)
                  setTeacherReplySuccess(null)
                }}
                className={`min-w-[180px] rounded-2xl border p-3 text-left transition ${
                  isSelected
                    ? 'border-white/30 bg-white text-slate-950'
                    : 'border-white/10 bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                <p className="truncate text-sm font-semibold">
                  {student.name || 'Student'}
                </p>

                <p
                  className={`mt-1 truncate text-xs ${
                    isSelected ? 'text-slate-500' : 'text-white/50'
                  }`}
                >
                  {student.email}
                </p>

                {studentUnread > 0 && (
                  <span className="mt-2 inline-flex rounded-full bg-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {studentUnread} new
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20">
          <div className="border-b border-white/10 p-4">
            <p className="text-sm font-semibold text-white">
              {selectedChatStudent?.name || 'Select student'}
            </p>

            {selectedChatStudent?.email && (
              <p className="mt-1 text-xs text-white/50">
                {selectedChatStudent.email}
              </p>
            )}
          </div>

          <div className="max-h-[360px] space-y-4 overflow-y-auto p-4">
            {selectedChatMessages.length === 0 ? (
              <div className="py-8 text-center text-sm text-white/50">
                No messages in this conversation.
              </div>
            ) : (
              selectedChatMessages.map((message) => {
                const isMine = message.sender_id === user?.id

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isMine ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-lg ${
                        isMine
                          ? 'rounded-br-md bg-blue-500 text-white'
                          : 'rounded-bl-md border border-white/10 bg-white/10 text-white'
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-semibold opacity-90">
                          {isMine
                            ? 'You'
                            : message.sender?.name || 'Student'}
                        </span>

                        <span className="text-[10px] opacity-60">
                          {formatDate(message.created_at)}
                        </span>
                      </div>

                      <p className="whitespace-pre-line text-sm leading-6">
                        {message.message}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {(teacherReplyError || teacherReplySuccess) && (
          <div
            className={`rounded-2xl border p-3 text-sm ${
              teacherReplyError
                ? 'border-red-400/30 bg-red-500/10 text-red-100'
                : 'border-green-400/30 bg-green-500/10 text-green-100'
            }`}
          >
            {teacherReplyError || teacherReplySuccess}
          </div>
        )}

        <form
          onSubmit={handleSendTeacherReply}
          className="rounded-3xl border border-white/10 bg-white/10 p-3"
        >
          <textarea
            value={teacherReply}
            onChange={(e) => {
              setTeacherReply(e.target.value)
              setTeacherReplyError(null)
              setTeacherReplySuccess(null)
            }}
            disabled={teacherReplySending || !selectedChatStudentId}
            maxLength={1500}
            placeholder="Write a reply to the selected student..."
            className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
          />

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/45">
              {teacherReply.length}/1500 characters
            </p>

            <Button
              type="submit"
              disabled={teacherReplySending || !selectedChatStudentId}
              className="rounded-2xl bg-white px-6 font-semibold text-slate-950 hover:bg-white/90"
            >
              {teacherReplySending ? 'Sending...' : 'Reply to Student'}
            </Button>
          </div>
        </form>
      </>
    )}
  </CardContent>
</Card>
            <Card className="professional-card mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Teacher Evaluation</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Submit a teacher score for a student assigned to this project.
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmitEvaluation} className="space-y-4">
                  <div>
                    <Label htmlFor="evaluation-student">Student</Label>
                    <select
                      id="evaluation-student"
                      value={evaluationForm.student_id}
                      onChange={(e) =>
                        setEvaluationForm({
                          ...evaluationForm,
                          student_id: e.target.value,
                        })
                      }
                      disabled={evaluationSubmitting}
                      required
                      className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                    >
                      <option value="">Select student</option>

                      {scores.map((score) => (
                        <option key={score.studentId} value={score.studentId}>
                          {score.studentName}
                          {score.studentEmail
                            ? ` — ${score.studentEmail}`
                            : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="evaluation-score">Score 0–100</Label>
                    <Input
                      id="evaluation-score"
                      type="number"
                      min="0"
                      max="100"
                      value={evaluationForm.score}
                      onChange={(e) =>
                        setEvaluationForm({
                          ...evaluationForm,
                          score: e.target.value,
                        })
                      }
                      disabled={evaluationSubmitting}
                      required
                      className="mt-2 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="evaluation-comment">Comment</Label>
                    <textarea
                      id="evaluation-comment"
                      value={evaluationForm.comment}
                      onChange={(e) =>
                        setEvaluationForm({
                          ...evaluationForm,
                          comment: e.target.value,
                        })
                      }
                      disabled={evaluationSubmitting}
                      className="mt-2 flex min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="Optional teacher feedback..."
                    />
                  </div>

                  {evaluationError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                      {evaluationError}
                    </div>
                  )}

                  {evaluationSuccess && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200">
                      {evaluationSuccess}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={evaluationSubmitting}
                    className="rounded-xl"
                  >
                    {evaluationSubmitting
                      ? 'Submitting...'
                      : 'Submit Evaluation'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
  <CardTitle>AI Fairness Report Summary</CardTitle>
  <span className="inline-flex items-center rounded-full border border-purple-300/40 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-200">
    AI Powered
  </span>
</div>

<p className="mt-1 text-sm text-muted-foreground">
  Smart summary based on student fairness score, peer
  score, effort score, work logs, and teacher evaluation.
</p>      
              </CardHeader>

              <CardContent>
                {scoresError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                    {scoresError}
                  </div>
                )}

                <div className="space-y-4">
                  {scores && scores.length > 0 ? (
                    scores.map((score) => (
                      <div
                        key={score.studentId}
                        className="rounded-2xl border bg-muted/20 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-foreground">
                              {score.studentName}
                            </p>

                            {score.studentEmail && (
                              <p className="text-xs text-muted-foreground">
                                {score.studentEmail}
                              </p>
                            )}

                            <p className="mt-2 text-sm capitalize text-muted-foreground">
                              Status: {score.status}
                            </p>
                          </div>

                          <div className="text-right">
                            <p
                              className={`text-3xl font-bold ${getScoreTextClass(
                                score.overallScore
                              )}`}
                            >
                              {score.overallScore}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              / 100
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                            <span>Overall Progress</span>
                            <span>{score.overallScore}%</span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: getScoreWidth(score.overallScore),
                              }}
                            />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                          <div className="rounded-xl border bg-background/70 p-3">
                            <p className="text-xs text-muted-foreground">
                              Peer
                            </p>
                            <p className="mt-1 font-bold text-foreground">
                              {score.peerScore}/100
                            </p>
                          </div>

                          <div className="rounded-xl border bg-background/70 p-3">
                            <p className="text-xs text-muted-foreground">
                              Effort
                            </p>
                            <p className="mt-1 font-bold text-foreground">
                              {score.effortScore}/100
                            </p>
                          </div>

                          <div className="rounded-xl border bg-background/70 p-3">
                            <p className="text-xs text-muted-foreground">
                              Teacher
                            </p>
                            <p className="mt-1 font-bold text-foreground">
                              {score.teacherScore}/100
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center">
                      <h2 className="text-lg font-semibold text-foreground">
                        No fairness data yet
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Add groups, work logs, peer ratings, and evaluations to
                        generate fairness scores.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}