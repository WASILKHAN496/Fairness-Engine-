import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, role, status')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.status === 'inactive') {
      return NextResponse.json(
        { error: 'Inactive account cannot update profile' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const name = String(body.name ?? '').trim()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
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
    console.error('Error updating profile:', error)

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}