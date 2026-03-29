'use client'

import { useState, useEffect } from 'react'
import styles from './Care.module.css'
import contentEN from '@/data/careMessaging.en.json'
import contentDE from '@/data/careMessaging.de.json'

const TABS = ['overview', 'spam', 'scores', 'blocks']

export default function AdminDashboard({ locale = 'en' }) {
  const t = locale === 'de' ? contentDE.admin : contentEN.admin

  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Score adjust form
  const [adjustMemberId, setAdjustMemberId] = useState('')
  const [adjustChange, setAdjustChange] = useState(0)
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustLoading, setAdjustLoading] = useState(false)
  const [adjustMsg, setAdjustMsg] = useState('')

  // Spam / blocks data
  const [spamMessages, setSpamMessages] = useState([])
  const [blockHistory, setBlockHistory] = useState([])

  useEffect(() => {
    loadStats()
    loadSpam()
    loadBlocks()
  }, [])

  async function loadStats() {
    try {
      const res = await fetch('/api/care/admin/stats')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setStats(data)
    } catch {
      setError('Failed to load stats.')
    } finally {
      setLoading(false)
    }
  }

  async function loadSpam() {
    try {
      const res = await fetch('/api/care/admin/spam')
      if (!res.ok) return
      const data = await res.json()
      setSpamMessages(data.messages || [])
    } catch {
      // spam endpoint may not exist yet — silently fail
    }
  }

  async function loadBlocks() {
    try {
      const res = await fetch('/api/care/admin/blocks')
      if (!res.ok) return
      const data = await res.json()
      setBlockHistory(data.blocks || [])
    } catch {
      // blocks endpoint may not exist yet — silently fail
    }
  }

  async function handleAdjustScore(e) {
    e.preventDefault()
    if (!adjustMemberId || !adjustReason || adjustChange === 0) {
      setAdjustMsg('Fill in all fields.')
      return
    }
    setAdjustLoading(true)
    setAdjustMsg('')
    try {
      const res = await fetch('/api/care/admin/score', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: adjustMemberId, change: Number(adjustChange), reason: adjustReason }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAdjustMsg(data.error || 'Failed.')
      } else {
        setAdjustMsg('Score updated.')
        setAdjustMemberId('')
        setAdjustChange(0)
        setAdjustReason('')
        loadStats()
      }
    } catch {
      setAdjustMsg('Failed. Please try again.')
    } finally {
      setAdjustLoading(false)
    }
  }

  const filteredMembers = (stats?.allMembers || []).filter(m =>
    !search || (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--text-light)' }}>Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{error}</p>
      </div>
    )
  }

  return (
    <div className={styles.pageWide}>
      <h1 className={styles.pageTitle}>{t.title}</h1>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          {t.todayStats}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'spam' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('spam')}
        >
          {t.spamReports}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'scores' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('scores')}
        >
          {t.scoreAdjust}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'blocks' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('blocks')}
        >
          {t.blockHistory}
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* Stats cards */}
          <div className={styles.adminGrid}>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{stats?.today?.messages ?? 0}</div>
              <div className={styles.statLabel}>Messages Today</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{stats?.today?.blocks ?? 0}</div>
              <div className={styles.statLabel}>Blocks Today</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{stats?.spamReports ?? 0}</div>
              <div className={styles.statLabel}>{t.spamReports}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{stats?.activeMembers ?? 0}</div>
              <div className={styles.statLabel}>Active {t.members}</div>
            </div>
          </div>

          {/* Low-score members */}
          {stats?.lowScoreMembers?.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Low Score Members (&lt;50)</h2>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.lowScoreMembers.map(m => (
                    <tr key={m._id}>
                      <td>{m.name || '—'}</td>
                      <td>{m.email || '—'}</td>
                      <td style={{ color: '#ef4444', fontWeight: 700 }}>{m.memberScore ?? '—'}</td>
                      <td>
                        <button
                          className={styles.dangerBtn}
                          onClick={() => {
                            setAdjustMemberId(m._id)
                            setActiveTab('scores')
                          }}
                        >
                          {t.adjustScore}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Member search table */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t.members}</h2>
            <div className={styles.formGroup}>
              <input
                type="text"
                className={styles.profileInput}
                placeholder={t.search}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(m => (
                  <tr key={m._id}>
                    <td>{m.name || '—'}</td>
                    <td style={{ fontSize: '0.8rem' }}>{m.email || '—'}</td>
                    <td>{m.memberScore ?? 100}</td>
                    <td>
                      {m.canSit && <span className={`${styles.tag} ${styles.tagGreen}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>Sitter</span>}
                      {m.needsSitting && <span className={`${styles.tag} ${styles.tagBrown}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>Needs sitting</span>}
                    </td>
                  </tr>
                ))}
                {filteredMembers.length === 0 && (
                  <tr><td colSpan={4} style={{ color: 'var(--text-light)', textAlign: 'center', padding: '1.5rem' }}>No members found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Spam Tab */}
      {activeTab === 'spam' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.spamReports}</h2>
          {spamMessages.length === 0 ? (
            <p style={{ color: 'var(--text-light)' }}>No spam reports.</p>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Preview</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {spamMessages.map(msg => (
                  <tr key={msg._id}>
                    <td>{msg.from?.name || '—'}</td>
                    <td>{msg.to?.name || '—'}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(msg.body || '').slice(0, 60)}
                    </td>
                    <td>
                      <button className={styles.dangerBtn} onClick={() => {
                        setAdjustMemberId(msg.from?._id || '')
                        setAdjustChange(-5)
                        setAdjustReason('Spam reported')
                        setActiveTab('scores')
                      }}>
                        {t.deductPoints}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Score Adjustments Tab */}
      {activeTab === 'scores' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.scoreAdjust}</h2>
          <form onSubmit={handleAdjustScore} style={{ maxWidth: 420 }}>
            <div className={styles.formGroup}>
              <label className={styles.profileLabel}>Member ID</label>
              <input
                type="text"
                className={styles.profileInput}
                value={adjustMemberId}
                onChange={e => setAdjustMemberId(e.target.value)}
                placeholder="Sanity document ID"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.profileLabel}>Score Change (+ or -)</label>
              <input
                type="number"
                className={styles.profileInput}
                value={adjustChange}
                onChange={e => setAdjustChange(e.target.value)}
                placeholder="e.g. -10 or +5"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.profileLabel}>Reason</label>
              <input
                type="text"
                className={styles.profileInput}
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
                placeholder="Brief reason"
              />
            </div>
            {adjustMsg && (
              <p style={{ fontSize: '0.85rem', color: adjustMsg.includes('updated') ? 'var(--hunter-green)' : '#ef4444', marginBottom: '0.75rem' }}>
                {adjustMsg}
              </p>
            )}
            <button
              type="submit"
              className={styles.btn}
              style={{ width: 'auto', padding: '0.65rem 1.75rem' }}
              disabled={adjustLoading}
            >
              {adjustLoading ? 'Saving…' : t.adjustScore}
            </button>
          </form>
        </div>
      )}

      {/* Block History Tab */}
      {activeTab === 'blocks' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.blockHistory}</h2>
          {blockHistory.length === 0 ? (
            <p style={{ color: 'var(--text-light)' }}>No blocks recorded.</p>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Blocker</th>
                  <th>Blocked</th>
                  <th>Reason</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {blockHistory.map(b => (
                  <tr key={b._id}>
                    <td>{b.blocker?.name || '—'}</td>
                    <td>{b.blocked?.name || '—'}</td>
                    <td>{b.reason || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}
                    </td>
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
