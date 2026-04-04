import { createClient } from '@sanity/client'
import { Resend } from 'resend'
import { verifyToken } from '@/lib/careAuth'

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
  // Format: [CatWord][DDMM] — e.g. "Derp2304" for a sit starting Apr 23
  const [, m, d] = startDate.split('-')
  const ddmm = `${d}${m}`
  const word = WORDS[Math.floor(Math.random() * WORDS.length)]
  return `${word}${ddmm}`
}

const resend = new Resend(process.env.RESEND_API_KEY)

async function getAuth(request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/auth_token=([^;]+)/)
  const token = match ? decodeURIComponent(match[1]) : null
  if (!token) return null
  return verifyToken(token)
}

export async function POST(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { sitterId, startDate, endDate, cats, message } = await request.json()

    if (!sitterId || !startDate || !endDate) {
      return Response.json({ error: 'sitterId, startDate and endDate are required' }, { status: 400 })
    }
    if (sitterId === payload.sitterId) {
      return Response.json({ error: 'Cannot book yourself' }, { status: 400 })
    }

    // Ensure unique bookingRef
    let bookingRef
    let attempts = 0
    do {
      bookingRef = generateBookingRef(startDate)
      const existing = await serverClient.fetch(
        `*[_type == "bookingRequest" && bookingRef == $ref][0]._id`,
        { ref: bookingRef }
      )
      if (!existing) break
    } while (++attempts < 5)

    const doc = await serverClient.create({
      _type: 'bookingRequest',
      sitter: { _type: 'reference', _ref: sitterId },
      parent: { _type: 'reference', _ref: payload.sitterId },
      startDate,
      endDate,
      cats: cats || [],
      message: message || null,
      bookingRef,
      status: 'pending',
      createdAt: new Date().toISOString(),
    })

    // Send sit-request notification email to sitter + write notifiedAt for response-time tracking
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
          // tags allow the Resend webhook to match email.opened events back to this booking
          tags: [{ name: 'booking_id', value: doc._id }],
          text: `Hi ${(sitter.name || '').split(' ')[0] || 'there'},\n\nYou have a new sit request for ${startFmt}–${endFmt}.\n\nBooking ID: #${bookingRef}\n\nLog in to your profile to accept or decline: https://purrfectlove.org/care/profile\n\n– The Purrfect Love Community`,
          html: `<p>Hi ${(sitter.name || '').split(' ')[0] || 'there'},</p><p>You have a new sit request for <strong>${startFmt}–${endFmt}</strong>.</p><p>Booking ID: <strong>#${bookingRef}</strong></p><p><a href="https://purrfectlove.org/care/profile">Log in to accept or decline →</a></p><p>– The Purrfect Love Community</p>`,
        })
        if (!resendError) {
          // notifiedAt anchors the response-time clock; only write it when the email actually sent
          await serverClient.patch(doc._id).set({ notifiedAt: new Date().toISOString() }).commit()
        }
      }
    } catch (notifError) {
      // Non-fatal — booking is already created; scoring data simply won't be available for this request
      console.error('bookings/request notification error:', notifError)
    }

    return Response.json({ bookingRef, bookingId: doc._id })
  } catch (error) {
    console.error('bookings/request error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
