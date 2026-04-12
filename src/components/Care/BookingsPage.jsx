'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './Care.module.css';
import BookingDetailModal from './BookingDetailModal';
import { BookingRowsSkeleton } from './Skeletons';

const TODAY = new Date().toISOString().slice(0, 10);

function isUpcoming(startDate) {
  return startDate >= TODAY;
}

function nightCount(start, end) {
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  const diff = (new Date(ey, em - 1, ed) - new Date(sy, sm - 1, sd)) / 86400000;
  return diff;
}

function formatDateRange(start, end) {
  const fmt = (d) => {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

const SIT_TYPE_LABELS = {
  home_visit: 'Home visit',
  drop_off:   'Drop-off',
};

function SitTypeBadge({ type }) {
  const label = SIT_TYPE_LABELS[type];
  if (!label) return null;
  return <span className={styles.sitTypeBadge}>{label}</span>;
}

const STATUS_MAP = {
  pending:     { label: 'Awaiting',    cls: 'statusBadgePending' },
  confirmed:   { label: 'Confirmed',   cls: 'statusBadgeConfirmed' },
  accepted:    { label: 'Confirmed',   cls: 'statusBadgeConfirmed' }, // legacy
  declined:    { label: 'Declined',    cls: 'statusBadgeDeclined' },
  expired:     { label: 'Expired',     cls: 'statusBadgeExpired' },
  cancelled:   { label: 'Cancelled',   cls: 'statusBadgeCancelled' },
  completed:   { label: 'Completed',   cls: 'statusBadgeCompleted' },
  unavailable: { label: 'Unavailable', cls: 'statusBadgeUnavailable' },
};

function StatusBadge({ status }) {
  const { label, cls } = STATUS_MAP[status] || { label: status, cls: 'statusBadgePast' };
  return <span className={`${styles.statusBadge} ${styles[cls]}`}>{label}</span>;
}

// ── Desktop table ──────────────────────────────────────────────────────────────

const CANCELLED_STATUSES = ['cancelled', 'declined'];

function isNotifWorthy(booking, role) {
  if (role === 'sitter') return booking.status === 'pending';
  // parent: sitter responded (confirmed or declined) and sit is upcoming
  return ['confirmed', 'accepted', 'declined'].includes(booking.status) && isUpcoming(booking.startDate);
}

function BookingsTable({ items, colHeader, onRowClick, onWithdraw, notifIds }) {
  const active = items.filter(b => !CANCELLED_STATUSES.includes(b.status));
  const cancelled = items.filter(b => CANCELLED_STATUSES.includes(b.status));
  const upcoming = active.filter(b => isUpcoming(b.startDate));
  const past = active.filter(b => !isUpcoming(b.startDate));

  return (
    <table className={styles.bookingsTable}>
      <thead>
        <tr>
          <th>{colHeader}</th>
          <th>Dates</th>
          <th>Cats</th>
          <th className={styles.thRight}>Status</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr>
            <td colSpan={4} className={styles.bookingEmpty}>No bookings here yet.</td>
          </tr>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <tr className={styles.tableGroupHd}>
                  <td colSpan={4}>Upcoming</td>
                </tr>
                {upcoming.map(b => (
                  <TableRow key={b._id} booking={b} colHeader={colHeader} onClick={() => onRowClick(b)} onWithdraw={onWithdraw} isNew={notifIds?.has(b._id)} />
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <tr className={styles.tableGroupHd}>
                  <td colSpan={4}>Past</td>
                </tr>
                {past.map(b => (
                  <TableRow key={b._id} booking={b} colHeader={colHeader} onClick={() => onRowClick(b)} onWithdraw={onWithdraw} isNew={notifIds?.has(b._id)} />
                ))}
              </>
            )}
            {cancelled.length > 0 && (
              <>
                <tr className={styles.tableGroupHd} style={{ opacity: 0.5 }}>
                  <td colSpan={4}>Cancelled / Declined</td>
                </tr>
                {cancelled.map(b => (
                  <TableRow key={b._id} booking={b} colHeader={colHeader} onClick={() => onRowClick(b)} onWithdraw={onWithdraw} isNew={false} />
                ))}
              </>
            )}
          </>
        )}
      </tbody>
    </table>
  );
}

function TableRow({ booking, colHeader, onClick, onWithdraw, isNew }) {
  const name = colHeader === 'Sitter' ? (booking.sitterName || 'Member') : (booking.parentName || 'Member');
  const nights = nightCount(booking.startDate, booking.endDate);
  const cats = (booking.cats || []).join(', ');
  const canWithdraw = colHeader === 'Sitter' && booking.status === 'pending';

  return (
    <tr className={`${styles.tableRow} ${styles.tableRowClickable} ${isNew ? styles.tableRowNew : ''}`} onClick={onClick}>
      <td>
        <div className={styles.tdName}>{name}</div>
        {booking.sitType && <SitTypeBadge type={booking.sitType} />}
        {booking.bookingRef && <div className={styles.tdRef}>#{booking.bookingRef}</div>}
      </td>
      <td>
        <div className={styles.tdDates}>{formatDateRange(booking.startDate, booking.endDate)}</div>
        <div className={styles.tdDuration}>{nights} night{nights !== 1 ? 's' : ''}</div>
      </td>
      <td className={styles.tdCats}>{cats || '—'}</td>
      <td className={styles.tdStatus}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          {canWithdraw && (
            <button
              type="button"
              className={styles.tdWithdrawBtn}
              onClick={(e) => { e.stopPropagation(); onWithdraw(booking); }}
            >
              Withdraw
            </button>
          )}
          <StatusBadge status={booking.status} />
        </div>
      </td>
    </tr>
  );
}

// ── Mobile list ────────────────────────────────────────────────────────────────

function MobileList({ items, colHeader, onItemClick, onWithdraw, notifIds }) {
  const active = items.filter(b => !CANCELLED_STATUSES.includes(b.status));
  const cancelled = items.filter(b => CANCELLED_STATUSES.includes(b.status));
  const upcoming = active.filter(b => isUpcoming(b.startDate));
  const past = active.filter(b => !isUpcoming(b.startDate));

  if (items.length === 0) {
    return <p className={styles.bookingEmpty}>No bookings here yet.</p>;
  }

  return (
    <>
      {upcoming.length > 0 && (
        <>
          <div className={styles.bookingSectionHd}>Upcoming</div>
          {upcoming.map(b => <MobileItem key={b._id} booking={b} colHeader={colHeader} onClick={() => onItemClick(b)} onWithdraw={onWithdraw} isNew={notifIds?.has(b._id)} />)}
        </>
      )}
      {past.length > 0 && (
        <>
          {upcoming.length > 0 && <div className={styles.bookingDivider} />}
          <div className={styles.bookingSectionHd}>Past</div>
          {past.map(b => <MobileItem key={b._id} booking={b} colHeader={colHeader} onClick={() => onItemClick(b)} onWithdraw={onWithdraw} isNew={notifIds?.has(b._id)} />)}
        </>
      )}
      {cancelled.length > 0 && (
        <>
          <div className={styles.bookingDivider} />
          <div className={styles.bookingSectionHd} style={{ opacity: 0.5 }}>Cancelled / Declined</div>
          {cancelled.map(b => <MobileItem key={b._id} booking={b} colHeader={colHeader} onClick={() => onItemClick(b)} onWithdraw={onWithdraw} isNew={false} />)}
        </>
      )}
    </>
  );
}

function MobileItem({ booking, colHeader, onClick, onWithdraw, isNew }) {
  const name = colHeader === 'Sitter' ? (booking.sitterName || 'Member') : (booking.parentName || 'Member');
  const cats = (booking.cats || []).join(', ');
  const canWithdraw = colHeader === 'Sitter' && booking.status === 'pending';

  return (
    <div className={`${styles.bookingItem} ${styles.bookingItemClickable} ${isNew ? styles.bookingItemNew : ''}`} onClick={onClick}>
      <div className={styles.bookingBody}>
        <div className={styles.bookingName}>{name}</div>
        <div className={styles.bookingDetail}>
          {formatDateRange(booking.startDate, booking.endDate)}
          {cats ? ` · ${cats}` : ''}
        </div>
        {booking.sitType && <SitTypeBadge type={booking.sitType} />}
        {booking.bookingRef && <div className={styles.bookingRef}>#{booking.bookingRef}</div>}
      </div>
      <div className={styles.bookingRight} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <StatusBadge status={booking.status} />
        {canWithdraw && (
          <button
            type="button"
            className={styles.bookingWithdrawBtn}
            style={{ marginTop: 0 }}
            onClick={(e) => { e.stopPropagation(); onWithdraw(booking); }}
          >
            Withdraw
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function BookingsPage({ locale }) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState('parent');
  const [asParent, setAsParent] = useState([]);
  const [asSitter, setAsSitter] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seenIds, setSeenIds] = useState(() => {
    if (typeof window === 'undefined') return new Set();
    return new Set(JSON.parse(localStorage.getItem('pl_seen_bkgs') || '[]'));
  });

  // Modal state
  const [selectedBooking, setSelectedBooking] = useState(null); // { id, role }
  const [showHint, setShowHint] = useState(false);

  // Auto-open modal from deep link (?booking=<id>&role=sitter|parent)
  useEffect(() => {
    const bookingId = searchParams.get('booking');
    const role = searchParams.get('role');
    if (bookingId && (role === 'parent' || role === 'sitter')) {
      if (role === 'sitter') setTab('sitter');
      setSelectedBooking({ id: bookingId, role });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowHint(!localStorage.getItem('bookingDetailSeen'));
    }
  }, []);

  const fetchBookings = useCallback(() => {
    return fetch('/api/care/bookings/my')
      .then(r => r.ok ? r.json() : { asParent: [], asSitter: [] })
      .then(data => {
        setAsParent(data.asParent || []);
        setAsSitter(data.asSitter || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBookings().finally(() => setLoading(false));

    // Refresh on tab focus
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchBookings();
    };
    document.addEventListener('visibilitychange', onVisible);

    // Poll every 60 seconds
    const poll = setInterval(fetchBookings, 60_000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(poll);
    };
  }, [fetchBookings]);

  const items = tab === 'parent' ? asParent : asSitter;
  const colHeader = tab === 'parent' ? 'Sitter' : 'Parent';
  const role = tab === 'parent' ? 'parent' : 'sitter';
  const notifIds = new Set(items.filter(b => isNotifWorthy(b, role) && !seenIds.has(b._id)).map(b => b._id));

  const openModal = (booking) => {
    setSelectedBooking({ id: booking._id, role });
    // Mark as seen for notification tracking
    if (!seenIds.has(booking._id)) {
      const newSeen = new Set(seenIds);
      newSeen.add(booking._id);
      setSeenIds(newSeen);
      localStorage.setItem('pl_seen_bkgs', JSON.stringify([...newSeen]));
      window.dispatchEvent(new CustomEvent('pl_seen_updated'));
    }
    if (showHint) {
      setShowHint(false);
      localStorage.setItem('bookingDetailSeen', '1');
    }
  };

  const closeModal = () => setSelectedBooking(null);

  const handleCancelled = () => {
    fetchBookings();
  };

  const handleWithdraw = async (booking) => {
    if (!confirm('Withdraw this request? The sitter will be notified.')) return;
    await fetch('/api/care/bookings/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking._id, reason: 'Request withdrawn by sender.' }),
    });
    fetchBookings();
  };

  const parentHasPending = asParent.some(b => b.status === 'pending');
  const sitterHasPending = asSitter.some(b => b.status === 'pending');

  return (
    <div className={styles.bookingsPage}>
      <div className={styles.bookingsTitle}>Booking History</div>
      <div className={styles.bookingsSub}>Your upcoming and past cat sits</div>

      <div className={styles.bookingsCard}>
        <div className={styles.bookingsTabRow}>
          <button
            className={`${styles.bookingsTab} ${tab === 'parent' ? styles.bookingsTabActive : ''}`}
            onClick={() => setTab('parent')}
          >
            Seeking a sitter
            {parentHasPending && <span className={styles.tabPendingDot} />}
          </button>
          <button
            className={`${styles.bookingsTab} ${tab === 'sitter' ? styles.bookingsTabActive : ''}`}
            onClick={() => setTab('sitter')}
          >
            I&apos;m sitting
            {sitterHasPending && <span className={styles.tabPendingDot} />}
          </button>
        </div>

        {showHint && (
          <p className={styles.bookingsHint}>Tap any booking to view details</p>
        )}

        {loading ? (
          <BookingRowsSkeleton />
        ) : (
          <>
            {/* Desktop table */}
            <div className={styles.bookingsTableWrap}>
              <BookingsTable items={items} colHeader={colHeader} onRowClick={openModal} onWithdraw={handleWithdraw} notifIds={notifIds} />
            </div>
            {/* Mobile list */}
            <div className={styles.bookingsMobileList}>
              <MobileList items={items} colHeader={colHeader} onItemClick={openModal} onWithdraw={handleWithdraw} notifIds={notifIds} />
            </div>
          </>
        )}
      </div>

      {/* Detail modal */}
      {selectedBooking && (
        <BookingDetailModal
          bookingId={selectedBooking.id}
          role={selectedBooking.role}
          onClose={closeModal}
          onCancelled={handleCancelled}
        />
      )}
    </div>
  );
}
