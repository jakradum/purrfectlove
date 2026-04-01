import { useEffect, useState } from 'react'
import { useClient, useCurrentUser } from 'sanity'

export function BroadcastSender({ documentId, document: doc }) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const currentUser = useCurrentUser()

  const [preview, setPreview] = useState(null)
  const [adminSitterId, setAdminSitterId] = useState(null)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const subject = doc?.displayed?.subject
  const body = doc?.displayed?.body
  const signOff = doc?.displayed?.signOff
  const sentAt = doc?.displayed?.sentAt

  useEffect(() => {
    client.fetch(`count(*[_type == "catSitter" && memberVerified == true && (newsletterOptOut != true)])`)
      .then(n => setPreview(n))
      .catch(() => {})
  }, [client])

  useEffect(() => {
    if (!currentUser?.email) return
    // Find the catSitter doc belonging to the currently logged-in Sanity user
    client.fetch(`*[_type == "catSitter" && email == $email][0]{ _id, name, username }`, { email: currentUser.email })
      .then(d => { if (d?._id) setAdminSitterId(d._id) })
      .catch(() => {})
  }, [client, currentUser?.email])

  const handleSend = async () => {
    if (!subject || !body) {
      setError('Subject and body are required.')
      return
    }
    if (!confirm(`Send broadcast to ~${preview ?? '?'} members? This cannot be undone.`)) return

    setSending(true)
    setError(null)
    setResult(null)

    try {
      // 1. Fetch all eligible recipients directly via Sanity client (already authenticated)
      const members = await client.fetch(
        `*[_type == "catSitter" && memberVerified == true && (newsletterOptOut != true)]{ _id, email, name, username }`
      )

      if (!members.length) {
        setResult('No eligible members found.')
        return
      }

      // 2. Create inbox messages directly using the authenticated Sanity client
      let inboxCount = 0
      const now = new Date().toISOString()
      const fromRef = adminSitterId
      const fullBody = signOff ? `${body}\n\n— ${signOff}` : body

      if (fromRef) {
        const BATCH = 50
        for (let i = 0; i < members.length; i += BATCH) {
          const batch = members.slice(i, i + BATCH)
          await Promise.allSettled(
            batch.map(async (member) => {
              try {
                await client.create({
                  _type: 'message',
                  from: { _type: 'reference', _ref: fromRef },
                  to: { _type: 'reference', _ref: member._id },
                  body: fullBody,
                  read: false,
                  markedAsSpam: false,
                  broadcast: true,
                  createdAt: now,
                })
                inboxCount++
              } catch (err) {
                console.error('Failed to create inbox message for', member._id, err)
              }
            })
          )
        }
      }

      // 3. Call API for email sending (uses shared secret, no care portal login needed)
      const secret = process.env.NEXT_PUBLIC_ADMIN_API_SECRET
      const res = await fetch('/api/care/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { 'X-Admin-Secret': secret } : {}),
        },
        body: JSON.stringify({ broadcastId: documentId, signOff }),
        credentials: 'include',
      })
      const data = await res.json()

      if (!res.ok) {
        // Emails failed but inbox messages may have been created
        setError(`Emails failed (${res.status}): ${data.error || 'Unknown error'}. ${inboxCount} inbox messages were created.`)
      } else {
        // Mark as sent only after full success
        await client.patch(documentId).set({ sentAt: now, status: 'sent' }).commit()
        setResult(`Done — ${data.sentCount} emails sent, ${inboxCount} inbox messages created (${members.length} total members).`)
      }
    } catch (err) {
      setError('Error: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={s.card}>
      <h2 style={s.heading}>📢 Send Broadcast</h2>

      {sentAt ? (
        <div style={s.successBox}>
          <p style={{ margin: 0, fontWeight: 600 }}>✅ Already sent</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#555' }}>
            Sent on {new Date(sentAt).toLocaleString()}
          </p>
        </div>
      ) : (
        <>
          {preview !== null && (
            <p style={s.info}>
              This message will be sent to approximately <strong>{preview}</strong> verified member{preview !== 1 ? 's' : ''} (excluding newsletter opt-outs).
            </p>
          )}
          <p style={s.warn}>
            ⚠️ Make sure you&apos;ve filled in the Subject and Body fields and saved the document before sending.
          </p>
          {error && <p style={s.errorText}>{error}</p>}
          {result && <p style={s.successText}>{result}</p>}
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !subject || !body}
            style={{ ...s.btn, ...(sending ? s.btnDisabled : {}) }}
          >
            {sending ? 'Sending…' : `Send to ~${preview ?? '?'} members`}
          </button>
        </>
      )}
    </div>
  )
}

const s = {
  card: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', margin: '1rem 0' },
  heading: { fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem', color: '#1a1a1a' },
  info: { fontSize: '0.9rem', color: '#444', margin: '0 0 0.75rem', lineHeight: 1.6 },
  warn: { fontSize: '0.8rem', color: '#92400e', background: '#fef3c7', borderRadius: '6px', padding: '0.5rem 0.75rem', margin: '0 0 1rem' },
  successBox: { background: '#f0fdf4', borderRadius: '8px', padding: '0.75rem 1rem', border: '1px solid #86efac' },
  btn: { background: '#2C5F4F', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  errorText: { color: '#b91c1c', fontSize: '0.875rem', margin: '0 0 0.75rem' },
  successText: { color: '#166534', fontSize: '0.875rem', margin: '0 0 0.75rem', fontWeight: 600 },
}
