import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function getUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from('users')
    .select('id, role, status')
    .eq('id', userId)
    .single()

  if (error) return null

  return data
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile(supabase, user.id)

    if (!profile || profile.role !== 'admin' || profile.status === 'inactive') {
      return NextResponse.json(
        { error: 'Only active admins can update admin profile' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const name = String(body.name ?? '').trim()

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (name.length > 80) {
      return NextResponse.json(
        { error: 'Name must be 80 characters or less' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('users')
      .update({ name })
      .eq('id', user.id)
      .select('id, email, name, role, status, avatar_url')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating admin profile:', error)

    return NextResponse.json(
      { error: 'Failed to update admin profile' },
      { status: 500 }
    )
  }
}