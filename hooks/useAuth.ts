import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'teacher' | 'student'
  status: 'active' | 'inactive'
  avatar_url?: string | null
}

/**
 * Important:
 * New users from signup should only become student or teacher.
 * Admin role should NOT be created from signup metadata for security.
 * Make admin manually from Supabase/Admin panel.
 */
function getRoleFromMetadata(role: unknown): 'teacher' | 'student' {
  if (role === 'teacher') {
    return 'teacher'
  }

  return 'student'
}

async function fetchOrCreateUserProfile(authUser: {
  id: string
  email?: string
  user_metadata?: {
    name?: string
    full_name?: string
    role?: string
  }
}) {
  const supabase = createClient()

  const { data: existingProfile, error: profileError } = await supabase
    .from('users')
    .select('id, email, name, role, status, avatar_url')
    .eq('id', authUser.id)
    .maybeSingle()

  if (profileError) {
    throw profileError
  }

  if (existingProfile) {
    return existingProfile as User
  }

  const email = authUser.email ?? ''

  const name =
    authUser.user_metadata?.name ||
    authUser.user_metadata?.full_name ||
    email.split('@')[0] ||
    'User'

  const role = getRoleFromMetadata(authUser.user_metadata?.role)

  const { data: newProfile, error: insertError } = await supabase
    .from('users')
    .insert({
      id: authUser.id,
      email,
      name,
      role,
      status: 'active',
    })
    .select('id, email, name, role, status, avatar_url')
    .single()

  if (insertError) {
    throw insertError
  }

  return newProfile as User
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true

    const handleProfile = async (authUser: {
      id: string
      email?: string
      user_metadata?: {
        name?: string
        full_name?: string
        role?: string
      }
    }) => {
      const profile = await fetchOrCreateUserProfile(authUser)

      if (profile.status === 'inactive') {
        await supabase.auth.signOut()
        throw new Error('Your account is inactive. Please contact admin.')
      }

      return profile
    }

    const loadUser = async () => {
      try {
        setLoading(true)
        setError(null)

        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          throw authError
        }

        if (!authUser) {
          if (isMounted) {
            setUser(null)
            setLoading(false)
          }

          return
        }

        const profile = await handleProfile(authUser)

        if (isMounted) {
          setUser(profile)
          setError(null)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setUser(null)
          setError(err instanceof Error ? err.message : 'Failed to load user')
          setLoading(false)
        }
      }
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        if (isMounted) {
          setUser(null)
          setError(null)
          setLoading(false)
        }

        return
      }

      handleProfile(session.user)
        .then((profile) => {
          if (isMounted) {
            setUser(profile)
            setError(null)
            setLoading(false)
          }
        })
        .catch((err) => {
          if (isMounted) {
            setUser(null)
            setError(err instanceof Error ? err.message : 'Failed to load user')
            setLoading(false)
          }
        })
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading, error }
}