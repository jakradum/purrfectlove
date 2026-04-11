'use client';

import styles from './Care.module.css';

/* ---------- shared primitive ---------- */
function Sh({ h = 12, w = '100%', r = 6, mb = 0, style = {} }) {
  return (
    <div
      className={styles.shimmer}
      style={{ height: h, width: w, borderRadius: r, marginBottom: mb, flexShrink: 0, ...style }}
    />
  );
}

/* ---------- Marketplace ---------- */
function SkeletonSitterCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonHeader}>
        <div className={`${styles.skeletonAvatar} ${styles.shimmer}`} />
        <div className={styles.skeletonHeaderText}>
          <Sh h={14} w="60%" />
          <Sh h={11} w="35%" />
        </div>
      </div>
      <Sh h={11} w="90%" />
      <Sh h={11} w="72%" />
      <div className={styles.skeletonActions}>
        <div className={`${styles.skeletonBtn} ${styles.shimmer}`} />
        <div className={`${styles.skeletonBtn} ${styles.shimmer}`} />
      </div>
    </div>
  );
}

export function MarketplaceSkeleton() {
  return (
    <div className={styles.pageWide}>
      <div style={{ padding: '1.5rem 0 0' }}>
        <div className={`${styles.skeletonFilterBar} ${styles.shimmer}`} />
      </div>
      <div className={styles.sitterGrid}>
        {Array.from({ length: 6 }).map((_, i) => <SkeletonSitterCard key={i} />)}
      </div>
    </div>
  );
}

/* ---------- Bookings ---------- */
function SkeletonBookingRow() {
  return (
    <div className={styles.skeletonTableRow}>
      <Sh h={12} w={64} r={4} style={{ flexShrink: 0 }} />
      <Sh h={12} w={100} r={4} style={{ flexShrink: 0 }} />
      <Sh h={12} w="30%" r={4} />
      <Sh h={22} w={72} r={20} style={{ flexShrink: 0, marginLeft: 'auto' }} />
    </div>
  );
}

export function BookingsSkeleton() {
  return (
    <div className={styles.skeletonBookingsWrap}>
      <Sh h={22} w={180} r={6} mb={6} />
      <Sh h={13} w={240} r={4} mb={24} />
      <div style={{ background: '#fff', borderRadius: 12, padding: '0 1.5rem', boxShadow: '0 2px 8px rgba(44,95,79,0.07)' }}>
        <div className={styles.skeletonTabs} style={{ paddingTop: '1rem' }}>
          <div className={`${styles.skeletonTab} ${styles.shimmer}`} />
          <div className={`${styles.skeletonTab} ${styles.shimmer}`} />
        </div>
        {Array.from({ length: 5 }).map((_, i) => <SkeletonBookingRow key={i} />)}
      </div>
    </div>
  );
}

/* ---------- Inbox ---------- */
function SkeletonThread() {
  return (
    <div className={styles.skeletonThreadItem}>
      <div className={styles.shimmer} style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
      <div className={styles.skeletonThreadText}>
        <Sh h={13} w="55%" />
        <Sh h={11} w="80%" />
      </div>
    </div>
  );
}

export function InboxSkeleton() {
  return (
    <div className={styles.pageWide} style={{ padding: 0 }}>
      <div className={styles.skeletonInboxLayout}>
        <div className={styles.skeletonThreadSidebar}>
          <div style={{ padding: '0.75rem 1rem 1rem', borderBottom: '1px solid #f0f0f0' }}>
            <Sh h={14} w={80} />
          </div>
          {Array.from({ length: 7 }).map((_, i) => <SkeletonThread key={i} />)}
        </div>
        <div className={styles.skeletonChatPane}>
          {[{ w: '45%', align: 'flex-end' }, { w: '60%', align: 'flex-start' }, { w: '38%', align: 'flex-end' }, { w: '55%', align: 'flex-start' }, { w: '42%', align: 'flex-end' }].map(({ w, align }, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: align }}>
              <div className={`${styles.skeletonBubble} ${styles.shimmer}`} style={{ width: w }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Profile ---------- */
export function ProfileSkeleton() {
  return (
    <div className={styles.skeletonProfileWrap}>
      <div className={`${styles.skeletonCover} ${styles.shimmer}`} />
      <div className={styles.skeletonProfileCard}>
        <div className={`${styles.skeletonAvatarLg} ${styles.shimmer}`} />
        <Sh h={18} w="40%" mb={6} />
        <Sh h={12} w="28%" mb={4} />
        <Sh h={11} w="20%" />
      </div>
      {/* About section */}
      <div className={styles.skeletonSection}>
        <Sh h={13} w="25%" />
        <Sh h={11} w="95%" />
        <Sh h={11} w="80%" />
        <Sh h={11} w="60%" />
      </div>
      {/* Sitting section */}
      <div className={styles.skeletonSection}>
        <Sh h={13} w="35%" />
        <Sh h={11} w="70%" />
        <Sh h={11} w="50%" />
      </div>
      {/* Cats section */}
      <div className={styles.skeletonSection}>
        <Sh h={13} w="20%" />
        <Sh h={11} w="60%" />
      </div>
    </div>
  );
}

/* ---------- Notifications ---------- */
function SkeletonNotifItem() {
  return (
    <div className={styles.skeletonNotifItem}>
      <div className={styles.shimmer} style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Sh h={13} w="65%" />
        <Sh h={11} w="30%" />
      </div>
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className={styles.skeletonNotifWrap}>
      <Sh h={22} w={160} r={6} mb={24} />
      {Array.from({ length: 8 }).map((_, i) => <SkeletonNotifItem key={i} />)}
    </div>
  );
}

/* ---------- Member profile (public view) ---------- */
export function MemberProfileSkeleton() {
  return (
    <div className={styles.skeletonProfileWrap}>
      <div className={`${styles.skeletonCover} ${styles.shimmer}`} />
      <div className={styles.skeletonProfileCard}>
        <div className={`${styles.skeletonAvatarLg} ${styles.shimmer}`} />
        <Sh h={18} w="45%" mb={6} />
        <Sh h={12} w="30%" mb={4} />
        <Sh h={32} w="100%" r={8} mb={4} />
        <Sh h={32} w="100%" r={8} />
      </div>
      <div className={styles.skeletonSection}>
        <Sh h={13} w="25%" />
        <Sh h={11} w="90%" />
        <Sh h={11} w="75%" />
        <Sh h={11} w="55%" />
      </div>
      <div className={styles.skeletonSection}>
        <Sh h={13} w="35%" />
        <Sh h={11} w="60%" />
        <Sh h={11} w="45%" />
      </div>
    </div>
  );
}

/* ---------- Booking detail modal skeleton ---------- */
export function BookingDetailSkeleton() {
  return (
    <>
      <div className={styles.skeletonDtHeader}>
        <div className={styles.skeletonDtHeaderShimmer} style={{ height: 12, width: 80, borderRadius: 4 }} />
        <div className={styles.skeletonDtHeaderShimmer} style={{ height: 18, width: '60%', borderRadius: 6 }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <div className={styles.skeletonDtHeaderShimmer} style={{ height: 24, width: 120, borderRadius: 20 }} />
          <div className={styles.skeletonDtHeaderShimmer} style={{ height: 24, width: 80, borderRadius: 20 }} />
        </div>
      </div>
      <div className={styles.skeletonDtBody}>
        <div className={styles.skeletonDtGrid}>
          <div className={`${styles.skeletonDtCell} ${styles.shimmer}`} />
          <div className={`${styles.skeletonDtCell} ${styles.shimmer}`} />
          <div className={`${styles.skeletonDtCell} ${styles.shimmer}`} />
          <div className={`${styles.skeletonDtCell} ${styles.shimmer}`} />
        </div>
        <Sh h={13} w="40%" />
        <Sh h={11} w="70%" />
        <Sh h={11} w="55%" />
        <Sh h={40} w="100%" r={8} />
      </div>
    </>
  );
}

/* ---------- Cat chip skeletons (BookingRequestModal) ---------- */
export function CatChipsSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {[80, 100, 70].map((w, i) => (
        <div key={i} className={styles.shimmer} style={{ height: 32, width: w, borderRadius: 20 }} />
      ))}
    </div>
  );
}

/* ---------- Inline bookings rows (BookingsPage) ---------- */
export function BookingRowsSkeleton() {
  return (
    <div style={{ padding: '0 1.5rem' }}>
      {Array.from({ length: 5 }).map((_, i) => <SkeletonBookingRow key={i} />)}
    </div>
  );
}

/* ---------- Inline thread list (InboxPage) ---------- */
export function ThreadListSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => <SkeletonThread key={i} />)}
    </>
  );
}
