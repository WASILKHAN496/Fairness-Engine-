import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function getUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from('users')
    .select('id, role, name, email')
    .eq('id', userId)
    .single()

  if (error) return null

  return data
}

async function getProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string
) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) return null

  return data
}

async function isStudentInProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
  projectId: string
) {
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('id')
    .eq('project_id', projectId)

  if (groupsError || !groups || groups.length === 0) {
    return false
  }

  const groupIds = groups.map((group) => group.id)

  const { data: membership, error: membershipError } = await supabase
    .from('group_members')
    .select('id')
    .eq('student_id', studentId)
    .in('group_id', groupIds)
    .maybeSingle()

  if (membershipError) return false

  return Boolean(membership)
}

async function getTeacherProjectIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teacherId: string
) {
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('teacher_id', teacherId)

  if (error) return []

  return (data ?? []).map((project) => project.id)
}

async function attachDetailsToDisputes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  disputes: any[]
) {
  return Promise.all(
    disputes.map(async (dispute) => {
      const { data: student } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', dispute.student_id)
        .single()

      let rating = null

      if (dispute.rating_id) {
        const { data } = await supabase
          .from('peer_ratings')
          .select('*')
          .eq('id', dispute.rating_id)
          .single()

        rating = data ?? null
      }

      return {
        ...dispute,
        student,
        rating,
      }
    })
  )
}

export async function GET(request: NextRequest) {
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

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const projectId = searchParams.get('projectId')

    let query = supabase
      .from('disputes')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (projectId) {
      const project = await getProject(supabase, projectId)

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      if (profile.role === 'teacher' && project.teacher_id !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      if (profile.role === 'student') {
        const allowed = await isStudentInProject(supabase, user.id, projectId)

        if (!allowed) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      }

      query = query.eq('project_id', projectId)
    } else if (profile.role === 'student') {
      query = query.eq('student_id', user.id)
    } else if (profile.role === 'teacher') {
      const teacherProjectIds = await getTeacherProjectIds(supabase, user.id)

      if (teacherProjectIds.length === 0) {
        return NextResponse.json([])
      }

      query = query.in('project_id', teacherProjectIds)
    } else if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data, error } = await query

    if (error) throw error

    const disputesWithDetails = await attachDetailsToDisputes(
      supabase,
      data ?? []
    )

    return NextResponse.json(disputesWithDetails)
  } catch (error) {
    console.error('Error fetching disputes:', error)

    return NextResponse.json(
      { error: 'Failed to fetch disputes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    if (!profile || profile.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can create disputes' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const projectId = String(body.project_id ?? '').trim()
    const ratingId = body.rating_id ? String(body.rating_id).trim() : null
    const reason = String(body.reason ?? '').trim()
    const evidence = String(body.evidence ?? '').trim() || null

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      )
    }

    const project = await getProject(supabase, projectId)

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const allowed = await isStudentInProject(supabase, user.id, projectId)

    if (!allowed) {
      return NextResponse.json(
        { error: 'You are not assigned to this project' },
        { status: 403 }
      )
    }

    if (ratingId) {
      const { data: rating, error: ratingError } = await supabase
        .from('peer_ratings')
        .select('*')
        .eq('id', ratingId)
        .single()

      if (ratingError || !rating) {
        return NextResponse.json(
          { error: 'Rating not found' },
          { status: 404 }
        )
      }

      if (rating.project_id !== projectId) {
        return NextResponse.json(
          { error: 'Rating does not belong to this project' },
          { status: 400 }
        )
      }

      if (rating.rated_student_id !== user.id) {
        return NextResponse.json(
          { error: 'You can only dispute ratings given to you' },
          { status: 403 }
        )
      }
    }

    const { data: existingDispute, error: existingError } = await supabase
      .from('disputes')
      .select('id')
      .eq('student_id', user.id)
      .eq('project_id', projectId)
      .eq('rating_id', ratingId)
      .maybeSingle()

    if (existingError) throw existingError

    if (existingDispute) {
      return NextResponse.json(
        { error: 'A dispute already exists for this rating/project' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('disputes')
      .insert({
        student_id: user.id,
        project_id: projectId,
        rating_id: ratingId,
        reason,
        evidence,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    const [disputeWithDetails] = await attachDetailsToDisputes(
      supabase,
      [data]
    )

    return NextResponse.json(disputeWithDetails, { status: 201 })
  } catch (error) {
    console.error('Error creating dispute:', error)

    return NextResponse.json(
      { error: 'Failed to create dispute' },
      { status: 500 }
    )
  }
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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update disputes' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const id = String(body.id ?? '').trim()
    const status = String(body.status ?? '').trim()
    const adminComment = String(body.admin_comment ?? '').trim() || null

    const allowedStatuses = ['pending', 'resolved', 'rejected']

    if (!id) {
      return NextResponse.json(
        { error: 'Dispute ID is required' },
        { status: 400 }
      )
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid dispute status' },
        { status: 400 }
      )
    }

    const { data: dispute, error: disputeError } = await supabase
      .from('disputes')
      .select('*')
      .eq('id', id)
      .single()

    if (disputeError || !dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('disputes')
      .update({
        status,
        admin_comment: adminComment,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const [disputeWithDetails] = await attachDetailsToDisputes(
      supabase,
      [data]
    )

    return NextResponse.json(disputeWithDetails)
  } catch (error) {
    console.error('Error updating dispute:', error)

    return NextResponse.json(
      { error: 'Failed to update dispute' },
      { status: 500 }
    )
  }
}