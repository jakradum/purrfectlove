import { useEffect, useState } from 'react'
import { useClient } from 'sanity'

export function CommunityMetrics() {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          totalMembers,
          verifiedMembers,
          sitters,
          seekers,
          messagesLast7,
          messagesLast30,
          pendingVerification,
          memberReports,
          deletionRequests,
        ] = await Promise.all([
          client.fetch(`count(*[_type == "catSitter"])`),
          client.fetch(`count(*[_type == "catSitter" && memberVerified == true])`),
          client.fetch(`count(*[_type == "catSitter" && memberVerified == true && canSit == true])`),
          client.fetch(`count(*[_type == "catSitter" && memberVerified == true && needsSitting == true])`),
          client.fetch(`count(*[_type == "message" && dateTime(createdAt) > dateTime(now()) - 60*60*24*7])`),
          client.fetch(`count(*[_type == "message" && dateTime(createdAt) > dateTime(now()) - 60*60*24*30])`),
          client.fetch(`count(*[_type == "catSitter" && (memberVerified == false || !defined(memberVerified))])`),
          client.fetch(`count(*[_type == "memberReport" && resolved != true])`),
          client.fetch(`count(*[_type == "catSitter" && deletionRequested == true])`),
        ])
        setStats({
          totalMembers, verifiedMembers, sitters, seekers,
          messagesLast7, messagesLast30,
          pendingVerification, memberReports, deletionRequests,
        })
      } catch (err) {
        console.error('CommunityMetrics fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [client])

  if (loading) return <div style={s.card}><p style={s.label}>Loading metrics…</p></div>
  if (!stats) return null

  return (
    <div style={s.card}>
      <h2 style={s.heading}>📊 Community Metrics</h2>
      <div style={s.grid}>
        <Stat label="Total members" value={stats.totalMembers} />
        <Stat label="Verified" value={stats.verifiedMembers} />
        <Stat label="Active sitters" value={stats.sitters} />
        <Stat label="Seeking sitters" value={stats.seekers} />
        <Stat label="Messages (7d)" value={stats.messagesLast7} />
        <Stat label="Messages (30d)" value={stats.messagesLast30} />
        <Stat label="Pending verification" value={stats.pendingVerification} alert={stats.pendingVerification > 0} />
        <Stat label="Open reports" value={stats.memberReports} alert={stats.memberReports > 0} />
        <Stat label="Deletion requests" value={stats.deletionRequests} alert={stats.deletionRequests > 0} />
      </div>
    </div>
  )
}

function Stat({ label, value, alert }) {
  return (
    <div style={{ ...s.stat, ...(alert ? s.statAlert : {}) }}>
      <span style={s.statValue}>{value ?? '–'}</span>
      <span style={s.label}>{label}</span>
    </div>
  )
}

const s = {
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
    margin: '1rem 0',
  },
  heading: {
    fontSize: '1rem',
    fontWeight: 700,
    margin: '0 0 1rem',
    color: '#1a1a1a',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '0.75rem',
  },
  stat: {
    background: '#f8f8f8',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  statAlert: {
    background: '#fff4f0',
    border: '1px solid #fca5a5',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#2C5F4F',
    lineHeight: 1.1,
  },
  label: {
    fontSize: '0.75rem',
    color: '#666',
    fontWeight: 500,
  },
}
