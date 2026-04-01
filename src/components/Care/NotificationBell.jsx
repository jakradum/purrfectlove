'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './CareNavbar.module.css';

export default function NotificationBell({ locale = 'en' }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/care/notifications');
        if (!res.ok) return;
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      } catch {
        // silent
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60_000); // poll every 60s
    return () => clearInterval(interval);
  }, []);

  const href = locale === 'de' ? '/de/care/notifications' : '/notifications';

  return (
    <Link href={href} className={styles.bellLink} aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span className={styles.bellBadge}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
