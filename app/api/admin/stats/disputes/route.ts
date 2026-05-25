import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return {
      supabase,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { supabase, error: null }
}

export async function GET() {
  try {
    const { supabase, error: authError } = await requireAdmin()

    if (authError) {
      return authError
    }

    const { count: totalCount, error: totalError } = await supabase
      .from('disputes')
      .select('*', { count: 'exact', head: true })

    if (totalError) throw totalError

    const { count: pendingCount, error: pendingError } = await supabase
      .from('disputes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (pendingError) throw pendingError

    return NextResponse.json({
      total: totalCount ?? 0,
      open: pendingCount ?? 0,
      pending: pendingCount ?? 0,
    })
  } catch (error) {
    console.error('Error fetching dispute stats:', error)

    return NextResponse.json(
      { error: 'Failed to fetch dispute stats' },
      { status: 500 }
    )
  }
}