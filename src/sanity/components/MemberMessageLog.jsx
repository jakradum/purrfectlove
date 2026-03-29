import { useEffect, useState } from 'react'
import { useClient, useDocumentOperation } from 'sanity'

function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

export function MemberMessageLog({ document: doc }) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const memberId = doc.displayed?._id
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!memberId) return
    setLoading(true)
    client.fetch(
      `*[_type == "message" && (from._ref == $id || to._ref == $id)] | order(createdAt asc) {
        _id, body, createdAt, read, markedAsSpam,
        from -> { _id, name, email },
        to -> { _id, name, email }
      }`,
      { id: memberId }
    ).then(msgs => {
      setMessages(msgs)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [memberId, client])

  if (!memberId) return <p style={s.empty}>Save the document first to view messages.</p>
  if (loading) return <p style={s.empty}>Loading messages…</p>
  if (messages.length === 0) return <p style={s.empty}>No messages for this member yet.</p>

  return (
    <div style={s.wrap}>
      <p style={s.count}>{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
      <div style={s.log}>
        {messages.map((msg) => {
          const isFromMember = msg.from?._id === memberId
          const partner = isFromMember ? msg.to : msg.from
          const direction = isFromMember ? '→' : '←'
          const dirLabel = isFromMember ? 'sent to' : 'received from'

          return (
            <div key={msg._id} style={{ ...s.entry, ...(msg.markedAsSpam ? s.spam : {}) }}>
              <div style={s.meta}>
                <span style={s.datetime}>{formatDateTime(msg.createdAt)}</span>
                <span style={s.direction}>{direction}</span>
                <span style={s.partner}>
                  {dirLabel} <strong>{partner?.name || partner?.email || 'Unknown'}</strong>
                </span>
                {msg.markedAsSpam && <span style={s.spamBadge}>SPAM</span>}
                {msg.read && isFromMember === false && <span style={s.readBadge}>Read</span>}
              </div>
              <p style={s.body}>{msg.body}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const s = {
  wrap: { padding: '24px', fontFamily: 'system-ui, sans-serif', maxWidth: 720 },
  count: { fontSize: 13, color: '#888', marginBottom: 16 },
  log: { display: 'flex', flexDirection: 'column', gap: 12 },
  entry: {
    background: '#fafafa',
    border: '1px solid #e8e4dc',
    borderRadius: 8,
    padding: '12px 16px',
  },
  spam: { background: '#fff5f5', borderColor: '#fecaca' },
  meta: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  datetime: { fontSize: 12, color: '#888', fontVariantNumeric: 'tabular-nums' },
  direction: { fontSize: 13, color: '#aaa' },
  partner: { fontSize: 13, color: '#444' },
  spamBadge: {
    fontSize: 10, fontWeight: 700, color: '#ef4444',
    background: '#fee2e2', borderRadius: 4, padding: '1px 6px', letterSpacing: '0.05em',
  },
  readBadge: {
    fontSize: 10, color: '#888',
    background: '#f0f0f0', borderRadius: 4, padding: '1px 6px',
  },
  body: { fontSize: 14, color: '#1a1a1a', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' },
  empty: { padding: 24, color: '#888', fontSize: 14 },
}
