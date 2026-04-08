import { getSupabaseUser, createSupabaseAdminClient } from '@/lib/supabaseServer'

export async function POST(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    const contentType = searchParams.get('type') || 'image/png'

    if (!path) {
      return Response.json({ error: 'path is required' }, { status: 400 })
    }

    const buffer = await request.arrayBuffer()

    const supabase = createSupabaseAdminClient()
    const { error } = await supabase.storage
      .from('bug-reports')
      .upload(path, buffer, { contentType, upsert: false })

    if (error) {
      console.error('Storage upload error:', error)
      return Response.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('bug-reports')
      .getPublicUrl(path)

    return Response.json({ url: publicUrl })
  } catch (err) {
    console.error('bugreport/upload error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
