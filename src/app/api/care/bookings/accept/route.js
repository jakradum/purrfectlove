import { createClient } from '@sanity/client'
import { Resend } from 'resend'
import { getSupabaseUser, createSupabaseDbClient } from '@/lib/supabaseServer'
import { captureServerEvent } from '@/lib/posthogServer'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const resend = new Resend(process.env.RESEND_API_KEY)

function expandDateRange(startYMD, endYMD) {
  const dates = []
  const cur = new Date(startYMD + 'T00:00:00Z')
  const end = new Date(endYMD + 'T00:00:00Z')
  while (cur <= end) {
    const y = cur.getUTCFullYear()
    const m = String(cur.getUTCMonth() + 1).padStart(2, '0')
    const d = String(cur.getUTCDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return dates
}

function formatDate(ymd, locale = 'en') {
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ctaButton({ label, url }) {
  return `<p style="margin:24px 0 0;text-align:center;">
    <a href="${url}" style="display:inline-block;background:#2C5F4F;color:#F6F4F0;text-decoration:none;font-family:'Trebuchet MS',sans-serif;font-size:15px;font-weight:700;padding:12px 28px;border-radius:8px;">${label} →</a>
  </p>`
}

function brandedEmail({ heading, body, isDE = false }) {
  const signoff = isDE ? '– Die Purrfect Love Community' : '– The Purrfect Love Community'
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;background-color:#FFF8F0;color:#2D2D2D;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#2C5F4F;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;font-family:'Trebuchet MS',sans-serif;font-size:24px;color:#F6F4F0;font-weight:700;">Purrfect Love</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;">
            <h2 style="margin:0 0 20px;font-size:18px;color:#2C5F4F;font-family:'Trebuchet MS',sans-serif;">${heading}</h2>
            ${body}
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:24px 0 0;">${signoff}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#F5F0E8;padding:20px 32px;text-align:center;border-top:1px solid #E8E4DC;">
            <p style="margin:0;font-size:13px;color:#6B6B6B;font-weight:600;">Purrfect Love · Cat Adoption &amp; Rescue</p>
            <p style="margin:4px 0 0;font-size:12px;color:#999;">
              <a href="https://purrfectlove.org" style="color:#C85C3F;text-decoration:none;">purrfectlove.org</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { bookingId } = await request.json()
    if (!bookingId) return Response.json({ error: 'bookingId is required' }, { status: 400 })

    const db = createSupabaseDbClient()

    // Fetch booking from Supabase
    const { data: booking, error: fetchError } = await db
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .is('deleted_at', null)
      .single()

    if (fetchError || !booking) return Response.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.sitter_id !== user.sitterId) {
      return Response.json({ error: 'Only the sitter can accept this booking' }, { status: 403 })
    }
    if (booking.status === 'confirmed' || booking.status === 'accepted') {
      return Response.json({ error: 'Already confirmed' }, { status: 409 })
    }

    // Race-condition pre-check: parent may have already confirmed with another sitter
    const { data: parentAlreadyConfirmed } = await db
      .from('bookings')
      .select('id')
      .eq('parent_id', booking.parent_id)
      .in('status', ['confirmed', 'accepted'])
      .neq('id', bookingId)
      .lte('start_date', booking.end_date)
      .gte('end_date', booking.start_date)
      .is('deleted_at', null)
      .limit(1)

    if (parentAlreadyConfirmed?.length > 0) {
      // Mark this booking unavailable so sitter's UI stops showing it as pending
      const { data: markResult, error: markError } = await db
        .from('bookings').update({ status: 'unavailable' }).eq('id', bookingId).eq('status', 'pending').select('id, status')
      console.log('[accept] pre-check mark unavailable — bookingId:', bookingId, 'result:', markResult, 'error:', markError)
      return Response.json(
        { error: 'This sit has already been confirmed with another sitter.' },
        { status: 409 }
      )
    }

    // Fetch sitter + parent profiles from Sanity
    const [sitterProfile, parentProfile] = await Promise.all([
      serverClient.fetch(
        `*[_type == "catSitter" && _id == $id][0]{ _id, name, email, location, locale }`,
        { id: booking.sitter_id }
      ),
      serverClient.fetch(
        `*[_type == "catSitter" && _id == $id][0]{ _id, name, email, locale }`,
        { id: booking.parent_id }
      ),
    ])

    const ref = booking.booking_ref
    const sitterName = sitterProfile?.name || 'Your sitter'
    const parentName = parentProfile?.name || 'Your cat parent'
    const lat = sitterProfile?.location?.lat
    const lng = sitterProfile?.location?.lng
    const mapsUrl = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : null

    // Per-recipient locale and date formatting
    const isParentDE = parentProfile?.locale === 'de'
    const isSitterDE = sitterProfile?.locale === 'de'
    const startFmtParent = formatDate(booking.start_date, parentProfile?.locale)
    const endFmtParent = formatDate(booking.end_date, parentProfile?.locale)
    const startFmtSitter = formatDate(booking.start_date, sitterProfile?.locale)
    const endFmtSitter = formatDate(booking.end_date, sitterProfile?.locale)

    const sitTypeLabelParent = booking.sit_type === 'home_visit' ? (isParentDE ? 'Hausbesuch' : 'Home visit') : booking.sit_type === 'drop_off' ? (isParentDE ? 'Abgabe' : 'Drop-off') : null
    const sitTypeRowParent = sitTypeLabelParent
      ? `<tr><td style="padding:4px 0;font-size:14px;color:#666;">${isParentDE ? 'Art der Betreuung' : 'Sit type'}</td><td style="padding:4px 0;font-size:14px;color:#2D2D2D;font-weight:600;">${sitTypeLabelParent}</td></tr>`
      : ''
    const sitTypeTextParent = sitTypeLabelParent ? `\n${isParentDE ? 'Art der Betreuung' : 'Sit type'}: ${sitTypeLabelParent}` : ''

    const sitTypeLabelSitter = booking.sit_type === 'home_visit' ? (isSitterDE ? 'Hausbesuch' : 'Home visit') : booking.sit_type === 'drop_off' ? (isSitterDE ? 'Abgabe' : 'Drop-off') : null
    const sitTypeRowSitter = sitTypeLabelSitter
      ? `<tr><td style="padding:4px 0;font-size:14px;color:#666;">${isSitterDE ? 'Art der Betreuung' : 'Sit type'}</td><td style="padding:4px 0;font-size:14px;color:#2D2D2D;font-weight:600;">${sitTypeLabelSitter}</td></tr>`
      : ''
    const sitTypeTextSitter = sitTypeLabelSitter ? `\n${isSitterDE ? 'Art der Betreuung' : 'Sit type'}: ${sitTypeLabelSitter}` : ''

    // 1. Mark booking as confirmed — atomic: only succeeds if still pending
    const respondedAt = new Date().toISOString()
    const acceptPatch = { status: 'confirmed', responded_at: respondedAt }
    if (booking.notification_delivered && booking.notified_at) {
      const hours = parseFloat(
        ((Date.now() - new Date(booking.notified_at).getTime()) / 3_600_000).toFixed(1)
      )
      acceptPatch.response_time_hours = hours
    }
    const { data: confirmed } = await db
      .from('bookings')
      .update(acceptPatch)
      .eq('id', bookingId)
      .eq('status', 'pending')   // idempotency guard — noop if already changed
      .select('id')

    if (!confirmed || confirmed.length === 0) {
      // Another sitter accepted in the ~ms between our pre-check and this update
      // The booking is no longer pending — if it's still pending somehow, mark it unavailable
      await db.from('bookings').update({ status: 'unavailable' }).eq('id', bookingId).eq('status', 'pending')
      return Response.json(
        { error: 'This sit has already been confirmed with another sitter.' },
        { status: 409 }
      )
    }

    // 2a. Mark overlapping pending bookings for this sitter as unavailable
    const { data: sitterOverlap } = await db
      .from('bookings')
      .select('id')
      .neq('id', bookingId)
      .eq('sitter_id', booking.sitter_id)
      .eq('status', 'pending')
      .lte('start_date', booking.end_date)
      .gte('end_date', booking.start_date)
      .is('deleted_at', null)

    if (sitterOverlap?.length > 0) {
      await db.from('bookings')
        .update({ status: 'unavailable' })
        .in('id', sitterOverlap.map(b => b.id))
    }

    // 2b. Cancel other pending requests the parent sent to other sitters for overlapping dates
    const { data: parentOverlap } = await db
      .from('bookings')
      .select('id, booking_ref, start_date, end_date, sitter_id')
      .eq('parent_id', booking.parent_id)
      .eq('status', 'pending')
      .neq('id', bookingId)
      .lte('start_date', booking.end_date)
      .gte('end_date', booking.start_date)
      .is('deleted_at', null)

    if (parentOverlap?.length > 0) {
      await db.from('bookings')
        .update({ status: 'unavailable' })
        .in('id', parentOverlap.map(b => b.id))

      // Fetch each affected sitter's profile and send a "sit filled" email
      const uniqueSitterIds = [...new Set(parentOverlap.map(b => b.sitter_id))]
      const affectedProfiles = await Promise.all(
        uniqueSitterIds.map(id =>
          serverClient.fetch(
            `*[_type == "catSitter" && _id == $id][0]{ name, email, locale }`,
            { id }
          )
        )
      )
      const profileBySitterId = Object.fromEntries(
        uniqueSitterIds.map((id, i) => [id, affectedProfiles[i]])
      )

      await Promise.allSettled(
        parentOverlap.map(async (b) => {
          const sitter = profileBySitterId[b.sitter_id]
          if (!sitter?.email) return
          const isAffectedDE = sitter?.locale === 'de'
          const bStart = formatDate(b.start_date, sitter?.locale)
          const bEnd   = formatDate(b.end_date, sitter?.locale)
          await resend.emails.send({
            from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
            to:   [sitter.email],
            subject: isAffectedDE
              ? `Betreuungsanfrage #${b.booking_ref} — Zeitraum vergeben`
              : `Sit request #${b.booking_ref} — dates filled`,
            html: brandedEmail({
              isDE: isAffectedDE,
              heading: isAffectedDE ? 'Der Zeitraum ist vergeben' : 'The sit has been filled',
              body: isAffectedDE ? `
                <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 12px;">Hallo ${sitter.name?.split(' ')[0] || 'there'},</p>
                <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 12px;">
                  Vielen Dank, dass du bereit warst zu helfen — das bedeutet uns viel.
                  Das Katzenelternteil hat einen Sitter für <strong>${bStart} – ${bEnd}</strong> gefunden, deine Anfrage <strong>#${b.booking_ref}</strong> wurde daher als vergeben markiert.
                </p>
                <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 12px;">
                  Du musst nichts weiter tun. Halte deine Verfügbarkeit aktuell und du wirst beim nächsten Mal als Erstes kontaktiert.
                </p>
                ${ctaButton({ label: 'Buchungen ansehen', url: 'https://care.purrfectlove.org/bookings' })}
              ` : `
                <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 12px;">Hi ${sitter.name?.split(' ')[0] || 'there'},</p>
                <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 12px;">
                  Thanks so much for being willing to help — it means a lot to the community.
                  The cat parent found a sitter for <strong>${bStart} – ${bEnd}</strong>, so your request <strong>#${b.booking_ref}</strong> has been marked as filled.
                </p>
                <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 12px;">
                  No action needed from you. Keep your availability up to date and you'll be the first one families reach out to next time.
                </p>
                ${ctaButton({ label: 'View your bookings', url: 'https://care.purrfectlove.org/bookings' })}
              `,
            }),
            text: isAffectedDE
              ? `Hallo ${sitter.name?.split(' ')[0] || 'there'},\n\nVielen Dank, dass du bereit warst zu helfen. Das Katzenelternteil hat einen Sitter für ${bStart} – ${bEnd} gefunden, deine Anfrage #${b.booking_ref} wurde daher als vergeben markiert.\n\nDu musst nichts weiter tun. Halte deine Verfügbarkeit aktuell und du wirst beim nächsten Mal als Erstes kontaktiert.\n\nhttps://care.purrfectlove.org/bookings\n\n– Die Purrfect Love Community`
              : `Hi ${sitter.name?.split(' ')[0] || 'there'},\n\nThanks for being willing to help. The cat parent found a sitter for ${bStart} – ${bEnd}, so request #${b.booking_ref} has been marked as filled.\n\nNo action needed from you. Keep your availability up to date and you'll hear from more families soon.\n\nhttps://care.purrfectlove.org/bookings\n\n– The Purrfect Love Community`,
          })
        })
      )
    }

    // 3. Create sitRecord in Sanity (post-sit confirmation record)
    await serverClient.create({
      _type: 'sitRecord',
      sitter: { _type: 'reference', _ref: booking.sitter_id },
      parent: { _type: 'reference', _ref: booking.parent_id },
      startDate: booking.start_date,
      endDate: booking.end_date,
      bookingRef: ref,
      createdAt: new Date().toISOString(),
    })

    // 4. Auto-block dates in Supabase (atomic — no read-modify-write race)
    const newBlockedDates = expandDateRange(booking.start_date, booking.end_date)
    await db.rpc('availability_merge_blocked', {
      p_sitter_id: booking.sitter_id,
      p_dates: newBlockedDates,
    })

    // 5. In-app notification to sitter
    const notifBody = `Your cats are being looked after ${startFmt}–${endFmt}. We've marked those dates as unavailable for sitting. You can override this in your profile.`
    await serverClient.create({
      _type: 'notification',
      type: 'booking_blocked',
      recipient: { _type: 'reference', _ref: booking.sitter_id },
      body: notifBody,
      linkPath: '/care/profile',
      read: false,
      createdAt: new Date().toISOString(),
    })

    const parentDeepLink = `https://care.purrfectlove.org/bookings?booking=${bookingId}&role=parent`
    const sitterDeepLink = `https://care.purrfectlove.org/bookings?booking=${bookingId}&role=sitter`

    // 6. Email to parent
    if (parentProfile?.email) {
      await resend.emails.send({
        from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
        to: [parentProfile.email],
        subject: isParentDE ? `Buchung bestätigt! #${ref}` : `Booking confirmed! #${ref}`,
        html: brandedEmail({
          isDE: isParentDE,
          heading: isParentDE ? 'Deine Buchung ist bestätigt!' : 'Your booking is confirmed!',
          body: isParentDE ? `
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 12px;"><strong>${sitterName}</strong> hat deine Buchung angenommen.</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">
              <tr><td style="padding:4px 0;font-size:14px;color:#666;">Zeitraum</td><td style="padding:4px 0;font-size:14px;color:#2D2D2D;font-weight:600;">${startFmtParent} – ${endFmtParent}</td></tr>
              ${sitTypeRowParent}
              <tr><td style="padding:4px 0;font-size:14px;color:#666;">Buchungs-ID</td><td style="padding:4px 0;font-size:14px;color:#2C5F4F;font-weight:700;">#${ref}</td></tr>
            </table>
            <p style="font-size:14px;color:#555;margin:0 0 8px;">Ungefährer Standort von ${sitterName}:</p>
            ${mapsUrl ? `<a href="${mapsUrl}" style="display:inline-block;color:#C85C3F;font-size:14px;font-weight:600;">Auf Google Maps ansehen →</a>` : '<p style="font-size:14px;color:#999;margin:0;">Standort nicht verfügbar.</p>'}
            ${ctaButton({ label: 'Buchung ansehen', url: parentDeepLink })}
          ` : `
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 12px;"><strong>${sitterName}</strong> has accepted your booking.</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">
              <tr><td style="padding:4px 0;font-size:14px;color:#666;">Dates</td><td style="padding:4px 0;font-size:14px;color:#2D2D2D;font-weight:600;">${startFmtParent} – ${endFmtParent}</td></tr>
              ${sitTypeRowParent}
              <tr><td style="padding:4px 0;font-size:14px;color:#666;">Booking ID</td><td style="padding:4px 0;font-size:14px;color:#2C5F4F;font-weight:700;">#${ref}</td></tr>
            </table>
            <p style="font-size:14px;color:#555;margin:0 0 8px;">${sitterName}&apos;s approximate location:</p>
            ${mapsUrl ? `<a href="${mapsUrl}" style="display:inline-block;color:#C85C3F;font-size:14px;font-weight:600;">View on Google Maps →</a>` : '<p style="font-size:14px;color:#999;margin:0;">Location not available.</p>'}
            ${ctaButton({ label: 'View booking', url: parentDeepLink })}
          `,
        }),
        text: isParentDE
          ? `Buchung bestätigt! #${ref}\n\n${sitterName} hat deine Buchung angenommen.\n\nZeitraum: ${startFmtParent} – ${endFmtParent}${sitTypeTextParent}\nBuchungs-ID: #${ref}${mapsUrl ? `\n\nUngefährer Standort von ${sitterName}:\n${mapsUrl}` : ''}\n\nBuchung ansehen: ${parentDeepLink}\n\n– Die Purrfect Love Community`
          : `Your booking is confirmed! #${ref}\n\n${sitterName} has accepted your booking.\n\nDates: ${startFmtParent} – ${endFmtParent}${sitTypeTextParent}\nBooking ID: #${ref}${mapsUrl ? `\n\n${sitterName}'s approximate location:\n${mapsUrl}` : ''}\n\nView booking: ${parentDeepLink}\n\n– The Purrfect Love Community`,
      })
    }

    // 7. Email to sitter
    if (sitterProfile?.email) {
      await resend.emails.send({
        from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
        to: [sitterProfile.email],
        subject: isSitterDE ? `Buchung bestätigt! #${ref}` : `Booking confirmed! #${ref}`,
        html: brandedEmail({
          isDE: isSitterDE,
          heading: isSitterDE ? 'Buchung bestätigt!' : 'Booking confirmed!',
          body: isSitterDE ? `
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 12px;"><strong>${parentName}</strong> hat dich für ${startFmtSitter} – ${endFmtSitter} gebucht.</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">
              <tr><td style="padding:4px 0;font-size:14px;color:#666;">Zeitraum</td><td style="padding:4px 0;font-size:14px;color:#2D2D2D;font-weight:600;">${startFmtSitter} – ${endFmtSitter}</td></tr>
              ${sitTypeRowSitter}
              <tr><td style="padding:4px 0;font-size:14px;color:#666;">Buchungs-ID</td><td style="padding:4px 0;font-size:14px;color:#2C5F4F;font-weight:700;">#${ref}</td></tr>
            </table>
            <p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 8px;">Wir haben außerdem ${startFmtSitter}–${endFmtSitter} in deinem Verfügbarkeitskalender als nicht verfügbar markiert. Du kannst diese Daten auf deiner <a href="https://care.purrfectlove.org/profile" style="color:#C85C3F;text-decoration:none;font-weight:600;">Profilseite</a> anpassen.</p>
            ${ctaButton({ label: 'Buchung ansehen', url: sitterDeepLink })}
          ` : `
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 12px;"><strong>${parentName}</strong> has booked you from ${startFmtSitter} – ${endFmtSitter}.</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">
              <tr><td style="padding:4px 0;font-size:14px;color:#666;">Dates</td><td style="padding:4px 0;font-size:14px;color:#2D2D2D;font-weight:600;">${startFmtSitter} – ${endFmtSitter}</td></tr>
              ${sitTypeRowSitter}
              <tr><td style="padding:4px 0;font-size:14px;color:#666;">Booking ID</td><td style="padding:4px 0;font-size:14px;color:#2C5F4F;font-weight:700;">#${ref}</td></tr>
            </table>
            <p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 8px;">We've also marked ${startFmtSitter}–${endFmtSitter} as unavailable on your availability calendar. If you'd like to override any of those dates, you can do so from your <a href="https://care.purrfectlove.org/profile" style="color:#C85C3F;text-decoration:none;font-weight:600;">profile page</a>.</p>
            ${ctaButton({ label: 'View booking', url: sitterDeepLink })}
          `,
        }),
        text: isSitterDE
          ? `Buchung bestätigt! #${ref}\n\n${parentName} hat dich für ${startFmtSitter} – ${endFmtSitter} gebucht.\n\nZeitraum: ${startFmtSitter} – ${endFmtSitter}${sitTypeTextSitter}\nBuchungs-ID: #${ref}\n\nWir haben außerdem ${startFmtSitter}–${endFmtSitter} in deinem Verfügbarkeitskalender als nicht verfügbar markiert.\n\nBuchung ansehen: ${sitterDeepLink}\n\n– Die Purrfect Love Community`
          : `Booking confirmed! #${ref}\n\n${parentName} has booked you from ${startFmtSitter} – ${endFmtSitter}.\n\nDates: ${startFmtSitter} – ${endFmtSitter}${sitTypeTextSitter}\nBooking ID: #${ref}\n\nWe've also marked ${startFmtSitter}–${endFmtSitter} as unavailable on your availability calendar.\n\nView booking: ${sitterDeepLink}\n\n– The Purrfect Love Community`,
      })
    }

    captureServerEvent(user.sitterId, 'booking_accepted').catch(() => {})

    return Response.json({ success: true, bookingRef: ref })
  } catch (error) {
    console.error('bookings/accept error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
