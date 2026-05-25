import useSWR from 'swr'

export interface Project {
  id: string
  title: string
  description: string | null
  teacher_id: string
  deadline: string | null
  status: 'active' | 'completed' | 'archived'
  health_status: 'good' | 'healthy' | 'warning' | 'critical'
  created_at: string
  updated_at: string
}

async function fetcher(url: string) {
  const res = await fetch(url, {
    credentials: 'include',
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to fetch projects')
  }

  return data
}

export function useProjects(
  role?: 'teacher' | 'student' | 'admin',
  enabled = true
) {
  const url = enabled
    ? role
      ? `/api/projects?role=${role}`
      : '/api/projects'
    : null

  const { data, error, isLoading, mutate } = useSWR<Project[]>(url, fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  return {
    projects: data ?? [],
    isLoading: enabled ? isLoading : false,
    error,
    mutate,
  }
}