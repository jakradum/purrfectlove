'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Care.module.css';

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function AttachmentDisplay({ url, name }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(name || '') ||
    (url && /\/(image)\//i.test(url));
  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img src={url} alt={name || 'Attachment'} className={styles.msgAttachImg} />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.msgAttachFile}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      {name || 'Attachment'}
    </a>
  );
}

export default function BookingMessages({ bookingId }) {
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null); // { url, name }
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const isFirstLoad = useRef(true);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/care/bookings/messages?bookingId=${bookingId}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      // silent
    }
  }, [bookingId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (messages.length === 0) return;
    if (isFirstLoad.current) {
      // On first load jump immediately without animation
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
      isFirstLoad.current = false;
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!body.trim() && !pendingAttachment) return;
    setSending(true);
    setSendError('');
    try {
      const res = await fetch('/api/care/bookings/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          body: body.trim() || null,
          attachmentUrl: pendingAttachment?.url || null,
          attachmentName: pendingAttachment?.name || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || 'Failed to send.');
        return;
      }
      setMessages(prev => [...prev, data]);
      setBody('');
      setPendingAttachment(null);
    } catch {
      setSendError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingAttachment(true);
    setSendError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bookingId', bookingId);
      const res = await fetch('/api/care/bookings/messages/attachment', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || 'Upload failed.');
        return;
      }
      setPendingAttachment({ url: data.url, name: data.name });
    } catch {
      setSendError('Upload failed. Please try again.');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className={styles.msgSection}>
      <div className={styles.dtSectionLabel} style={{ marginTop: 12, marginBottom: 6 }}>Messages</div>

      <div className={styles.msgThread}>
        {messages.length === 0 ? (
          <p className={styles.msgEmpty}>No messages yet. Say hello!</p>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`${styles.msgRow} ${m.isMine ? styles.msgRowMine : styles.msgRowTheirs}`}>
              <div className={`${styles.msgBubble} ${m.isMine ? styles.msgBubbleMine : styles.msgBubbleTheirs}`}>
                {m.body && <p className={styles.msgBody}>{m.body}</p>}
                {m.attachmentUrl && (
                  <AttachmentDisplay url={m.attachmentUrl} name={m.attachmentName} />
                )}
                <span className={styles.msgTime}>{formatTime(m.createdAt)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {pendingAttachment && (
        <div className={styles.msgPendingAttach}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6 }}>
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span className={styles.msgPendingAttachName}>{pendingAttachment.name}</span>
          <button type="button" className={styles.msgPendingAttachRemove} onClick={() => setPendingAttachment(null)}>×</button>
        </div>
      )}

      <form className={styles.msgSendForm} onSubmit={handleSend}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*,.pdf"
          onChange={handleFileSelect}
        />
        <button
          type="button"
          className={styles.msgAttachBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || uploadingAttachment}
          aria-label="Attach file"
        >
          {uploadingAttachment ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.msgSpinning}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          )}
        </button>
        <textarea
          className={styles.msgInput}
          placeholder="Type a message…"
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          rows={1}
        />
        <button
          type="submit"
          className={styles.msgSendBtn}
          disabled={sending || uploadingAttachment || (!body.trim() && !pendingAttachment)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
      {sendError && <p className={styles.msgError}>{sendError}</p>}
    </div>
  );
}
