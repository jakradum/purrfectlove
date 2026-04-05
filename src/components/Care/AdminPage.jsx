'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const TABS = ['overview', 'join-requests', 'members', 'bookings']
const TAB_LABELS = { overview: 'Overview', 'join-requests': 'Join Requests', members: 'Members', bookings: 'Bookings' }

const STATUS_BADGE = {
  pending:   { bg: '#FAEEDA', color: '#854F0B', border: '#EF9F27' },
  confirmed: { bg: '#EAF3DE', color: '#2C5F4F', border: '#2C5F4F' },
  cancelled: { bg: '#FAECE7', color: '#C85C3F', border: '#C85C3F' },
  expired:   { bg: '#F0F0F0', color: '#888',    border: '#ccc' },
  declined:  { bg: '#FAECE7', color: '#C85C3F', border: '#C85C3F' },
  completed: { bg: '#EAF3DE', color: '#2C5F4F', border: '#2C5F4F' },
  accepted:  { bg: '#EAF3DE', color: '#2C5F4F', border: '#2C5F4F' },
}

function Badge({ status }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.expired
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, borderRadius: 5, padding: '2px 7px',
      fontWeight: 500, background: s.bg, color: s.color, border: `0.5px solid ${s.border}`,
    }}>
      {status}
    </span>
  )
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateShort(ymd) {
  if (!ymd) return '—'
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

export default function AdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  const setTab = (tab) => {
    const p = new URLSearchParams(searchParams)
    p.set('tab', tab)
    router.replace(`?${p.toString()}`, { scroll: false })
  }

  // ── Overview ──
  const [overview, setOverview] = useState(null)
  const [overviewLoading, setOverviewLoading] = useState(true)

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true)
    try {
      const res = await fetch('/api/care/admin/overview')
      if (res.ok) setOverview(await res.json())
    } finally {
      setOverviewLoading(false)
    }
  }, [])

  useEffect(() => { loadOverview() }, [loadOverview])

  // ── Join Requests ──
  const [requests, setRequests] = useState([])
  const [reqLoading, setReqLoading] = useState(false)
  const [showRejected, setShowRejected] = useState(false)

  const loadRequests = useCallback(async () => {
    setReqLoading(true)
    try {
      const res = await fetch(`/api/care/admin/join-requests?includeRejected=${showRejected}`)
      if (res.ok) {
        const { requests: rows } = await res.json()
        setRequests(rows || [])
      }
    } finally {
      setReqLoading(false)
    }
  }, [showRejected])

  useEffect(() => {
    if (activeTab === 'join-requests' || activeTab === 'overview') loadRequests()
  }, [activeTab, loadRequests])

  const handleApprove = async (id) => {
    const res = await fetch('/api/care/admin/approve-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: id }),
    })
    if (res.ok) { loadRequests(); loadOverview() }
    else alert((await res.json()).error || 'Failed to approve')
  }

  const handleReject = async (id) => {
    const res = await fetch('/api/care/admin/reject-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: id }),
    })
    if (res.ok) { loadRequests(); loadOverview() }
    else alert((await res.json()).error || 'Failed to reject')
  }

  // ── Members ──
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addIsTeam, setAddIsTeam] = useState(false)
  const [addLoading, setAddLoading] = useState(false)

  const loadMembers = useCallback(async () => {
    setMembersLoading(true)
    try {
      const res = await fetch('/api/care/admin/members')
      if (res.ok) {
        const { members: rows } = await res.json()
        setMembers(rows || [])
      }
    } finally {
      setMembersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'members') loadMembers()
  }, [activeTab, loadMembers])

  const handleAddMember = async (e) => {
    e.preventDefault()
    setAddLoading(true)
    try {
      const res = await fetch('/api/care/admin/add-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addName, email: addEmail, isTeamMember: addIsTeam }),
      })
      if (res.ok) {
        setShowAddForm(false)
        setAddName(''); setAddEmail(''); setAddIsTeam(false)
        loadMembers(); loadOverview()
      } else {
        alert((await res.json()).error || 'Failed to add member')
      }
    } finally {
      setAddLoading(false)
    }
  }

  const handleRemove = async (memberId) => {
    if (!confirm('Remove this member? This will disable their access.')) return
    const res = await fetch('/api/care/admin/remove-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    if (res.ok) { loadMembers(); loadOverview() }
    else alert((await res.json()).error || 'Failed to remove')
  }

  // ── Bookings ──
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true)
    try {
      const res = await fetch('/api/care/admin/bookings-list')
      if (res.ok) {
        const { bookings: rows } = await res.json()
        setBookings(rows || [])
      }
    } finally {
      setBookingsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'bookings') loadBookings()
  }, [activeTab, loadBookings])

  // ── Styles (inline, matching spec) ──
  const s = {
    wrap:       { maxWidth: 860, margin: '0 auto', padding: '24px 20px' },
    title:      { fontSize: 20, fontWeight: 700, color: '#2C2C2A', marginBottom: 4 },
    sub:        { fontSize: 12, color: '#aaa', marginBottom: 20 },
    tabRow:     { display: 'flex', gap: 0, borderBottom: '0.5px solid #eee', marginBottom: 20 },
    tab:        { padding: '8px 18px', fontSize: 13, fontWeight: 500, color: '#aaa', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -1, background: 'none', border: 'none', borderBottom: '2px solid transparent' },
    tabActive:  { color: '#2C5F4F', borderBottomColor: '#2C5F4F' },
    statsRow:   { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 },
    statCard:   { background: '#fff', border: '0.5px solid #eee', borderRadius: 10, padding: '14px 16px' },
    statVal:    { fontSize: 24, fontWeight: 700, color: '#2C2C2A' },
    statLabel:  { fontSize: 11, color: '#aaa', marginTop: 2 },
    card:       { background: '#fff', border: '0.5px solid #eee', borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
    cardHeader: { padding: '10px 16px', borderBottom: '0.5px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle:  { fontSize: 10, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em' },
    btnAdd:     { background: '#2C5F4F', color: '#fff', fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 7, cursor: 'pointer', border: 'none' },
    th:         { fontSize: 10, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 16px', textAlign: 'left', background: '#f9f9f7', borderBottom: '0.5px solid #eee' },
    td:         { padding: '10px 16px', borderBottom: '0.5px solid #eee', fontSize: 12, color: '#2C2C2A', verticalAlign: 'middle' },
    tdMuted:    { color: '#aaa' },
    addForm:    { padding: '14px 16px', background: '#f9f9f7', borderTop: '0.5px solid #eee', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' },
    formField:  { display: 'flex', flexDirection: 'column', gap: 4 },
    formLabel:  { fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' },
    formInput:  { border: '0.5px solid #ddd', borderRadius: 7, padding: '7px 10px', fontSize: 12, background: '#fff' },
    btnApprove: { width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#EAF3DE', color: '#2C5F4F', marginRight: 4 },
    btnReject:  { width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#FAECE7', color: '#C85C3F' },
    btnRemove:  { background: 'none', border: 'none', color: '#C85C3F', fontSize: 11, textDecoration: 'underline', cursor: 'pointer' },
    spinner:    { color: '#aaa', fontSize: 12, padding: '20px 16px' },
  }

  const pendingRequests = (requests || []).filter(r => r.status === 'pending')
  const rejectedRequests = (requests || []).filter(r => r.status === 'rejected')

  return (
    <div style={s.wrap}>
      <div style={s.title}>Admin</div>
      <div style={s.sub}>Purrfect Love Community</div>

      {/* Tab row */}
      <div style={s.tabRow}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setTab(tab)}
            style={{
              ...s.tab,
              ...(activeTab === tab ? s.tabActive : {}),
            }}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <>
          <div style={s.statsRow}>
            {[
              { val: overview?.totalMembers,    label: 'Total members' },
              { val: overview?.pendingRequests, label: 'Pending requests' },
              { val: overview?.activeBookings,  label: 'Active bookings' },
              { val: overview?.sitsCompleted,   label: 'Sits completed' },
            ].map(({ val, label }) => (
              <div key={label} style={s.statCard}>
                <div style={s.statVal}>{overviewLoading ? '—' : (val ?? 0)}</div>
                <div style={s.statLabel}>{label}</div>
              </div>
            ))}
          </div>

          {/* Recent join requests */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardTitle}>Recent Join Requests</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Date', 'Actions'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(overview?.recentRequests || []).length === 0 ? (
                  <tr><td colSpan={4} style={{ ...s.td, ...s.tdMuted }}>No pending requests</td></tr>
                ) : (overview?.recentRequests || []).map(r => (
                  <tr key={r.id}>
                    <td style={s.td}>{r.name}</td>
                    <td style={{ ...s.td, ...s.tdMuted }}>{r.email || '—'}</td>
                    <td style={{ ...s.td, ...s.tdMuted }}>{fmtDate(r.submitted_at)}</td>
                    <td style={s.td}>
                      <button style={s.btnApprove} title="Approve" onClick={() => handleApprove(r.id)}>✓</button>
                      <button style={s.btnReject}  title="Reject"  onClick={() => handleReject(r.id)}>✗</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent members */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardTitle}>Recent Members</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Joined'].map(h => <th key={h} style={s.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {(overview?.recentMembers || []).length === 0 ? (
                  <tr><td colSpan={3} style={{ ...s.td, ...s.tdMuted }}>No members yet</td></tr>
                ) : (overview?.recentMembers || []).map(m => (
                  <tr key={m._id}>
                    <td style={s.td}>{m.name}</td>
                    <td style={{ ...s.td, ...s.tdMuted }}>{m.email || '—'}</td>
                    <td style={{ ...s.td, ...s.tdMuted }}>{fmtDate(m._createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── JOIN REQUESTS ── */}
      {activeTab === 'join-requests' && (
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>Join Requests</span>
            <button
              style={{ ...s.btnAdd, background: 'none', color: '#aaa', border: '0.5px solid #ddd' }}
              onClick={() => setShowRejected(v => !v)}
            >
              {showRejected ? 'Hide rejected' : 'Show rejected'}
            </button>
          </div>
          {reqLoading ? (
            <div style={s.spinner}>Loading…</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Message', 'Date', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {pendingRequests.length === 0 && rejectedRequests.length === 0 ? (
                  <tr><td colSpan={5} style={{ ...s.td, ...s.tdMuted }}>No requests</td></tr>
                ) : (
                  <>
                    {pendingRequests.map(r => (
                      <tr key={r.id}>
                        <td style={s.td}>{r.name}</td>
                        <td style={{ ...s.td, ...s.tdMuted }}>{r.email || '—'}</td>
                        <td style={{ ...s.td, ...s.tdMuted, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.message || '—'}
                        </td>
                        <td style={{ ...s.td, ...s.tdMuted }}>{fmtDate(r.submitted_at)}</td>
                        <td style={s.td}>
                          <button style={s.btnApprove} title="Approve" onClick={() => handleApprove(r.id)}>✓</button>
                          <button style={s.btnReject}  title="Reject"  onClick={() => handleReject(r.id)}>✗</button>
                        </td>
                      </tr>
                    ))}
                    {showRejected && rejectedRequests.map(r => (
                      <tr key={r.id} style={{ opacity: 0.5 }}>
                        <td style={s.td}>{r.name}</td>
                        <td style={{ ...s.td, ...s.tdMuted }}>{r.email || '—'}</td>
                        <td style={{ ...s.td, ...s.tdMuted, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.message || '—'}
                        </td>
                        <td style={{ ...s.td, ...s.tdMuted }}>{fmtDate(r.submitted_at)}</td>
                        <td style={{ ...s.td, ...s.tdMuted }}>rejected</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── MEMBERS ── */}
      {activeTab === 'members' && (
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>Members</span>
            <button style={s.btnAdd} onClick={() => setShowAddForm(v => !v)}>+ Add member</button>
          </div>
          {showAddForm && (
            <form onSubmit={handleAddMember} style={s.addForm}>
              <div style={s.formField}>
                <label style={s.formLabel}>Name</label>
                <input style={s.formInput} placeholder="Full name" value={addName} onChange={e => setAddName(e.target.value)} required />
              </div>
              <div style={s.formField}>
                <label style={s.formLabel}>Email</label>
                <input style={s.formInput} type="email" placeholder="email@example.com" value={addEmail} onChange={e => setAddEmail(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666', paddingBottom: 7 }}>
                <input type="checkbox" id="isTeam" checked={addIsTeam} onChange={e => setAddIsTeam(e.target.checked)} />
                <label htmlFor="isTeam">Team member (admin)</label>
              </div>
              <button type="submit" style={s.btnAdd} disabled={addLoading}>
                {addLoading ? 'Adding…' : 'Add & send invite'}
              </button>
            </form>
          )}
          {membersLoading ? (
            <div style={s.spinner}>Loading…</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Role', 'Last login', ''].map(h => <th key={h} style={s.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={5} style={{ ...s.td, ...s.tdMuted }}>No members</td></tr>
                ) : members.map(m => (
                  <tr key={m._id}>
                    <td style={s.td}>{m.name}</td>
                    <td style={{ ...s.td, ...s.tdMuted }}>{m.email || '—'}</td>
                    <td style={s.td}>
                      <span style={{
                        display: 'inline-block', fontSize: 10, borderRadius: 5, padding: '2px 7px', fontWeight: 500,
                        ...(m.siteAdmin
                          ? { background: '#FAECE7', color: '#993C1D', border: '0.5px solid #C85C3F' }
                          : { background: '#E6F1FB', color: '#4A6FA5', border: '0.5px solid #4A6FA5' }),
                      }}>
                        {m.siteAdmin ? 'Admin' : 'Member'}
                      </span>
                    </td>
                    <td style={{ ...s.td, ...s.tdMuted }}>{m.lastSignIn ? fmtDate(m.lastSignIn) : '—'}</td>
                    <td style={s.td}>
                      <button style={s.btnRemove} onClick={() => handleRemove(m._id)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── BOOKINGS ── */}
      {activeTab === 'bookings' && (
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>Bookings</span>
          </div>
          {bookingsLoading ? (
            <div style={s.spinner}>Loading…</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Ref', 'Parent', 'Sitter', 'Dates', 'Status'].map(h => <th key={h} style={s.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan={5} style={{ ...s.td, ...s.tdMuted }}>No bookings</td></tr>
                ) : bookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ ...s.td, fontFamily: 'monospace', ...s.tdMuted }}>#{b.bookingRef}</td>
                    <td style={s.td}>{b.parentName}</td>
                    <td style={s.td}>{b.sitterName}</td>
                    <td style={{ ...s.td, ...s.tdMuted }}>{fmtDateShort(b.startDate)} – {fmtDateShort(b.endDate)}</td>
                    <td style={s.td}><Badge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
