'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from './Care.module.css'
import contentEN from '@/data/careMessaging.en.json'
import contentDE from '@/data/careMessaging.de.json'
import ContactShareModal from './ContactShareModal'
import { ThreadListSkeleton } from './Skeletons'

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
  const [enterToSend, setEnterToSend] = useState(() => {
    try { return localStorage.getItem('inbox_enterToSend') === 'true' } catch { return false }
  })

  // Modals
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareNotes, setShareNotes] = useState({}) // { partnerId: 'message' }
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [blockReason, setBlockReason] = useState('Other')
  const [blockLoading, setBlockLoading] = useState(false)
  const [blockMsg, setBlockMsg] = useState('')

  // New compose target (when URL has ?to= but no thread exists yet)
  const [composeTarget, setComposeTarget] = useState(null) // { _id, name }

  const messagesAreaRef = useRef(null)
  const prevPartnerRef = useRef(null)
  const prevMsgCountRef = useRef(0)

  // Derived state — must be declared before the scroll useEffect below
  const activeThread = threads.find(t => t.partnerId === activePartnerId)
  const activePartnerName = activeThread?.isBroadcastThread
    ? 'Purrfect Love'
    : (activeThread?.partnerName || composeTarget?.name || '')

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
      // Fetch this specific member's name for the compose header
      fetch(`/api/care/sitters?id=${encodeURIComponent(preselectedTo)}`)
        .then(r => r.json())
        .then(member => {
          if (member && member._id) {
            const displayName = member.name || 'Member'
            setComposeTarget({ _id: member._id, name: displayName })
            setActivePartnerId(preselectedTo)
            setShowMobileThread(true)
          }
        })
        .catch(() => {})
    }
  }, [preselectedTo, loading, threads])

  // Scroll to bottom only when: (1) switching to a new thread, (2) new message sent by current user
  useEffect(() => {
    if (!activePartnerId) return
    const msgs = activeThread?.messages || []
    const msgCount = msgs.length
    const partnerChanged = prevPartnerRef.current !== activePartnerId
    const lastMsg = msgs[msgCount - 1]
    const newMessageFromMe = !partnerChanged && msgCount > prevMsgCountRef.current && lastMsg?.from?._id === currentUserId

    if (partnerChanged || newMessageFromMe) {
      const el = messagesAreaRef.current
      if (el) el.scrollTop = el.scrollHeight
    }

    prevPartnerRef.current = activePartnerId
    prevMsgCountRef.current = msgCount
  }, [activePartnerId, activeThread?.messages?.length, currentUserId])

  // Mark messages as read when opening a thread
  useEffect(() => {
    if (!activeThread) return
    const unread = activeThread.messages.filter(
      m => m.to?._id === currentUserId && !m.read
    )
    for (const msg of unread) {
      fetch(`/api/care/messages/${msg._id}/read`, { method: 'PATCH' }).catch(() => {})
    }
  }, [activePartnerId, activeThread, currentUserId])

  const words = countWords(draftText)
  const chars = draftText.length
  const overLimit = words > 200 || chars > 3200

  function handleEnterToSendToggle(checked) {
    setEnterToSend(checked)
    try { localStorage.setItem('inbox_enterToSend', String(checked)) } catch { /* ignore */ }
  }

  function handleTextareaKeyDown(e) {
    if (e.key !== 'Enter') return
    if (enterToSend) {
      if (e.shiftKey) return // Shift+Enter = new line
      e.preventDefault()
      if (!draftText.trim() || overLimit || sending) return
      handleSend(e)
    }
    // enterToSend off: Enter always adds new line (default textarea behaviour)
  }

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

          {loading && <ThreadListSkeleton />}

          {!loading && threads.length === 0 && (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💬</div>
              <p style={{ fontWeight: 600, color: 'var(--text-dark)', marginBottom: '0.4rem', fontSize: '0.95rem' }}>
                {t.noMessages || 'No messages yet'}
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', lineHeight: 1.6 }}>
                Start a conversation by visiting a member&apos;s profile and clicking Contact.
              </p>
              <a href="/" style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--hunter-green)', fontWeight: 600 }}>
                Browse members →
              </a>
            </div>
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
              <div className={styles.threadName}>
                {thread.isBroadcastThread ? 'Purrfect Love' : (
                  <Link href={`/care/${thread.partnerId}`} onClick={e => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {thread.partnerName}
                  </Link>
                )}
                {thread.isAdminThread && <span className={styles.adminTag}>Admin</span>}
              </div>
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
                {activeThread && !activeThread.isBroadcastThread ? (
                  <Link href={`/care/${activeThread.partnerId}`} style={{ color: 'inherit', textDecoration: 'none' }} className={styles.threadHeaderName}>
                    {activePartnerName}
                  </Link>
                ) : (
                  <span className={styles.threadHeaderName}>{activePartnerName}</span>
                )}
                {!activeThread?.isAdminThread && (
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
                )}
              </div>

              {/* Messages area */}
              <div className={styles.messagesArea} ref={messagesAreaRef}>
                {activeThread?.messages.filter(msg => msg.from && msg.to).map(msg => {
                  const isOutgoing = msg.from._id === currentUserId
                  const isBroadcast = !!msg.broadcast
                  return (
                    <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOutgoing ? 'flex-end' : 'flex-start' }}>
                      {isBroadcast && !isOutgoing && (
                        <div className={styles.broadcastTag}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <path d="M22 8.5c0-2.5-2-4.5-4.5-4.5S13 6 13 8.5v7c0 2.5 2 4.5 4.5 4.5S22 18 22 15.5v-7z"/>
                            <path d="M13 12H3"/>
                            <path d="M5 8v8"/>
                          </svg>
                          Announcement
                        </div>
                      )}
                      <div className={`${styles.msgBubble} ${isOutgoing ? styles.msgBubbleOut : styles.msgBubbleIn}`}>
                        {msg.body}
                      </div>
                      <div className={styles.msgMeta} style={{ alignSelf: isOutgoing ? 'flex-end' : 'flex-start' }}>
                        {formatTime(msg.createdAt)}
                        {isOutgoing && msg.read && ' · Read'}
                      </div>
                      {!isOutgoing && !isBroadcast && (
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
              </div>

              {/* Compose area */}
              <div className={styles.composeArea}>
                <form onSubmit={handleSend}>
                  <textarea
                    className={styles.composeTextarea}
                    rows={3}
                    value={draftText}
                    onChange={e => { setDraftText(e.target.value); setSendError('') }}
                    onKeyDown={handleTextareaKeyDown}
                    placeholder={t.messagePlaceholder}
                  />
                  <div className={styles.composeEnterPref}>
                    <label className={styles.composeEnterLabel}>
                      <input
                        type="checkbox"
                        checked={enterToSend}
                        onChange={e => handleEnterToSendToggle(e.target.checked)}
                        style={{ marginRight: '0.35rem', cursor: 'pointer' }}
                      />
                      Press Enter to send
                    </label>
                    <span className={styles.composeEnterHint}>
                      {enterToSend ? 'Shift+Enter for new line' : 'Enter adds a new line'}
                    </span>
                  </div>
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
