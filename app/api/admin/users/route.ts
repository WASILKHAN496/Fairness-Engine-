import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function getUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', userId)
    .single()

  if (error) return null

  return data
}

async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      supabase,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const profile = await getUserProfile(supabase, user.id)

  if (!profile || profile.role !== 'admin') {
    return {
      supabase,
      error: NextResponse.json({ error: 'Only admins can access this route' }, { status: 403 }),
    }
  }

  return { supabase, error: null }
}

export async function GET() {
  try {
    const { supabase, error } = await requireAdmin()

    if (error) {
      return error
    }

    const { data, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role, status')
      .order('name', { ascending: true })

    if (usersError) {
      throw usersError
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('Error fetching admin users:', error)

    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin()

    if (error) {
      return error
    }

    const body = await request.json()

    const id = String(body.id ?? '').trim()
    const role = String(body.role ?? '').trim()
    const status = String(body.status ?? '').trim()

    const allowedRoles = ['admin', 'teacher', 'student']
    const allowedStatuses = ['active', 'inactive']

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const { data, error: updateError } = await supabase
      .from('users')
      .update({
        role,
        status,
      })
      .eq('id', id)
      .select('id, name, email, role, status')
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating admin user:', error)

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}