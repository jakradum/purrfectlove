'use client'

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from './Care.module.css'
import contentEN from '@/data/careMessaging.en.json'
import contentDE from '@/data/careMessaging.de.json'
import ContactShareModal from './ContactShareModal'

function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' })
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function InboxPage({ currentUserId, currentUserName, locale = 'en' }) {
  const t = locale === 'de' ? contentDE.inbox : contentEN.inbox
  const searchParams = useSearchParams()
  const preselectedTo = searchParams.get('to')

  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [activePartnerId, setActivePartnerId] = useState(null)
  const [showMobileThread, setShowMobileThread] = useState(false)

  // Compose state
  const [draftText, setDraftText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  // Modals
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareNotes, setShareNotes] = useState({}) // { partnerId: 'message' }
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [blockReason, setBlockReason] = useState('Other')
  const [blockLoading, setBlockLoading] = useState(false)
  const [blockMsg, setBlockMsg] = useState('')

  // New compose target (when URL has ?to= but no thread exists yet)
  const [composeTarget, setComposeTarget] = useState(null) // { _id, name }

  const messagesEndRef = useRef(null)
  const prevPartnerRef = useRef(null)
  const prevMsgCountRef = useRef(0)

  const fetchInbox = useCallback(async () => {
    try {
      const res = await fetch('/api/care/messages/inbox')
      if (!res.ok) return
      const data = await res.json()
      setThreads(data.threads || [])
    } catch {
      // silently fail on poll
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInbox()
    // Poll every 30 seconds
    const interval = setInterval(fetchInbox, 30000)
    return () => clearInterval(interval)
  }, [fetchInbox])

  // Handle ?to= param — pre-open or create compose
  useEffect(() => {
    if (!preselectedTo || loading) return

    const existingThread = threads.find(t => t.partnerId === preselectedTo)
    if (existingThread) {
      setActivePartnerId(preselectedTo)
      setShowMobileThread(true)
    } else {
      // Need to fetch this member's name for compose
      fetch(`/api/care/sitters`)
        .then(r => r.json())
        .then(sitters => {
          const found = Array.isArray(sitters) ? sitters.find(s => s._id === preselectedTo) : null
          if (found) {
            setComposeTarget({ _id: found._id, name: found.name || 'Member' })
            setActivePartnerId(preselectedTo)
            setShowMobileThread(true)
          }
        })
        .catch(() => {})
    }
  }, [preselectedTo, loading, threads])

  // Scroll to bottom only when: (1) switching to a new thread, (2) new message sent by current user
  useLayoutEffect(() => {
    if (!activePartnerId) return
    const msgs = activeThread?.messages || []
    const msgCount = msgs.length
    const partnerChanged = prevPartnerRef.current !== activePartnerId
    const lastMsg = msgs[msgCount - 1]
    const newMessageFromMe = !partnerChanged && msgCount > prevMsgCountRef.current && lastMsg?.from?._id === currentUserId

    if (partnerChanged || newMessageFromMe) {
      messagesEndRef.current?.scrollIntoView({ behavior: partnerChanged ? 'auto' : 'smooth' })
    }

    prevPartnerRef.current = activePartnerId
    prevMsgCountRef.current = msgCount
  }, [activePartnerId, activeThread?.messages?.length, currentUserId])

  const activeThread = threads.find(t => t.partnerId === activePartnerId)
  const activePartnerName = activeThread?.partnerName || composeTarget?.name || ''

  // Mark messages as read when opening a thread
  useEffect(() => {
    if (!activeThread) return
    const unread = activeThread.messages.filter(
      m => m.to._id === currentUserId && !m.read
    )
    for (const msg of unread) {
      fetch(`/api/care/messages/${msg._id}/read`, { method: 'PATCH' }).catch(() => {})
    }
  }, [activePartnerId, activeThread, currentUserId])

  const words = countWords(draftText)
  const chars = draftText.length
  const overLimit = words > 200 || chars > 3200

  async function handleSend(e) {
    e.preventDefault()
    if (!draftText.trim() || overLimit || sending) return

    const recipientId = activePartnerId
    if (!recipientId) return

    setSending(true)
    setSendError('')

    try {
      const res = await fetch('/api/care/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, message: draftText }),
      })

      const data = await res.json()
      if (!res.ok) {
        setSendError(data.error || 'Failed to send.')
        return
      }

      setDraftText('')
      setComposeTarget(null)
      await fetchInbox()
    } catch {
      setSendError('Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  async function handleReportSpam(messageId) {
    try {
      await fetch('/api/care/messages/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      })
      await fetchInbox()
    } catch {
      // silent
    }
  }

  async function handleBlock() {
    if (!activePartnerId) return
    setBlockLoading(true)
    try {
      const res = await fetch(`/api/care/block/${activePartnerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: blockReason }),
      })
      const data = await res.json()
      if (res.ok) {
        setBlockMsg(t.blockUser + ' ' + (locale === 'de' ? contentDE.block.blocked : contentEN.block.blocked))
        setShowBlockConfirm(false)
        setActivePartnerId(null)
        setShowMobileThread(false)
        await fetchInbox()
      } else {
        setBlockMsg(data.error || 'Failed to block.')
      }
    } catch {
      setBlockMsg('Failed to block.')
    } finally {
      setBlockLoading(false)
    }
  }

  const blockT = locale === 'de' ? contentDE.block : contentEN.block

  return (
    <div className={styles.pageWide}>
      <div className={`${styles.inboxLayout} ${showMobileThread ? styles.showThread : ''}`}>
        {/* ── Sidebar ── */}
        <div className={styles.threadSidebar}>
          <div className={styles.threadSidebarHeader}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-dark)' }}>
              {t.title}
            </span>
          </div>

          {loading && (
            <p style={{ padding: '1.5rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
              Loading…
            </p>
          )}

          {!loading && threads.length === 0 && (
            <p className={styles.noMessages}>{t.noMessages}</p>
          )}

          {threads.map(thread => (
            <div
              key={thread.partnerId}
              className={`${styles.threadItem} ${activePartnerId === thread.partnerId ? styles.threadItemActive : ''}`}
              onClick={() => {
                setActivePartnerId(thread.partnerId)
                setShowMobileThread(true)
                setSendError('')
              }}
            >
              <div className={styles.threadName}>{thread.partnerName}</div>
              <div className={styles.threadPreview}>
                {thread.messages[thread.messages.length - 1]?.body?.slice(0, 40) || ''}
              </div>
              <div className={styles.threadMeta}>
                <span className={styles.threadTime}>
                  {formatTime(thread.latestAt)}
                </span>
                {thread.unreadCount > 0 && (
                  <span className={styles.unreadBadge}>{thread.unreadCount}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Thread Pane ── */}
        <div className={styles.threadPane}>
          {!activePartnerId ? (
            <div className={styles.noThreadMsg}>{t.noThread}</div>
          ) : (
            <>
              {/* Thread header */}
              <div className={styles.threadHeader}>
                {/* Mobile back */}
                <button
                  className={styles.btnSecondary}
                  style={{ display: 'none', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  id="backBtn"
                  onClick={() => { setShowMobileThread(false); setActivePartnerId(null) }}
                >
                  ← Back
                </button>
                <span className={styles.threadHeaderName}>{activePartnerName}</span>
                <div className={styles.threadHeaderActions}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => setShowShareModal(true)}
                  >
                    {t.shareContact}
                  </button>
                  <button
                    type="button"
                    className={styles.dangerBtn}
                    onClick={() => setShowBlockConfirm(true)}
                  >
                    {t.blockUser}
                  </button>
                </div>
              </div>

              {/* Messages area */}
              <div className={styles.messagesArea}>
                {activeThread?.messages.map(msg => {
                  const isOutgoing = msg.from._id === currentUserId
                  return (
                    <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOutgoing ? 'flex-end' : 'flex-start' }}>
                      <div className={`${styles.msgBubble} ${isOutgoing ? styles.msgBubbleOut : styles.msgBubbleIn}`}>
                        {msg.body}
                      </div>
                      <div className={styles.msgMeta} style={{ alignSelf: isOutgoing ? 'flex-end' : 'flex-start' }}>
                        {formatTime(msg.createdAt)}
                        {isOutgoing && msg.read && ' · Read'}
                      </div>
                      {!isOutgoing && (
                        <div className={styles.msgActions}>
                          <button
                            className={styles.spamBtn}
                            onClick={() => handleReportSpam(msg._id)}
                            title="Report as spam"
                          >
                            {t.reportSpam}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* If compose target but no thread yet */}
                {!activeThread && composeTarget && (
                  <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', textAlign: 'center', marginTop: '2rem' }}>
                    Start a conversation with {composeTarget.name}.
                  </p>
                )}

                {shareNotes[activePartnerId] && (
                  <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic', padding: '0.25rem 0' }}>
                    {shareNotes[activePartnerId]}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Compose area */}
              <div className={styles.composeArea}>
                <form onSubmit={handleSend}>
                  <textarea
                    className={styles.composeTextarea}
                    rows={3}
                    value={draftText}
                    onChange={e => { setDraftText(e.target.value); setSendError('') }}
                    placeholder={t.messagePlaceholder}
                  />
                  <div className={styles.composeMeta}>
                    <div>
                      <span className={`${styles.composeCounters} ${overLimit ? styles.composeCounterOver : ''}`}>
                        {t.charCount.replace('{chars}', chars)} · {t.wordCount.replace('{words}', words)}
                      </span>
                      {overLimit && (
                        <p className={`${styles.composeCounters} ${styles.composeCounterOver}`} style={{ marginTop: '0.2rem' }}>
                          {t.limitError}
                        </p>
                      )}
                      {sendError && (
                        <p className={`${styles.composeCounters} ${styles.composeCounterOver}`} style={{ marginTop: '0.2rem' }}>
                          {sendError}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      className={styles.btn}
                      style={{ width: 'auto', marginTop: 0, padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
                      disabled={sending || overLimit || !draftText.trim()}
                    >
                      {sending ? t.sending : t.send}
                    </button>
                  </div>
                  <p className={styles.composeDisclaimer}>{t.disclaimer}</p>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {blockMsg && (
        <p style={{ marginTop: '1rem', color: 'var(--hunter-green)', fontSize: '0.875rem' }}>{blockMsg}</p>
      )}

      {/* Share contact modal */}
      {showShareModal && activePartnerId && (
        <ContactShareModal
          partnerName={activePartnerName}
          partnerId={activePartnerId}
          locale={locale}
          onClose={() => setShowShareModal(false)}
          onShared={({ shareEmail, shareWhatsApp }) => {
            const parts = [shareEmail && 'email', shareWhatsApp && 'WhatsApp'].filter(Boolean).join(' and ')
            const note = `You shared your ${parts} with ${activePartnerName}`
            setShareNotes((prev) => ({ ...prev, [activePartnerId]: note }))
            setShowShareModal(false)
          }}
        />
      )}

      {/* Block confirmation modal */}
      {showBlockConfirm && (
        <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setShowBlockConfirm(false)}>
          <div className={styles.modal}>
            <p className={styles.modalTitle}>
              {blockT.confirmTitle.replace('{name}', activePartnerName)}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
              {blockT.confirmText}
            </p>
            <div className={styles.formGroup}>
              <label className={styles.profileLabel}>{blockT.reason}</label>
              <select
                className={styles.profileInput}
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
              >
                <option value="Spam">Spam</option>
                <option value="Harassment">Harassment</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setShowBlockConfirm(false)}
                disabled={blockLoading}
              >
                {blockT.cancel}
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
                style={{ padding: '0.5rem 1.25rem' }}
                onClick={handleBlock}
                disabled={blockLoading}
              >
                {blockLoading ? 'Blocking…' : blockT.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
