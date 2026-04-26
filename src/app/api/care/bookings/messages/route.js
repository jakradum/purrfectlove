import { getSupabaseUser, createSupabaseDbClient } from '@/lib/supabaseServer'

export async function GET(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = user.sitterId
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')
    if (!bookingId) return Response.json({ error: 'bookingId is required' }, { status: 400 })

    const db = createSupabaseDbClient()

    // Verify access
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

    // Mark messages from the other party as read (fire and forget)
    db.from('booking_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('booking_id', bookingId)
      .neq('sender_id', userId)
      .is('read_at', null)
      .is('deleted_at', null)
      .then(() => {})
      .catch(() => {})

    const { data: rows, error } = await db
      .from('booking_messages')
      .select('id, sender_id, body, attachment_url, attachment_name, created_at')
      .eq('booking_id', bookingId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) throw error

    const messages = (rows || []).map(m => ({
      id:              m.id,
      body:            m.body,
      attachmentUrl:   m.attachment_url,
      attachmentName:  m.attachment_name,
      createdAt:       m.created_at,
      isMine:          m.sender_id === userId,
    }))

    return Response.json({ messages })
  } catch (error) {
    console.error('messages GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = user.sitterId
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { bookingId, body, attachmentUrl, attachmentName } = await request.json()
    if (!bookingId) return Response.json({ error: 'bookingId is required' }, { status: 400 })
    if (!body?.trim() && !attachmentUrl) {
      return Response.json({ error: 'Message body or attachment is required' }, { status: 400 })
    }

    const db = createSupabaseDbClient()

    // Verify access
    const { data: booking } = await db
      .from('bookings')
      .select('sitter_id, parent_id, status')
      .eq('id', bookingId)
      .is('deleted_at', null)
      .single()

    if (!booking) return Response.json({ error: 'Not found' }, { status: 404 })
    if (booking.sitter_id !== userId && booking.parent_id !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: msg, error: insertError } = await db
      .from('booking_messages')
      .insert({
        booking_id:      bookingId,
        sender_id:       userId,
        body:            body?.trim() || null,
        attachment_url:  attachmentUrl || null,
        attachment_name: attachmentName || null,
      })
      .select('id, body, attachment_url, attachment_name, created_at')
      .single()

    if (insertError) throw insertError

    return Response.json({
      id:             msg.id,
      body:           msg.body,
      attachmentUrl:  msg.attachment_url,
      attachmentName: msg.attachment_name,
      createdAt:      msg.created_at,
      isMine:         true,
    })
  } catch (error) {
    console.error('messages POST error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
