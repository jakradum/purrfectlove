'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './Care.module.css';

const STATUS_MAP = {
  pending:     'Awaiting',
  confirmed:   'Confirmed',
  accepted:    'Confirmed',
  declined:    'Declined',
  expired:     'Expired',
  cancelled:   'Cancelled',
  completed:   'Completed',
  unavailable: 'Unavailable',
};

// Maps status → CSS modifier class for the status chip
const STATUS_CHIP_CLS = {
  pending:     'dtChipPending',
  confirmed:   'dtChipConfirmed',
  accepted:    'dtChipConfirmed',
  declined:    'dtChipMuted',
  expired:     'dtChipMuted',
  cancelled:   'dtChipCancelled',
  completed:   'dtChipCompleted',
  unavailable: 'dtChipMuted',
};

const CANCELLABLE = ['pending', 'confirmed', 'accepted'];
const TERMINAL_STATUSES = ['cancelled', 'declined'];

function formatDateShort(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function nightCount(start, end) {
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  return (new Date(ey, em - 1, ed) - new Date(sy, sm - 1, sd)) / 86400000;
}

function daysUntilSit(startDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [sy, sm, sd] = startDate.split('-').map(Number);
  return Math.floor((new Date(sy, sm - 1, sd) - today) / 86400000);
}

function firstName(fullName) {
  if (!fullName) return 'Member';
  return fullName.split(' ')[0];
}

function StatCell({ label, value, link }) {
  return (
    <div className={styles.dtCell}>
      <div className={styles.dtCellLabel}>{label}</div>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className={styles.dtCellValLink}>
          {value}
        </a>
      ) : (
        <div className={styles.dtCellVal}>{value}</div>
      )}
    </div>
  );
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function ContactRow({ label, value, link, muted }) {
  return (
    <div className={styles.dtRow}>
      <span className={styles.dtLbl}>{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className={styles.dtValLink}>
          {value}
        </a>
      ) : (
        <span className={`${styles.dtVal} ${muted ? styles.dtValMuted : ''}`}>{value}</span>
      )}
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────

export default function BookingDetailModal({ bookingId, role, onClose, onCancelled }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cancel flow: 'idle' | 'confirming' | 'submitting'
  const [cancelState, setCancelState] = useState('idle');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  // Accept / decline flow: 'idle' | 'confirming' | 'submitting'
  const [respondState, setRespondState] = useState('idle');

  // Withdraw flow (parent on pending): 'idle' | 'confirming' | 'submitting'
  const [withdrawState, setWithdrawState] = useState('idle');

  // Mobile sheet drag-to-close
  const sheetRef = useRef(null);
  const dragStartY = useRef(null);
  const [dragOffset, setDragOffset] = useState(0);

  const fetchDetail = useCallback(() => {
    if (!bookingId) return;
    fetch(`/api/care/bookings/${bookingId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setDetail(data);
      })
      .catch(() => setError('Failed to load booking details.'));
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;
    setLoading(true);
    setError('');
    fetch(`/api/care/bookings/${bookingId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setDetail(data);
      })
      .catch(() => setError('Failed to load booking details.'))
      .finally(() => setLoading(false));
  }, [bookingId]);

  // Re-fetch while pending so status updates (e.g. sitter declines) are reflected
  useEffect(() => {
    if (!detail || detail.status !== 'pending') return;
    const interval = setInterval(fetchDetail, 8000);
    return () => clearInterval(interval);
  }, [detail?.status, fetchDetail]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const onTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    setDragOffset(0);
  };
  const onTouchMove = (e) => {
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) setDragOffset(delta);
  };
  const onTouchEnd = () => {
    if (dragOffset > 80) onClose();
    else setDragOffset(0);
  };

  const handleCancel = async () => {
    setCancelError('');
    if (cancelReason.trim().length < 20) {
      setCancelError('Please provide a reason of at least 20 characters.');
      return;
    }
    setCancelState('submitting');
    try {
      const res = await fetch('/api/care/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error || 'Failed to cancel booking.');
        setCancelState('confirming');
        return;
      }
      onCancelled?.();
      onClose();
    } catch {
      setCancelError('Network error. Please try again.');
      setCancelState('confirming');
    }
  };

  const handleAccept = async () => {
    setRespondState('submitting');
    try {
      const res = await fetch('/api/care/bookings/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to accept booking.');
        setRespondState('idle');
        return;
      }
      onCancelled?.(); // refresh parent list
      onClose();
    } catch {
      setError('Network error. Please try again.');
      setRespondState('idle');
    }
  };

  const handleDecline = async () => {
    if (respondState !== 'confirming') { setRespondState('confirming'); return; }
    setRespondState('submitting');
    try {
      const res = await fetch('/api/care/bookings/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to decline booking.');
        setRespondState('idle');
        return;
      }
      onCancelled?.(); // refresh parent list
      onClose();
    } catch {
      setError('Network error. Please try again.');
      setRespondState('idle');
    }
  };

  const handleWithdraw = async () => {
    setWithdrawState('submitting');
    try {
      const res = await fetch('/api/care/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, reason: 'Request withdrawn by sender.' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to withdraw request.');
        setWithdrawState('idle');
        return;
      }
      onCancelled?.();
      onClose();
    } catch {
      setError('Network error. Please try again.');
      setWithdrawState('idle');
    }
  };

  const modalContent = () => {
    if (loading) {
      return <div className={styles.dtLoadingBody}><span className={styles.spinner} /></div>;
    }
    if (error) {
      return <div className={styles.dtLoadingBody} style={{ color: '#C85C3F' }}>{error}</div>;
    }
    if (!detail) return null;

    const nights = nightCount(detail.startDate, detail.endDate);
    const days = daysUntilSit(detail.startDate);
    const contactLive = days <= 2;
    const cats = (detail.cats || []).join(', ') || '—';
    const isTerminal = TERMINAL_STATUSES.includes(detail.status);
    const title = role === 'parent'
      ? `${firstName(detail.sitterName)} is sitting your cats`
      : `You are sitting ${firstName(detail.parentName)}'s cats`;
    const statusLabel = STATUS_MAP[detail.status] || detail.status;
    const statusChipCls = STATUS_CHIP_CLS[detail.status] || 'dtChipMuted';
    const dateRange = `${formatDateShort(detail.startDate)} – ${formatDateShort(detail.endDate)}`;
    const mapsUrl = !isTerminal && detail.other.lat && detail.other.lng
      ? `https://maps.google.com/?q=${detail.other.lat},${detail.other.lng}`
      : null;
    const waUrl = detail.other.phone
      ? `https://wa.me/${detail.other.phone.replace(/\D/g, '')}`
      : null;
    const emailUrl = detail.other.email ? `mailto:${detail.other.email}` : null;
    // Pending bookings use role-specific actions (Withdraw for parent, Accept/Decline for sitter)
    const canCancel = CANCELLABLE.includes(detail.status) && detail.status !== 'pending';

    return (
      <>
        {/* ── Header ── */}
        <div className={styles.dtHeader}>
          <div className={styles.dtTop}>
            <div>
              {detail.bookingRef && (
                <div className={styles.dtRef}>#{detail.bookingRef}</div>
              )}
              <div className={styles.dtTitle}>{title}</div>
            </div>
            <button className={styles.dtCloseBtn} onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 12 12" fill="none" width="11" height="11">
                <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className={styles.dtChips}>
            <span className={`${styles.dtChip} ${styles.dtChipDate}`}>{dateRange}</span>
            <span className={`${styles.dtChip} ${styles[statusChipCls]}`}>{statusLabel}</span>
          </div>
        </div>

        {/* ── Body ── */}
        <div className={`${styles.dtBody}${isTerminal ? ` ${styles.dtBodyCancelled}` : ''}`}>

          {/* 2×2 stat grid */}
          <div className={styles.dtGrid}>
            <StatCell label="Duration" value={`${nights} night${nights !== 1 ? 's' : ''}`} />
            <StatCell label="Cats" value={cats} />
            <StatCell label="Area" value={detail.other.neighbourhood || '—'} />
            {!isTerminal && (
              <StatCell
                label="Map"
                value="View map →"
                link={mapsUrl || undefined}
              />
            )}
          </div>

          {/* Contact — hidden for cancelled/declined bookings */}
          {!isTerminal && (
            <>
              <div className={styles.dtSectionLabel}>Contact</div>
              {contactLive ? (
                // Sit is within 2 days — show real contact icons if available, hide section silently if not
                (waUrl || emailUrl) ? (
                  <div className={styles.dtContactIconRow}>
                    {waUrl && (
                      <a href={waUrl} target="_blank" rel="noopener noreferrer" className={styles.dtContactIconBtn} aria-label="WhatsApp">
                        <WhatsAppIcon />
                      </a>
                    )}
                    {emailUrl && (
                      <a href={emailUrl} className={styles.dtContactIconBtn} aria-label="Email">
                        <EmailIcon />
                      </a>
                    )}
                  </div>
                ) : null
              ) : (
                // Sit is more than 2 days away — show dimmed placeholder icons (no title tooltip)
                <>
                  {(detail.other.phone || detail.other.email) && (
                    <div className={styles.dtContactIconRow}>
                      {detail.other.phone && (
                        <span className={styles.dtContactIconBtn} style={{ cursor: 'default', opacity: 0.4 }}>
                          <WhatsAppIcon />
                        </span>
                      )}
                      {detail.other.email && (
                        <span className={styles.dtContactIconBtn} style={{ cursor: 'default', opacity: 0.4 }}>
                          <EmailIcon />
                        </span>
                      )}
                    </div>
                  )}
                  <p className={styles.dtContactNote}>Contact details will be shared 2 days before the sit.</p>
                </>
              )}
            </>
          )}

          {/* Accept / Decline — sitter only, pending bookings */}
          {role === 'sitter' && detail.status === 'pending' && respondState !== 'confirming' && (
            <div className={styles.dtActionRow}>
              <button
                type="button"
                className={styles.dtAcceptBtn}
                onClick={handleAccept}
                disabled={respondState === 'submitting'}
              >
                {respondState === 'submitting' ? 'Accepting…' : 'Accept'}
              </button>
              <button
                type="button"
                className={styles.dtDeclineBtn}
                onClick={handleDecline}
                disabled={respondState === 'submitting'}
              >
                Decline
              </button>
            </div>
          )}
          {role === 'sitter' && detail.status === 'pending' && respondState === 'confirming' && (
            <div className={styles.dtCancelConfirm}>
              <p className={styles.dtCancelQuestion}>Decline this request?</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', margin: '0 0 0.75rem' }}>The cat parent will be notified and can request another sitter.</p>
              <div className={styles.dtCancelBtnRow}>
                <button
                  type="button"
                  className={styles.dtCancelKeepBtn}
                  onClick={() => setRespondState('idle')}
                >
                  Keep pending
                </button>
                <button
                  type="button"
                  className={styles.dtDeclineBtn}
                  style={{ flex: 1 }}
                  onClick={handleDecline}
                >
                  Yes, decline
                </button>
              </div>
            </div>
          )}

          {/* Withdraw — parent only, pending bookings */}
          {role === 'parent' && detail.status === 'pending' && withdrawState === 'idle' && (
            <button type="button" className={styles.dtWithdrawBtn} onClick={() => setWithdrawState('confirming')}>
              Withdraw request
            </button>
          )}
          {role === 'parent' && detail.status === 'pending' && withdrawState === 'confirming' && (
            <div className={styles.dtCancelConfirm}>
              <p className={styles.dtCancelQuestion}>Withdraw this request?</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', margin: '0 0 0.75rem' }}>The sitter will be notified and the request will be cancelled.</p>
              <div className={styles.dtCancelBtnRow}>
                <button
                  type="button"
                  className={styles.dtCancelKeepBtn}
                  onClick={() => setWithdrawState('idle')}
                >
                  Keep request
                </button>
                <button
                  type="button"
                  className={styles.dtCancelConfirmBtn}
                  onClick={handleWithdraw}
                  disabled={withdrawState === 'submitting'}
                >
                  {withdrawState === 'submitting' ? 'Withdrawing…' : 'Yes, withdraw'}
                </button>
              </div>
            </div>
          )}

          {/* Cancel */}
          {canCancel && cancelState === 'idle' && (
            <button type="button" className={styles.dtCancelLink} onClick={() => setCancelState('confirming')}>
              Cancel booking
            </button>
          )}

          {canCancel && cancelState !== 'idle' && (
            <div className={styles.dtCancelConfirm}>
              <p className={styles.dtCancelQuestion}>Are you sure you want to cancel?</p>
              <textarea
                className={styles.dtCancelTextarea}
                placeholder="Why are you cancelling? This helps the other party plan ahead. (minimum 20 characters)"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                disabled={cancelState === 'submitting'}
              />
              <p className={styles.dtCancelCounter} style={{ color: cancelReason.trim().length >= 20 ? '#2C5F4F' : '#aaa' }}>
                {cancelReason.trim().length}/20 — {cancelReason.trim().length >= 20 ? 'Good to go' : `${20 - cancelReason.trim().length} more needed to continue`}
              </p>
              {cancelError && <p className={styles.dtCancelError}>{cancelError}</p>}
              <div className={styles.dtCancelBtnRow}>
                <button
                  type="button"
                  className={styles.dtCancelKeepBtn}
                  onClick={() => { setCancelState('idle'); setCancelReason(''); setCancelError(''); }}
                  disabled={cancelState === 'submitting'}
                >
                  Keep booking
                </button>
                <button
                  type="button"
                  className={styles.dtCancelConfirmBtn}
                  onClick={handleCancel}
                  disabled={cancelState === 'submitting' || cancelReason.trim().length < 20}
                >
                  {cancelState === 'submitting' ? 'Cancelling…' : 'Cancel booking'}
                </button>
              </div>
            </div>
          )}

          {/* Cancelled / declined stamp */}
          {isTerminal && (
            <div className={styles.dtCancelledStamp}>{statusLabel}</div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className={styles.dtOverlay} onClick={handleOverlayClick}>
      <div
        className={styles.dtModal}
        onClick={e => e.stopPropagation()}
        ref={sheetRef}
        style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)`, transition: 'none' } : undefined}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={styles.dtHandle} />
        {modalContent()}
      </div>
    </div>
  );
}
