'use client'


import RouteLoadingButton from '@/components/route-loading-button'
import AppLoading from '@/components/app-loading'
import StudentNav from '@/components/navigation/student-nav'
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
import { useFairnessScores } from '@/hooks/useFairnessScores'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
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

interface GroupMember {
  id: string
  student_id: string
  student: Student | null
}

interface Group {
  id: string
  group_name: string
  project_id: string
  group_members: GroupMember[]
}

interface WorkLog {
  id: string
  student_id: string
  project_id: string
  week_no: number
  work_description: string
  evidence_link: string | null
  created_at: string
}

interface PeerRating {
  id: string
  rater_id: string
  rated_student_id: string
  project_id: string
  rating: number
  feedback: string | null
  rater?: Student | null
  rated_student?: Student | null
}

interface Dispute {
  id: string
  student_id: string
  project_id: string
  rating_id: string | null
  reason: string
  evidence: string | null
  status: string
  admin_comment: string | null
}
interface StudentTask {
  id: string
  project_id: string
  student_id: string
  title: string
  description: string | null
  is_completed: boolean
  created_at: string
  updated_at: string
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

function getFairnessStatusBadge(status: string) {
  if (status === 'excellent') {
    return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200'
  }

  if (status === 'good') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
  }

  if (status === 'fair') {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-200'
  }

  return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200'
}

function getDisputeBadge(status: string) {
  if (status === 'resolved') {
    return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200'
  }

  if (status === 'rejected') {
    return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200'
  }

  return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-200'
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
function getPeerRatingBadgeClass(rating: number) {
  if (rating >= 5) {
    return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200'
  }

  if (rating >= 4) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
  }

  if (rating >= 3) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-200'
  }

  return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200'
}
function getTimelineBadgeClass(type: string) {
  if (type === 'project') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
  }

  if (type === 'work-log') {
    return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200'
  }

  if (type === 'rating') {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-200'
  }

  return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-200'
}
function formatTimelineDate(value?: string | null) {
  if (!value) return 'No date'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return date.toLocaleDateString()
}

export default function StudentProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const { user, loading: userLoading } = useAuth()

  const {
    data: project,
    error: projectError,
    isLoading: projectLoading,
  } = useSWR<Project>(
    projectId ? `/api/projects?id=${encodeURIComponent(projectId)}` : null,
    fetcher
  )

  const {
    data: groups,
    error: groupsError,
    isLoading: groupsLoading,
  } = useSWR<Group[]>(
    projectId ? `/api/groups?projectId=${encodeURIComponent(projectId)}` : null,
    fetcher
  )

  const {
    data: workLogs,
    error: workLogsError,
    isLoading: workLogsLoading,
    mutate: mutateWorkLogs,
  } = useSWR<WorkLog[]>(
    projectId
      ? `/api/work-logs?projectId=${encodeURIComponent(projectId)}`
      : null,
    fetcher
  )

  const {
    data: peerRatings,
    error: peerRatingsError,
    isLoading: peerRatingsLoading,
    mutate: mutatePeerRatings,
  } = useSWR<PeerRating[]>(
    projectId
      ? `/api/peer-ratings?projectId=${encodeURIComponent(projectId)}`
      : null,
    fetcher
  )

  const {
    data: disputes,
    error: disputesError,
    isLoading: disputesLoading,
    mutate: mutateDisputes,
  } = useSWR<Dispute[]>(
    projectId ? `/api/disputes?projectId=${encodeURIComponent(projectId)}` : null,
    fetcher
  )
  const {
    data: studentTasks,
    error: studentTasksError,
    isLoading: studentTasksLoading,
    mutate: mutateStudentTasks,
  } = useSWR<StudentTask[]>(
    projectId
      ? `/api/student-tasks?projectId=${encodeURIComponent(projectId)}`
      : null,
    fetcher
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
      refreshInterval: 8000,
      revalidateOnFocus: true,
    }
  )

  const {
    scores,
    loading: scoresLoading,
    error: scoresError,
  } = useFairnessScores(projectId)

  const [workForm, setWorkForm] = useState({
    week_no: '',
    work_description: '',
    evidence_link: '',
  })

  const [ratingForm, setRatingForm] = useState({
    rated_student_id: '',
    rating: '5',
    feedback: '',
  })

  const [disputeForm, setDisputeForm] = useState({
    rating_id: '',
    reason: '',
    evidence: '',
  })

  const [workError, setWorkError] = useState<string | null>(null)
  const [ratingError, setRatingError] = useState<string | null>(null)
  const [disputeError, setDisputeError] = useState<string | null>(null)

  const [workSubmitting, setWorkSubmitting] = useState(false)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [disputeSubmitting, setDisputeSubmitting] = useState(false)
  const [evidenceUploading, setEvidenceUploading] = useState(false)
const [evidenceUploadError, setEvidenceUploadError] = useState<string | null>(
  null
)
const [evidenceUploadSuccess, setEvidenceUploadSuccess] = useState<
  string | null
>(null)
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
  })
  
  const [taskError, setTaskError] = useState<string | null>(null)
  const [taskSuccess, setTaskSuccess] = useState<string | null>(null)
  const [taskSubmitting, setTaskSubmitting] = useState(false)
  const [taskActionId, setTaskActionId] = useState<string | null>(null)
  const [chatMessage, setChatMessage] = useState('')
const [chatSending, setChatSending] = useState(false)
const [chatError, setChatError] = useState<string | null>(null)
const [chatSuccess, setChatSuccess] = useState<string | null>(null)
  const [editingWorkLogId, setEditingWorkLogId] = useState<string | null>(null)
const [editWorkLogForm, setEditWorkLogForm] = useState({
  week_no: '',
  work_description: '',
  evidence_link: '',
})
const [editWorkLogError, setEditWorkLogError] = useState<string | null>(null)
const [editWorkLogSuccess, setEditWorkLogSuccess] = useState<string | null>(
  null
)
const [editWorkLogSubmitting, setEditWorkLogSubmitting] = useState(false)
const [deleteWorkLogId, setDeleteWorkLogId] = useState<string | null>(null)
  const [workLogAiLoading, setWorkLogAiLoading] = useState(false)
const [workLogAiError, setWorkLogAiError] = useState<string | null>(null)
const [workLogAiNote, setWorkLogAiNote] = useState<string | null>(null)
const [workLogAiSource, setWorkLogAiSource] = useState<string | null>(null)
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [aiSource, setAiSource] = useState<string | null>(null)
  const [aiNote, setAiNote] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    if (!userLoading && (!user || user.role !== 'student')) {
      router.push('/auth/login')
    }
  }, [user, userLoading, router])

  const myGroup = useMemo(() => {
    if (!groups || !user) return null

    return groups.find((group) =>
      group.group_members?.some((member) => member.student_id === user.id)
    )
  }, [groups, user])

  const myGroupMembers = useMemo(() => {
    if (!myGroup || !user) return []

    return (
      myGroup.group_members?.filter((member) => member.student_id !== user.id) ??
      []
    )
  }, [myGroup, user])

  const receivedRatings = useMemo(() => {
    if (!peerRatings || !user) return []

    return peerRatings.filter((rating) => rating.rated_student_id === user.id)
  }, [peerRatings, user])

  const myScore = useMemo(() => {
    if (!user) return null

    return scores.find((score) => score.studentId === user.id) ?? scores[0]
  }, [scores, user])

  const myWorkLogs = useMemo(() => {
    if (!workLogs || !user) return []

    return workLogs.filter((log) => log.student_id === user.id)
  }, [workLogs, user])
  const completedTasks = useMemo(() => {
    return studentTasks?.filter((task) => task.is_completed).length ?? 0
  }, [studentTasks])
  
  const pendingTasks = useMemo(() => {
    return studentTasks?.filter((task) => !task.is_completed).length ?? 0
  }, [studentTasks])
  
  const taskProgress = useMemo(() => {
    if (!studentTasks || studentTasks.length === 0) return 0
  
    return Math.round((completedTasks / studentTasks.length) * 100)
  }, [studentTasks, completedTasks])
  const unreadTeacherMessages = useMemo(() => {
    if (!projectMessages || !user) return 0
  
    return projectMessages.filter(
      (message) => message.receiver_id === user.id && !message.is_read
    ).length
  }, [projectMessages, user])
  
  const teacherName = useMemo(() => {
    const teacherMessage = projectMessages?.find(
      (message) =>
        message.sender?.role === 'teacher' ||
        message.receiver?.role === 'teacher'
    )
  
    return (
      teacherMessage?.sender?.role === 'teacher'
        ? teacherMessage.sender?.name
        : teacherMessage?.receiver?.name
    ) || 'Project Teacher'
  }, [projectMessages])
  const projectTimeline = useMemo(() => {
    const items: {
      id: string
      title: string
      description: string
      date: string | null
      type: 'project' | 'work-log' | 'rating' | 'dispute'
    }[] = []
  
    if (project) {
      items.push({
        id: `project-${project.id}`,
        title: 'Project Assigned',
        description: `${project.title} is available in your student workspace.`,
        date: project.deadline,
        type: 'project',
      })
    }
  
    myWorkLogs.forEach((log) => {
      items.push({
        id: `work-log-${log.id}`,
        title: `Work Log Submitted - Week ${log.week_no}`,
        description: log.work_description,
        date: log.created_at,
        type: 'work-log',
      })
    })
  
    receivedRatings.forEach((rating) => {
      items.push({
        id: `rating-${rating.id}`,
        title: `Peer Feedback Received - ${rating.rating}/5`,
        description:
          rating.feedback || 'A group member submitted a peer rating.',
        date: null,
        type: 'rating',
      })
    })
  
    ;(disputes ?? []).forEach((dispute) => {
      items.push({
        id: `dispute-${dispute.id}`,
        title: `Dispute ${dispute.status}`,
        description: dispute.reason,
        date: null,
        type: 'dispute',
      })
    })
  
    return items
  }, [project, myWorkLogs, receivedRatings, disputes])

  const handleSubmitWorkLog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setWorkSubmitting(true)
    setWorkError(null)

    try {
      const res = await fetch('/api/work-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          project_id: projectId,
          week_no: Number(workForm.week_no),
          work_description: workForm.work_description,
          evidence_link: workForm.evidence_link,
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to submit work log')
      }

      setWorkForm({
        week_no: '',
        work_description: '',
        evidence_link: '',
      })
      setEvidenceUploadError(null)
setEvidenceUploadSuccess(null)
      await mutateWorkLogs()
    } catch (error) {
      setWorkError(
        error instanceof Error ? error.message : 'Failed to submit work log'
      )
    } finally {
      setWorkSubmitting(false)
    }
  }
  const handleEvidenceUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
  
    if (!file) return
  
    setEvidenceUploading(true)
    setEvidenceUploadError(null)
    setEvidenceUploadSuccess(null)
  
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('project_id', projectId)
  
      const res = await fetch('/api/evidence-upload', {
        method: 'POST',
        credentials: 'include',
        body: uploadData,
      })
  
      const payload = await res.json()
  
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to upload evidence file')
      }
  
      setWorkForm((previous) => ({
        ...previous,
        evidence_link: payload.url,
      }))
  
      setEvidenceUploadSuccess('Evidence file uploaded successfully.')
    } catch (error) {
      setEvidenceUploadError(
        error instanceof Error ? error.message : 'Failed to upload evidence file'
      )
    } finally {
      setEvidenceUploading(false)
      e.target.value = ''
    }
  }
  const handleSendTeacherMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
  
    setChatSending(true)
    setChatError(null)
    setChatSuccess(null)
  
    try {
      const message = chatMessage.trim()
  
      if (!message) {
        throw new Error('Write a message before sending.')
      }
  
      const res = await fetch('/api/project-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          project_id: projectId,
          message,
        }),
      })
  
      const payload = await res.json()
  
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to send message')
      }
  
      setChatMessage('')
      setChatSuccess('Message sent to teacher.')
      await mutateProjectMessages()
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setChatSending(false)
    }
  }
  
  const useQuickTeacherMessage = (message: string) => {
    setChatMessage(message)
    setChatError(null)
    setChatSuccess(null)
  }
  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  
    setTaskSubmitting(true)
    setTaskError(null)
    setTaskSuccess(null)
  
    try {
      const title = taskForm.title.trim()
      const description = taskForm.description.trim()
  
      if (!title) {
        throw new Error('Task title is required.')
      }
  
      const res = await fetch('/api/student-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          project_id: projectId,
          title,
          description,
        }),
      })
  
      const payload = await res.json()
  
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to create task')
      }
  
      setTaskForm({
        title: '',
        description: '',
      })
  
      setTaskSuccess('Task added successfully.')
      await mutateStudentTasks()
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'Failed to create task')
    } finally {
      setTaskSubmitting(false)
    }
  }
  
  const handleToggleTask = async (task: StudentTask) => {
    setTaskActionId(task.id)
    setTaskError(null)
    setTaskSuccess(null)
  
    try {
      const res = await fetch('/api/student-tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: task.id,
          is_completed: !task.is_completed,
        }),
      })
  
      const payload = await res.json()
  
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to update task')
      }
  
      setTaskSuccess(
        task.is_completed
          ? 'Task marked as pending.'
          : 'Task marked as completed.'
      )
  
      await mutateStudentTasks()
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'Failed to update task')
    } finally {
      setTaskActionId(null)
    }
  }
  
  const handleDeleteTask = async (task: StudentTask) => {
    const confirmed = window.confirm(
      `Delete task "${task.title}"? This action cannot be undone.`
    )
  
    if (!confirmed) return
  
    setTaskActionId(task.id)
    setTaskError(null)
    setTaskSuccess(null)
  
    try {
      const res = await fetch(
        `/api/student-tasks?id=${encodeURIComponent(task.id)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )
  
      const payload = await res.json()
  
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to delete task')
      }
  
      setTaskSuccess('Task deleted successfully.')
      await mutateStudentTasks()
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'Failed to delete task')
    } finally {
      setTaskActionId(null)
    }
  }
  const startEditingWorkLog = (log: WorkLog) => {
    setEditingWorkLogId(log.id)
    setEditWorkLogError(null)
    setEditWorkLogSuccess(null)
  
    setEditWorkLogForm({
      week_no: String(log.week_no),
      work_description: log.work_description,
      evidence_link: log.evidence_link ?? '',
    })
  }
  
  const cancelEditingWorkLog = () => {
    setEditingWorkLogId(null)
    setEditWorkLogError(null)
    setEditWorkLogSuccess(null)
    setEditWorkLogForm({
      week_no: '',
      work_description: '',
      evidence_link: '',
    })
  }
  
  const handleUpdateWorkLog = async (logId: string) => {
    setEditWorkLogSubmitting(true)
    setEditWorkLogError(null)
    setEditWorkLogSuccess(null)
  
    try {
      const res = await fetch('/api/work-logs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: logId,
          week_no: Number(editWorkLogForm.week_no),
          work_description: editWorkLogForm.work_description,
          evidence_link: editWorkLogForm.evidence_link,
        }),
      })
  
      const payload = await res.json()
  
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to update work log')
      }
  
      setEditWorkLogSuccess('Work log updated successfully.')
      setEditingWorkLogId(null)
      setEditWorkLogForm({
        week_no: '',
        work_description: '',
        evidence_link: '',
      })
  
      await mutateWorkLogs()
    } catch (error) {
      setEditWorkLogError(
        error instanceof Error ? error.message : 'Failed to update work log'
      )
    } finally {
      setEditWorkLogSubmitting(false)
    }
  }
  
  const handleDeleteWorkLog = async (log: WorkLog) => {
    const confirmed = window.confirm(
      `Delete work log for week ${log.week_no}? This action cannot be undone.`
    )
  
    if (!confirmed) return
  
    setDeleteWorkLogId(log.id)
    setEditWorkLogError(null)
    setEditWorkLogSuccess(null)
  
    try {
      const res = await fetch(
        `/api/work-logs?id=${encodeURIComponent(log.id)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )
  
      const payload = await res.json()
  
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to delete work log')
      }
  
      setEditWorkLogSuccess('Work log deleted successfully.')
  
      if (editingWorkLogId === log.id) {
        cancelEditingWorkLog()
      }
  
      await mutateWorkLogs()
    } catch (error) {
      setEditWorkLogError(
        error instanceof Error ? error.message : 'Failed to delete work log'
      )
    } finally {
      setDeleteWorkLogId(null)
    }
  }

  const handleSubmitPeerRating = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setRatingSubmitting(true)
    setRatingError(null)

    try {
      const res = await fetch('/api/peer-ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          project_id: projectId,
          rated_student_id: ratingForm.rated_student_id,
          rating: Number(ratingForm.rating),
          feedback: ratingForm.feedback,
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to submit peer rating')
      }

      setRatingForm({
        rated_student_id: '',
        rating: '5',
        feedback: '',
      })

      await mutatePeerRatings()
    } catch (error) {
      setRatingError(
        error instanceof Error ? error.message : 'Failed to submit peer rating'
      )
    } finally {
      setRatingSubmitting(false)
    }
  }

  const handleSubmitDispute = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setDisputeSubmitting(true)
    setDisputeError(null)

    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          project_id: projectId,
          rating_id: disputeForm.rating_id || null,
          reason: disputeForm.reason,
          evidence: disputeForm.evidence,
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to create dispute')
      }

      setDisputeForm({
        rating_id: '',
        reason: '',
        evidence: '',
      })

      await mutateDisputes()
    } catch (error) {
      setDisputeError(
        error instanceof Error ? error.message : 'Failed to create dispute'
      )
    } finally {
      setDisputeSubmitting(false)
    }
  }
  const handleExplainMyScore = async () => {
    if (!project || !myScore) {
      setAiError('Fairness score data is not available yet.')
      return
    }
  
    setAiLoading(true)
    setAiError(null)
    setAiExplanation(null)
    setAiSource(null)
    setAiNote(null)
  
    try {
      const res = await fetch('/api/ai/student-score-explanation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          project: {
            title: project.title,
            description: project.description,
            status: project.status,
            health_status: project.health_status,
            deadline: project.deadline,
          },
          score: {
            studentName: myScore.studentName,
            studentEmail: myScore.studentEmail,
            peerAverageRating: myScore.peerAverageRating,
            peerScore: myScore.peerScore,
            peerRatingCount: myScore.peerRatingCount,
            effortScore: myScore.effortScore,
            workLogCount: myScore.workLogCount,
            teacherScore: myScore.teacherScore,
            fairnessScore: myScore.fairnessScore,
            workContribution: myScore.workContribution,
            peerRatingScore: myScore.peerRatingScore,
            teacherEvaluationScore: myScore.teacherEvaluationScore,
            overallScore: myScore.overallScore,
            status: myScore.status,
          },
        }),
      })
  
      const payload = await res.json()
  
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to explain your score')
      }
  
      setAiExplanation(payload.explanation || 'No explanation generated.')
      setAiSource(payload.source || null)
      setAiNote(payload.note || null)
    } catch (error) {
      setAiError(
        error instanceof Error ? error.message : 'Failed to explain your score'
      )
    } finally {
      setAiLoading(false)
    }
  }
  const handleImproveWorkLogWithAi = async () => {
    setWorkLogAiLoading(true)
    setWorkLogAiError(null)
    setWorkLogAiNote(null)
    setWorkLogAiSource(null)
  
    try {
      const description = workForm.work_description.trim()
  
      if (!description) {
        throw new Error('Write a work description first, then improve it with AI.')
      }
  
      const res = await fetch('/api/ai/improve-work-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          weekNo: workForm.week_no,
          description,
          evidenceLink: workForm.evidence_link,
        }),
      })
  
      const payload = await res.json()
  
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to improve work log')
      }
  
      setWorkForm((previous) => ({
        ...previous,
        work_description: payload.improvedText || previous.work_description,
      }))
  
      setWorkLogAiSource(payload.source || null)
      setWorkLogAiNote(payload.note || null)
    } catch (error) {
      setWorkLogAiError(
        error instanceof Error ? error.message : 'Failed to improve work log'
      )
    } finally {
      setWorkLogAiLoading(false)
    }
  }
   const handleDownloadStudentReport = () => {
  if (!project || !user) {
    alert('Report data is not available yet.')
    return
  }

  const scoreHtml = myScore
    ? `
      <div class="score-box">
        <h2>Fairness Score</h2>
        <p><strong>Overall Score:</strong> ${myScore.overallScore}/100</p>
        <p><strong>Status:</strong> ${myScore.status}</p>
        <p><strong>Peer Score:</strong> ${myScore.peerScore}/100</p>
        <p><strong>Effort Score:</strong> ${myScore.effortScore}/100</p>
        <p><strong>Teacher Score:</strong> ${myScore.teacherScore}/100</p>
        <p><strong>Work Logs Count:</strong> ${myScore.workLogCount}</p>
        <p><strong>Peer Ratings Received:</strong> ${myScore.peerRatingCount}</p>
      </div>
    `
    : `
      <div class="score-box">
        <h2>Fairness Score</h2>
        <p>No fairness score is available yet.</p>
      </div>
    `

  const workLogsHtml =
    myWorkLogs.length > 0
      ? myWorkLogs
          .map(
            (log) => `
            <div class="item">
              <h3>Week ${log.week_no}</h3>
              <p>${log.work_description}</p>
              ${
                log.evidence_link
                  ? `<p><strong>Evidence:</strong> ${log.evidence_link}</p>`
                  : '<p><strong>Evidence:</strong> Not provided</p>'
              }
              <p class="muted">Submitted: ${formatDate(log.created_at)}</p>
            </div>
          `
          )
          .join('')
      : '<p>No work logs submitted yet.</p>'

  const peerFeedbackHtml =
    receivedRatings.length > 0
      ? receivedRatings
          .map(
            (rating) => `
            <div class="item">
              <h3>Rating: ${rating.rating}/5</h3>
              <p><strong>Rated By:</strong> ${
                rating.rater?.name || 'Group member'
              }</p>
              <p><strong>Email:</strong> ${
                rating.rater?.email || 'Not available'
              }</p>
              <p><strong>Feedback:</strong> ${
                rating.feedback || 'No written feedback provided.'
              }</p>
            </div>
          `
          )
          .join('')
      : '<p>No peer feedback received yet.</p>'

  const disputesHtml =
    disputes && disputes.length > 0
      ? disputes
          .map(
            (dispute) => `
            <div class="item">
              <h3>Status: ${dispute.status}</h3>
              <p><strong>Reason:</strong> ${dispute.reason}</p>
              <p><strong>Evidence:</strong> ${
                dispute.evidence || 'No evidence provided.'
              }</p>
              <p><strong>Admin Comment:</strong> ${
                dispute.admin_comment || 'No admin comment yet.'
              }</p>
            </div>
          `
          )
          .join('')
      : '<p>No disputes submitted yet.</p>'

  const reportWindow = window.open('', '_blank')

  if (!reportWindow) {
    alert('Popup blocked. Please allow popups to download the report.')
    return
  }

  reportWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Student Fairness Report - ${project.title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #111827;
            margin: 40px;
            line-height: 1.6;
          }

          .header {
            border-bottom: 3px solid #111827;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }

          .brand {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #4b5563;
            font-weight: 700;
          }

          h1 {
            margin: 8px 0 4px;
            font-size: 30px;
          }

          h2 {
            margin-top: 28px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 6px;
            font-size: 20px;
          }

          h3 {
            margin-bottom: 8px;
            font-size: 16px;
          }

          .meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 18px;
          }

          .box,
          .score-box,
          .item {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 14px;
            background: #f9fafb;
          }

          .muted {
            color: #6b7280;
            font-size: 13px;
          }

          .footer {
            margin-top: 40px;
            border-top: 1px solid #e5e7eb;
            padding-top: 12px;
            font-size: 12px;
            color: #6b7280;
          }

          @media print {
            button {
              display: none;
            }

            body {
              margin: 24px;
            }
          }

          .print-button {
            margin-bottom: 24px;
            padding: 10px 16px;
            border: 0;
            border-radius: 10px;
            background: #111827;
            color: white;
            font-weight: 700;
            cursor: pointer;
          }
        </style>
      </head>

      <body>
        <button class="print-button" onclick="window.print()">
          Print / Save as PDF
        </button>

        <div class="header">
          <p class="brand">Fairness Engine</p>
          <h1>Student Fairness Report</h1>
          <p class="muted">Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="box">
          <h2>Student Information</h2>
          <div class="meta">
            <p><strong>Name:</strong> ${user.name || 'Student'}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> Student</p>
            <p><strong>Status:</strong> ${user.status}</p>
          </div>
        </div>

        <div class="box">
          <h2>Project Information</h2>
          <div class="meta">
            <p><strong>Project:</strong> ${project.title}</p>
            <p><strong>Status:</strong> ${project.status}</p>
            <p><strong>Health:</strong> ${project.health_status}</p>
            <p><strong>Deadline:</strong> ${formatDate(project.deadline)}</p>
          </div>
          <p><strong>Description:</strong> ${
            project.description || 'No description provided.'
          }</p>
        </div>

        ${scoreHtml}

        <h2>Work Logs</h2>
        ${workLogsHtml}

        <h2>Peer Feedback Received</h2>
        ${peerFeedbackHtml}

        <h2>Disputes</h2>
        ${disputesHtml}

        <div class="footer">
          <p>
            This report is generated from Fairness Engine student workspace data.
            Scores should be reviewed with peer ratings, work logs, teacher evaluation,
            and dispute evidence.
          </p>
        </div>
      </body>
    </html>
  `)

  reportWindow.document.close()
}
const loading =
userLoading ||
projectLoading ||
groupsLoading ||
workLogsLoading ||
peerRatingsLoading ||
disputesLoading ||
studentTasksLoading ||
projectMessagesLoading ||
scoresLoading
  

    if (loading) {
      return (
        <AppLoading
          title="Preparing student project"
          subtitle="Loading your group, work logs, peer ratings, disputes, and fairness score."
        />
      )
    }

  if (!user || user.role !== 'student') {
    return null
  }

  if (projectError) {
    return (
      <div className="min-h-svh bg-background">
        <StudentNav />
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
        <StudentNav />
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
              This project may be unavailable or no longer assigned to you.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <StudentNav />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="page-hero slide-up">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
                  <div className="mb-4 flex flex-wrap gap-2">
  <Button
    variant="outline"
    onClick={() => router.back()}
    className="rounded-xl"
  >
    Back
  </Button>

  <Button
    type="button"
    onClick={handleDownloadStudentReport}
    className="rounded-xl"
  >
    Download Report
  </Button>
</div>

              <p className="page-kicker">Student Project Workspace</p>
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

            <div className="grid gap-3 sm:grid-cols-4 lg:min-w-[560px]">
              <Card className="professional-card">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Work Logs</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {myWorkLogs.length}
                  </p>
                </CardContent>
              </Card>

              <Card className="professional-card">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Peer Feedback</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {receivedRatings.length}
                  </p>
                </CardContent>
              </Card>

              <Card className="professional-card">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Disputes</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {disputes?.length ?? 0}
                  </p>
                </CardContent>
              </Card>
              <Card className="professional-card">
  <CardContent className="pt-6">
    <p className="text-sm text-muted-foreground">Tasks Done</p>
    <p className="mt-2 text-3xl font-bold text-foreground">
      {completedTasks}/{studentTasks?.length ?? 0}
    </p>
  </CardContent>
</Card>
            </div>
          </div>
        </div>

         {(groupsError ||
  workLogsError ||
  peerRatingsError ||
  disputesError ||
  studentTasksError ||
  projectMessagesError ||
  scoresError) && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {groupsError instanceof Error && <p>{groupsError.message}</p>}
            {studentTasksError instanceof Error && <p>{studentTasksError.message}</p>}
            {projectMessagesError instanceof Error && <p>{projectMessagesError.message}</p>}
            {workLogsError instanceof Error && <p>{workLogsError.message}</p>}
            {peerRatingsError instanceof Error && (
              <p>{peerRatingsError.message}</p>
            )}
            {disputesError instanceof Error && <p>{disputesError.message}</p>}
            {scoresError && <p>{scoresError}</p>}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-8">
            <Card className="professional-card">
            <CardHeader>
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <CardTitle>My Fairness Score</CardTitle>
      <p className="mt-1 text-sm text-muted-foreground">
        View your score breakdown and understand what affected your result.
      </p>
    </div>

    {myScore && (
      <Button
        variant="outline"
        onClick={handleExplainMyScore}
        disabled={aiLoading}
        className="rounded-xl"
      >
        {aiLoading ? 'Explaining...' : 'Explain My Score'}
      </Button>
    )}
  </div>
</CardHeader>

              <CardContent>
                {myScore ? (
                  <div className="space-y-5">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Overall Score
                        </p>
                        <p
                          className={`mt-1 text-5xl font-bold ${getScoreTextClass(
                            myScore.overallScore
                          )}`}
                        >
                          {myScore.overallScore}
                        </p>
                        <p className="text-xs text-muted-foreground">/100</p>
                      </div>

                      <span
                        className={`badge-soft capitalize ${getFairnessStatusBadge(
                          myScore.status
                        )}`}
                      >
                        {myScore.status}
                      </span>
                    </div>

                    <div>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{myScore.overallScore}%</span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: getScoreWidth(myScore.overallScore),
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm sm:grid-cols-3">
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Peer</p>
                        <p className="mt-1 font-bold text-foreground">
                          {myScore.peerScore}/100
                        </p>
                      </div>

                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Effort</p>
                        <p className="mt-1 font-bold text-foreground">
                          {myScore.effortScore}/100
                        </p>
                      </div>

                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">
                          Teacher
                        </p>
                        <p className="mt-1 font-bold text-foreground">
                          {myScore.teacherScore}/100
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-xl border bg-background/70 p-3">
                        <p className="text-muted-foreground">Work Logs</p>
                        <p className="mt-1 font-semibold text-foreground">
                          {myScore.workLogCount}
                        </p>
                      </div>

                      <div className="rounded-xl border bg-background/70 p-3">
                        <p className="text-muted-foreground">
                          Peer Ratings Received
                        </p>
                        <p className="mt-1 font-semibold text-foreground">
                          {myScore.peerRatingCount}
                        </p>
                      </div>
                    </div>
                    {(aiExplanation || aiError || aiLoading) && (
  <div className="rounded-2xl border bg-muted/25 p-4">
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
      <div className="flex flex-wrap items-center gap-2">
  <p className="font-semibold text-foreground">
    AI Score Explanation
  </p>
  <span className="inline-flex items-center rounded-full border border-purple-300/40 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-200">
    AI Powered
  </span>
</div>

<p className="text-xs text-muted-foreground">
  Generated from your peer score, effort score, work logs, and teacher
  evaluation.
</p>
      </div>

      {aiSource && (
        <span className="badge-soft bg-muted text-muted-foreground capitalize">
          Source: {aiSource}
        </span>
      )}
    </div>

    {aiLoading && (
      <div className="rounded-xl border bg-background/70 p-4">
        <p className="text-sm font-medium text-foreground">
          Explaining your fairness score...
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Reviewing score components and improvement areas.
        </p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 rounded-full bg-primary loading-progress" />
        </div>
      </div>
    )}

    {aiError && (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
        {aiError}
      </div>
    )}

    {aiExplanation && (
      <div className="rounded-xl border bg-background/70 p-4">
        {aiNote && (
          <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/40 dark:text-yellow-200">
            {aiNote}
          </div>
        )}

        <div className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
          {aiExplanation}
        </div>
      </div>
    )}
  </div>
)}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <h2 className="text-lg font-semibold text-foreground">
                      No fairness score yet
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Your score will appear after enough work logs, peer
                      ratings, and teacher evaluation data are available.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle>My Group</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {myGroup?.group_name ?? 'Group information'}
                </p>
              </CardHeader>

              <CardContent>
                {myGroupMembers.length > 0 ? (
                  <div className="space-y-2">
                    {myGroupMembers.map((member) => (
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
                  <p className="text-muted-foreground">
                    No other members found in your group.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="professional-card">
  <CardHeader>
    <CardTitle>Peer Feedback Received</CardTitle>
    <p className="text-sm text-muted-foreground">
      View ratings and feedback submitted by your group members.
    </p>
  </CardHeader>

  <CardContent>
    {receivedRatings.length > 0 ? (
      <div className="space-y-4">
        {receivedRatings.map((rating) => (
          <div key={rating.id} className="rounded-2xl border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Rated by
                </p>

                <p className="mt-1 font-semibold text-foreground">
                  {rating.rater?.name || 'Group member'}
                </p>

                {rating.rater?.email && (
                  <p className="text-xs text-muted-foreground">
                    {rating.rater.email}
                  </p>
                )}
              </div>

              <span
                className={`badge-soft ${getPeerRatingBadgeClass(
                  rating.rating
                )}`}
              >
                {rating.rating}/5
              </span>
            </div>

            <div className="mt-4 rounded-xl border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Feedback
              </p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {rating.feedback || 'No written feedback provided.'}
              </p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="rounded-2xl border bg-muted/30 p-5 text-center">
        <h3 className="font-semibold text-foreground">
          No peer feedback received yet
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Feedback from your group members will appear here after they rate
          your contribution.
        </p>
      </div>
    )}
  </CardContent>
</Card>
<Card className="professional-card">
  <CardHeader>
    <CardTitle>Project Progress Timeline</CardTitle>
    <p className="text-sm text-muted-foreground">
      Track your project activity, submitted work logs, peer feedback, and
      dispute updates in one timeline.
    </p>
  </CardHeader>

  <CardContent>
    {projectTimeline.length > 0 ? (
      <div className="space-y-4">
        {projectTimeline.map((item, index) => (
          <div key={item.id} className="relative flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {index + 1}
              </div>

              {index !== projectTimeline.length - 1 && (
                <div className="mt-2 h-full min-h-12 w-px bg-border" />
              )}
            </div>

            <div className="flex-1 rounded-2xl border bg-muted/20 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-foreground">
                    {item.title}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatTimelineDate(item.date)}
                  </p>
                </div>

                <span
                  className={`badge-soft capitalize ${getTimelineBadgeClass(
                    item.type
                  )}`}
                >
                  {item.type.replace('-', ' ')}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="rounded-2xl border bg-muted/30 p-5 text-center">
        <h3 className="font-semibold text-foreground">
          No progress activity yet
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Your work logs, peer feedback, and disputes will appear here as
          timeline events.
        </p>
      </div>
    )}
  </CardContent>
</Card>
            <Card className="professional-card">
  <CardHeader>
    <CardTitle>My Work Logs</CardTitle>
    <p className="text-sm text-muted-foreground">
      Review, edit, or delete your submitted contribution records.
    </p>
  </CardHeader>

  <CardContent>
    {(editWorkLogError || editWorkLogSuccess) && (
      <div
        className={`mb-4 rounded-xl border p-3 text-sm ${
          editWorkLogError
            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200'
            : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200'
        }`}
      >
        {editWorkLogError || editWorkLogSuccess}
      </div>
    )}

    {myWorkLogs.length > 0 ? (
      <div className="space-y-4">
        {myWorkLogs.map((log) => {
          const isEditing = editingWorkLogId === log.id
          const isDeleting = deleteWorkLogId === log.id

          return (
            <div key={log.id} className="rounded-2xl border p-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`edit-week-${log.id}`}>
                      Week Number
                    </Label>
                    <Input
                      id={`edit-week-${log.id}`}
                      type="number"
                      min="1"
                      value={editWorkLogForm.week_no}
                      onChange={(e) =>
                        setEditWorkLogForm({
                          ...editWorkLogForm,
                          week_no: e.target.value,
                        })
                      }
                      disabled={editWorkLogSubmitting}
                      className="mt-2 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`edit-description-${log.id}`}>
                      Work Description
                    </Label>
                    <textarea
                      id={`edit-description-${log.id}`}
                      value={editWorkLogForm.work_description}
                      onChange={(e) =>
                        setEditWorkLogForm({
                          ...editWorkLogForm,
                          work_description: e.target.value,
                        })
                      }
                      disabled={editWorkLogSubmitting}
                      className="mt-2 flex min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`edit-evidence-${log.id}`}>
                      Evidence Link
                    </Label>
                    <Input
                      id={`edit-evidence-${log.id}`}
                      type="url"
                      value={editWorkLogForm.evidence_link}
                      onChange={(e) =>
                        setEditWorkLogForm({
                          ...editWorkLogForm,
                          evidence_link: e.target.value,
                        })
                      }
                      disabled={editWorkLogSubmitting}
                      placeholder="https://..."
                      className="mt-2 rounded-xl"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => handleUpdateWorkLog(log.id)}
                      disabled={editWorkLogSubmitting}
                      className="rounded-xl"
                    >
                      {editWorkLogSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEditingWorkLog}
                      disabled={editWorkLogSubmitting}
                      className="rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        Week {log.week_no}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(log.created_at)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => startEditingWorkLog(log)}
                        disabled={isDeleting}
                        className="rounded-xl"
                      >
                        Edit
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWorkLog(log)}
                        disabled={isDeleting}
                        className="rounded-xl border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {log.work_description}
                  </p>

                  {log.evidence_link && (
                    <a
                      href={log.evidence_link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-sm font-medium text-primary underline"
                    >
                      View evidence
                    </a>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    ) : (
      <p className="text-muted-foreground">
        No work logs submitted yet.
      </p>
    )}
  </CardContent>
</Card>

            
          </div>

          <div className="space-y-8">
          <Card className="professional-card">
  <CardHeader>
    <CardTitle>My Tasks</CardTitle>
    <p className="text-sm text-muted-foreground">
      Add your project tasks and mark them completed as you progress.
    </p>
  </CardHeader>

  <CardContent>
    <div className="mb-5 rounded-2xl border bg-muted/30 p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">Task Progress</span>
        <span className="text-muted-foreground">{taskProgress}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${taskProgress}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {completedTasks} completed, {pendingTasks} pending
      </p>
    </div>

    <form onSubmit={handleCreateTask} className="space-y-4">
      <div>
        <Label htmlFor="task-title">Task Title</Label>
        <Input
          id="task-title"
          value={taskForm.title}
          onChange={(e) =>
            setTaskForm({
              ...taskForm,
              title: e.target.value,
            })
          }
          disabled={taskSubmitting}
          placeholder="Example: Complete login UI"
          className="mt-2 rounded-xl"
        />
      </div>

      <div>
        <Label htmlFor="task-description">Description</Label>
        <textarea
          id="task-description"
          value={taskForm.description}
          onChange={(e) =>
            setTaskForm({
              ...taskForm,
              description: e.target.value,
            })
          }
          disabled={taskSubmitting}
          placeholder="Optional task details..."
          className="mt-2 flex min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>

      {(taskError || taskSuccess) && (
        <div
          className={`rounded-xl border p-3 text-sm ${
            taskError
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200'
              : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200'
          }`}
        >
          {taskError || taskSuccess}
        </div>
      )}

      <Button type="submit" disabled={taskSubmitting} className="rounded-xl">
        {taskSubmitting ? 'Adding...' : 'Add Task'}
      </Button>
    </form>

    <div className="mt-6 space-y-3">
      {!studentTasks || studentTasks.length === 0 ? (
        <div className="rounded-2xl border bg-muted/30 p-5 text-center">
          <h3 className="font-semibold text-foreground">No tasks yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your first project task to start tracking progress.
          </p>
        </div>
      ) : (
        studentTasks.map((task) => (
          <div
            key={task.id}
            className={`rounded-2xl border p-4 ${
              task.is_completed ? 'bg-green-50/60 dark:bg-green-950/20' : ''
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`font-semibold ${
                      task.is_completed
                        ? 'text-green-700 line-through dark:text-green-300'
                        : 'text-foreground'
                    }`}
                  >
                    {task.title}
                  </p>

                  <span
                    className={`badge-soft ${
                      task.is_completed
                        ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-200'
                    }`}
                  >
                    {task.is_completed ? 'Completed' : 'Pending'}
                  </span>
                </div>

                {task.description && (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {task.description}
                  </p>
                )}

                <p className="mt-2 text-xs text-muted-foreground">
                  Created: {formatDate(task.created_at)}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleTask(task)}
                  disabled={taskActionId === task.id}
                  className="rounded-xl"
                >
                  {taskActionId === task.id
                    ? 'Updating...'
                    : task.is_completed
                      ? 'Mark Pending'
                      : 'Mark Done'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteTask(task)}
                  disabled={taskActionId === task.id}
                  className="rounded-xl border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </CardContent>
</Card>

<Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white shadow-2xl">
  <CardHeader className="border-b border-white/10 bg-white/5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-black shadow-lg ring-1 ring-white/15">
          T
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-green-400 ring-2 ring-slate-950" />
        </div>

        <div>
          <CardTitle className="text-white">
            Teacher Help Chat
          </CardTitle>
          <p className="mt-1 text-sm text-white/60">
            Ask your teacher for help about tasks, work logs, ratings, or project issues.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
          {teacherName}
        </span>

        {unreadTeacherMessages > 0 && (
          <span className="rounded-full bg-pink-500 px-3 py-1 text-xs font-semibold text-white">
            {unreadTeacherMessages} unread
          </span>
        )}
      </div>
    </div>
  </CardHeader>

  <CardContent className="space-y-5 p-5">
    <div className="grid gap-2 sm:grid-cols-3">
      <button
        type="button"
        onClick={() =>
          useQuickTeacherMessage(
            'Hello teacher, I need help understanding my project task.'
          )
        }
        className="rounded-2xl border border-white/10 bg-white/10 p-3 text-left text-xs font-medium text-white/80 transition hover:bg-white/15"
      >
        Need task help
      </button>

      <button
        type="button"
        onClick={() =>
          useQuickTeacherMessage(
            'Hello teacher, can you please review my submitted work log evidence?'
          )
        }
        className="rounded-2xl border border-white/10 bg-white/10 p-3 text-left text-xs font-medium text-white/80 transition hover:bg-white/15"
      >
        Review evidence
      </button>

      <button
        type="button"
        onClick={() =>
          useQuickTeacherMessage(
            'Hello teacher, I have a question about my fairness score.'
          )
        }
        className="rounded-2xl border border-white/10 bg-white/10 p-3 text-left text-xs font-medium text-white/80 transition hover:bg-white/15"
      >
        Score question
      </button>
    </div>

    <div className="max-h-[360px] space-y-4 overflow-y-auto rounded-3xl border border-white/10 bg-black/20 p-4">
      {!projectMessages || projectMessages.length === 0 ? (
        <div className="py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-2xl">
            💬
          </div>

          <h3 className="mt-4 font-semibold text-white">
            No messages yet
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/55">
            Start a conversation with your teacher. Your project-related messages will appear here.
          </p>
        </div>
      ) : (
        projectMessages.map((message) => {
          const isMine = message.sender_id === user?.id

          return (
            <div
              key={message.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
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
                      : message.sender?.name || 'Teacher'}
                  </span>

                  <span className="text-[10px] opacity-60">
                    {formatDate(message.created_at)}
                  </span>
                </div>

                <p className="whitespace-pre-line text-sm leading-6">
                  {message.message}
                </p>

                {isMine && (
                  <p className="mt-1 text-right text-[10px] text-white/70">
                    Sent
                  </p>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>

    {(chatError || chatSuccess) && (
      <div
        className={`rounded-2xl border p-3 text-sm ${
          chatError
            ? 'border-red-400/30 bg-red-500/10 text-red-100'
            : 'border-green-400/30 bg-green-500/10 text-green-100'
        }`}
      >
        {chatError || chatSuccess}
      </div>
    )}

    <form
      onSubmit={handleSendTeacherMessage}
      className="rounded-3xl border border-white/10 bg-white/10 p-3"
    >
      <textarea
        value={chatMessage}
        onChange={(e) => {
          setChatMessage(e.target.value)
          setChatError(null)
          setChatSuccess(null)
        }}
        disabled={chatSending}
        maxLength={1500}
        placeholder="Write a message to your teacher..."
        className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
      />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-white/45">
          {chatMessage.length}/1500 characters
        </p>

        <Button
          type="submit"
          disabled={chatSending}
          className="rounded-2xl bg-white px-6 font-semibold text-slate-950 hover:bg-white/90"
        >
          {chatSending ? 'Sending...' : 'Send to Teacher'}
        </Button>
      </div>
    </form>
  </CardContent>
</Card>
            <Card className="professional-card">
              <CardHeader>
                <CardTitle>Submit Work Log</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Record your weekly contribution with optional evidence.
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmitWorkLog} className="space-y-4">
                  <div>
                    <Label htmlFor="week-no">Week Number</Label>
                    <Input
                      id="week-no"
                      type="number"
                      min="1"
                      value={workForm.week_no}
                      onChange={(e) =>
                        setWorkForm({
                          ...workForm,
                          week_no: e.target.value,
                        })
                      }
                      disabled={workSubmitting}
                      required
                      className="mt-2 rounded-xl"
                    />
                  </div>

                  <div>
  <div className="flex items-center justify-between gap-3">
    <Label htmlFor="work-description">Work Description</Label>

    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleImproveWorkLogWithAi}
      disabled={workSubmitting || workLogAiLoading}
      className="rounded-xl"
    >
      {workLogAiLoading ? 'Improving...' : 'Improve with AI'}
    </Button>
  </div>

  <textarea
    id="work-description"
    value={workForm.work_description}
    onChange={(e) => {
      setWorkForm({
        ...workForm,
        work_description: e.target.value,
      })
      setWorkLogAiError(null)
      setWorkLogAiNote(null)
      setWorkLogAiSource(null)
    }}
    disabled={workSubmitting || workLogAiLoading}
    required
    className="mt-2 flex min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
    placeholder="Describe what you contributed this week..."
  />

  {workLogAiLoading && (
    <div className="mt-3 rounded-xl border bg-muted/30 p-3">
      <p className="text-sm font-medium text-foreground">
        Improving your work log...
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Making your contribution clearer and more professional.
      </p>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 rounded-full bg-primary loading-progress" />
      </div>
    </div>
  )}

  {workLogAiError && (
    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
      {workLogAiError}
    </div>
  )}

  {workLogAiNote && (
    <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/40 dark:text-yellow-200">
      {workLogAiNote}
    </div>
  )}

  {workLogAiSource && (
    <p className="mt-2 text-xs text-muted-foreground">
      AI source: <span className="capitalize">{workLogAiSource}</span>
    </p>
  )}
</div>

<div>
  <Label htmlFor="evidence-file">Upload Evidence File</Label>
  <Input
    id="evidence-file"
    type="file"
    onChange={handleEvidenceUpload}
    disabled={workSubmitting || evidenceUploading}
    className="mt-2 rounded-xl"
  />

  <p className="mt-2 text-xs text-muted-foreground">
    Upload screenshots, documents, PDFs, images, or project evidence. Max file
    size: 10MB.
  </p>

  {evidenceUploading && (
    <div className="mt-3 rounded-xl border bg-muted/30 p-3">
      <p className="text-sm font-medium text-foreground">
        Uploading evidence file...
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 rounded-full bg-primary loading-progress" />
      </div>
    </div>
  )}

  {evidenceUploadError && (
    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
      {evidenceUploadError}
    </div>
  )}

  {evidenceUploadSuccess && (
    <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200">
      {evidenceUploadSuccess}
    </div>
  )}

  <div className="mt-4">
    <Label htmlFor="evidence-link">Evidence Link</Label>
    <Input
      id="evidence-link"
      type="url"
      value={workForm.evidence_link}
      onChange={(e) =>
        setWorkForm({
          ...workForm,
          evidence_link: e.target.value,
        })
      }
      disabled={workSubmitting || evidenceUploading}
      placeholder="https://..."
      className="mt-2 rounded-xl"
    />

    <p className="mt-2 text-xs text-muted-foreground">
      You can upload a file above or paste an external evidence link manually.
    </p>
  </div>
</div>

                  {workError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                      {workError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={workSubmitting}
                    className="rounded-xl"
                  >
                    {workSubmitting ? 'Submitting...' : 'Submit Work Log'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle>Submit Peer Rating</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Rate another member of your group based on contribution.
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmitPeerRating} className="space-y-4">
                  <div>
                    <Label htmlFor="rated-student">Student</Label>
                    <select
                      id="rated-student"
                      value={ratingForm.rated_student_id}
                      onChange={(e) =>
                        setRatingForm({
                          ...ratingForm,
                          rated_student_id: e.target.value,
                        })
                      }
                      disabled={ratingSubmitting}
                      required
                      className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                    >
                      <option value="">Select student</option>
                      {myGroupMembers.map((member) => (
                        <option key={member.id} value={member.student_id}>
                          {member.student?.name ?? member.student_id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="rating">Rating</Label>
                    <select
                      id="rating"
                      value={ratingForm.rating}
                      onChange={(e) =>
                        setRatingForm({
                          ...ratingForm,
                          rating: e.target.value,
                        })
                      }
                      disabled={ratingSubmitting}
                      className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                    >
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Average</option>
                      <option value="2">2 - Poor</option>
                      <option value="1">1 - Very Poor</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="feedback">Feedback</Label>
                    <textarea
                      id="feedback"
                      value={ratingForm.feedback}
                      onChange={(e) =>
                        setRatingForm({
                          ...ratingForm,
                          feedback: e.target.value,
                        })
                      }
                      disabled={ratingSubmitting}
                      className="mt-2 flex min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="Optional feedback..."
                    />
                  </div>

                  {ratingError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                      {ratingError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={ratingSubmitting}
                    className="rounded-xl"
                  >
                    {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle>Create Dispute</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Raise a dispute if you believe your evaluation is unfair.
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmitDispute} className="space-y-4">
                  <div>
                    <Label htmlFor="rating-id">Rating to Dispute</Label>
                    <select
                      id="rating-id"
                      value={disputeForm.rating_id}
                      onChange={(e) =>
                        setDisputeForm({
                          ...disputeForm,
                          rating_id: e.target.value,
                        })
                      }
                      disabled={disputeSubmitting}
                      className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                    >
                      <option value="">General project dispute</option>
                      {receivedRatings.map((rating) => (
                        <option key={rating.id} value={rating.id}>
                          Rating {rating.rating}/5 from{' '}
                          {rating.rater?.name ?? 'another student'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <textarea
                      id="reason"
                      value={disputeForm.reason}
                      onChange={(e) =>
                        setDisputeForm({
                          ...disputeForm,
                          reason: e.target.value,
                        })
                      }
                      disabled={disputeSubmitting}
                      required
                      className="mt-2 flex min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="Explain why you are submitting this dispute..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="evidence">Evidence</Label>
                    <textarea
                      id="evidence"
                      value={disputeForm.evidence}
                      onChange={(e) =>
                        setDisputeForm({
                          ...disputeForm,
                          evidence: e.target.value,
                        })
                      }
                      disabled={disputeSubmitting}
                      className="mt-2 flex min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="Optional evidence or explanation..."
                    />
                  </div>

                  {disputeError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                      {disputeError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={disputeSubmitting}
                    className="rounded-xl"
                  >
                    {disputeSubmitting ? 'Submitting...' : 'Create Dispute'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle>My Disputes</CardTitle>
              </CardHeader>

              <CardContent>
                {disputes && disputes.length > 0 ? (
                  <div className="space-y-4">
                    {disputes.map((dispute) => (
                      <div key={dispute.id} className="rounded-2xl border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span
                            className={`badge-soft capitalize ${getDisputeBadge(
                              dispute.status
                            )}`}
                          >
                            {dispute.status}
                          </span>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {dispute.reason}
                        </p>

                        {dispute.evidence && (
                          <div className="mt-3 rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
                            {dispute.evidence}
                          </div>
                        )}

                        {dispute.admin_comment && (
                          <div className="mt-3 rounded-xl border bg-background/70 p-3 text-sm">
                            <p className="font-semibold text-foreground">
                              Admin Comment
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              {dispute.admin_comment}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No disputes submitted yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}