import { createClient } from '@sanity/client'
import { getSupabaseUser, createSupabaseDbClient } from '@/lib/supabaseServer'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = user.sitterId
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file')
    const bookingId = formData.get('bookingId')

    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })
    if (!bookingId) return Response.json({ error: 'bookingId is required' }, { status: 400 })

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: 'Only images and PDF files are accepted' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return Response.json({ error: 'File must be under 5 MB' }, { status: 400 })
    }

    // Verify the user is a party to this booking
    const db = createSupabaseDbClient()
    const { data: booking } = await db
      .from('bookings')
      .select('sitter_id, parent_id')
      .eq('id', bookingId)
      .is('deleted_at', null)
      .single()

    if (!booking) return Response.json({ error: 'Not found' }, { status: 404 })
    if (booking.sitter_id !== userId && booking.parent_id !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const asset = await serverClient.assets.upload('file', buffer, {
      filename: file.name,
      contentType: file.type,
    })

    return Response.json({
      url: asset.url,
      name: asset.originalFilename || file.name,
    })
  } catch (error) {
    console.error('messages/attachment POST error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
