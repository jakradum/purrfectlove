'use client';

import Link from 'next/link';
import styles from './Care.module.css';

const TYPE_LABELS = {
  message: 'New message',
  sit_request: 'Sit request',
  membership_approved: 'Membership approved',
  sit_confirm: 'Sit confirmation',
};

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NotificationsPage({ notifications = [], locale = 'en' }) {
  const t = locale === 'de'
    ? { title: 'Benachrichtigungen', empty: 'Keine Benachrichtigungen.', markRead: 'Als gelesen markieren' }
    : { title: 'Notifications', empty: 'No notifications yet.' };

  return (
    <main className={styles.pageWrap}>
      <div className={styles.pageInner}>
        <h1 className={styles.pageTitle}>{t.title}</h1>

        {notifications.length === 0 ? (
          <p className={styles.emptyText}>{t.empty}</p>
        ) : (
          <ul className={styles.notifList}>
            {notifications.map((n) => {
              const label = TYPE_LABELS[n.type] || n.type;
              const inner = (
                <div className={`${styles.notifItem} ${n.read ? styles.notifRead : styles.notifUnread}`}>
                  <span className={styles.notifLabel}>{label}</span>
                  {n.senderName && (
                    <span className={styles.notifSender}>from {n.senderName}</span>
                  )}
                  <span className={styles.notifDate}>{formatDate(n.createdAt)}</span>
                </div>
              );

              return (
                <li key={n._id}>
                  {n.linkPath ? (
                    <Link href={n.linkPath} className={styles.notifLink}>
                      {inner}
                    </Link>
                  ) : inner}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
