import { createClient } from '@sanity/client'
import { Resend } from 'resend'
import { getSupabaseUser, createSupabaseDbClient } from '@/lib/supabaseServer'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const WORDS = [
  'Fur','Claw','Whisker','Mew','Floof','Loaf','Purr','Paw','Boop','Nap',
  'Scruff','Tuft','Biscuit','Zoomie','Blep','Chirp','Mlem','Derp','Flop','Snoot',
  'Sploot','Hiss','Bonk','Flick','Murr','Kneads','Trill','Huff','Yowl','Slink',
  'Stalk','Pounce','Rumble','Nibble','Sniff','Groom','Knead','Stretch','Curl','Perch',
  'Prowl','Nuzzle','Headbutt','Fluff','Burrow','Doze','Lunge','Skitter','Dash','Pallas',
]

function generateBookingRef(startDate) {
  const [, m, d] = startDate.split('-')
  const ddmm = `${d}${m}`
  const word = WORDS[Math.floor(Math.random() * WORDS.length)]
  return `${word}${ddmm}`
}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { sitterId, startDate, endDate, cats, message } = await request.json()

    if (!sitterId || !startDate || !endDate) {
      return Response.json({ error: 'sitterId, startDate and endDate are required' }, { status: 400 })
    }
    if (sitterId === user.sitterId) {
      return Response.json({ error: 'Cannot book yourself' }, { status: 400 })
    }

    const db = createSupabaseDbClient()

    // Ensure unique bookingRef
    let bookingRef
    let attempts = 0
    do {
      bookingRef = generateBookingRef(startDate)
      const { data: existing } = await db
        .from('bookings')
        .select('id')
        .eq('booking_ref', bookingRef)
        .maybeSingle()
      if (!existing) break
    } while (++attempts < 5)

    // Insert booking
    const { data: booking, error: insertError } = await db
      .from('bookings')
      .insert({
        booking_ref: bookingRef,
        sitter_id:   sitterId,
        parent_id:   user.sitterId,
        start_date:  startDate,
        end_date:    endDate,
        cats:        cats || [],
        message:     message || null,
        status:      'pending',
        created_at:  new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    const bookingId = booking.id

    // Send sit-request notification email + write notified_at for response-time tracking
    try {
      const sitter = await serverClient.fetch(
        `*[_type == "catSitter" && _id == $id][0]{ name, email, notifEmailSitRequest }`,
        { id: sitterId }
      )
      if (sitter?.email && sitter?.notifEmailSitRequest !== false) {
        const [sy, sm, sd] = startDate.split('-').map(Number)
        const [ey, em, ed] = endDate.split('-').map(Number)
        const startFmt = new Date(sy, sm - 1, sd).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        const endFmt = new Date(ey, em - 1, ed).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        const { error: resendError } = await resend.emails.send({
          from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
          replyTo: 'support@purrfectlove.org',
          to: [sitter.email],
          subject: `New sit request #${bookingRef}`,
          tags: [{ name: 'booking_id', value: bookingId }],
          text: `Hi ${(sitter.name || '').split(' ')[0] || 'there'},\n\nYou have a new sit request for ${startFmt}–${endFmt}.\n\nBooking ID: #${bookingRef}\n\nLog in to your profile to accept or decline: https://purrfectlove.org/care/profile\n\n– The Purrfect Love Community`,
          html: `<p>Hi ${(sitter.name || '').split(' ')[0] || 'there'},</p><p>You have a new sit request for <strong>${startFmt}–${endFmt}</strong>.</p><p>Booking ID: <strong>#${bookingRef}</strong></p><p><a href="https://purrfectlove.org/care/profile">Log in to accept or decline →</a></p><p>– The Purrfect Love Community</p>`,
        })
        if (!resendError) {
          await db.from('bookings').update({ notified_at: new Date().toISOString() }).eq('id', bookingId)
        }
      }
    } catch (notifError) {
      console.error('bookings/request notification error:', notifError)
    }

    return Response.json({ bookingRef, bookingId })
  } catch (error) {
    console.error('bookings/request error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
