import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024

function sanitizeFileName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
}

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

    if (!profile || profile.role !== 'student' || profile.status === 'inactive') {
      return NextResponse.json(
        { error: 'Only active students can upload evidence files' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const projectId = String(formData.get('project_id') ?? '').trim()

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Evidence file is required' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be 10MB or less' },
        { status: 400 }
      )
    }

    const safeName = sanitizeFileName(file.name)
    const filePath = `${user.id}/${projectId}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('evidence-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      )
    }

    const { data: publicUrlData } = supabase.storage
      .from('evidence-files')
      .getPublicUrl(filePath)

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path: filePath,
      fileName: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error('Error uploading evidence file:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to upload evidence file',
      },
      { status: 500 }
    )
  }
}