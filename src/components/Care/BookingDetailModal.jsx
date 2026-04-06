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
  cancelled:   'dtChipMuted',
  completed:   'dtChipCompleted',
  unavailable: 'dtChipMuted',
};

const CANCELLABLE = ['pending', 'confirmed', 'accepted'];

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

  // Accept / decline flow: 'idle' | 'submitting'
  const [respondState, setRespondState] = useState('idle');

  // Mobile sheet drag-to-close
  const sheetRef = useRef(null);
  const dragStartY = useRef(null);
  const [dragOffset, setDragOffset] = useState(0);

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

  const modalContent = () => {
    if (loading) {
      return <div className={styles.dtLoadingBody}>Loading…</div>;
    }
    if (error) {
      return <div className={styles.dtLoadingBody} style={{ color: '#C85C3F' }}>{error}</div>;
    }
    if (!detail) return null;

    const nights = nightCount(detail.startDate, detail.endDate);
    const days = daysUntilSit(detail.startDate);
    const contactLive = days <= 2;
    const cats = (detail.cats || []).join(', ') || '—';
    const title = role === 'parent'
      ? `${firstName(detail.sitterName)} is sitting your cats`
      : `You are sitting ${firstName(detail.parentName)}'s cats`;
    const statusLabel = STATUS_MAP[detail.status] || detail.status;
    const statusChipCls = STATUS_CHIP_CLS[detail.status] || 'dtChipMuted';
    const dateRange = `${formatDateShort(detail.startDate)} – ${formatDateShort(detail.endDate)}`;
    const mapsUrl = detail.other.lat && detail.other.lng
      ? `https://maps.google.com/?q=${detail.other.lat},${detail.other.lng}`
      : null;
    const waUrl = detail.other.phone
      ? `https://wa.me/${detail.other.phone.replace(/\D/g, '')}`
      : null;
    const emailUrl = detail.other.email ? `mailto:${detail.other.email}` : null;
    // Sitters use Accept/Decline for pending; Cancel only applies post-confirmation
    const canCancel = CANCELLABLE.includes(detail.status) && !(role === 'sitter' && detail.status === 'pending');

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
        <div className={styles.dtBody}>

          {/* 2×2 stat grid */}
          <div className={styles.dtGrid}>
            <StatCell label="Duration" value={`${nights} night${nights !== 1 ? 's' : ''}`} />
            <StatCell label="Cats" value={cats} />
            <StatCell label="Area" value={detail.other.neighbourhood || '—'} />
            <StatCell
              label="Map"
              value="View map →"
              link={mapsUrl || undefined}
            />
          </div>

          {/* Contact */}
          <div className={styles.dtSectionLabel}>Contact</div>
          {contactLive ? (
            <>
              {waUrl && <ContactRow label="WhatsApp" value="Message →" link={waUrl} />}
              {emailUrl && <ContactRow label="Email" value={detail.other.email} link={emailUrl} />}
              {!waUrl && !emailUrl && <ContactRow label="Contact" value="No contact info available." muted />}
            </>
          ) : (
            <>
              {detail.other.phone && <ContactRow label="WhatsApp" value={detail.other.phone} muted />}
              {detail.other.email && <ContactRow label="Email" value={detail.other.email} muted />}
              {!detail.other.phone && !detail.other.email && (
                <ContactRow label="Contact" value="No contact info available." muted />
              )}
              <p className={styles.dtContactNote}>Contact details will be shared 2 days before the sit.</p>
            </>
          )}

          {/* Accept / Decline — sitter only, pending bookings */}
          {role === 'sitter' && detail.status === 'pending' && (
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
                placeholder="Reason for cancelling (required, min. 20 characters)…"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                disabled={cancelState === 'submitting'}
              />
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
