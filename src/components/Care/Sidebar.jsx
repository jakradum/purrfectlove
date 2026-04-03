'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LayoutGrid, MessageSquare, User, LogOut } from 'lucide-react';
import styles from './Sidebar.module.css';

export default function Sidebar({ locale = 'en', basePath = '' }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletionPending, setDeletionPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/care/messages/inbox');
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const count = (data.threads || []).reduce((sum, t) => sum + (t.unreadCount || 0), 0);
        if (!cancelled) setUnreadCount(count);
      } catch { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    fetch('/api/care/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.deletionRequested) setDeletionPending(true); })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/care/logout', { method: 'POST' });
    router.push(`${basePath}/login`);
    router.refresh();
  };

  const isAuthPage = pathname.endsWith('/login') || pathname.endsWith('/join');

  const isActive = (path) => {
    const full = basePath + path;
    if (path === '') return pathname === basePath || pathname === basePath + '/';
    return pathname.startsWith(full);
  };

  const t = locale === 'de'
    ? { network: 'Netzwerk', inbox: 'Nachrichten', profile: 'Profil', logout: 'Abmelden' }
    : { network: 'Home', inbox: 'Inbox', profile: 'Profile', logout: 'Log out' };

  const links = [
    { path: '', icon: LayoutGrid, label: t.network, lockable: true },
    { path: '/inbox', icon: MessageSquare, label: t.inbox, badge: unreadCount, lockable: true },
    { path: '/profile', icon: User, label: t.profile },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTitle}>Community</div>
        <nav className={styles.nav}>
          {links.map(({ path, icon: Icon, label, badge, lockable }) => {
            const disabled = deletionPending && lockable;
            const active = isActive(path);
            if (disabled) {
              return (
                <span
                  key={path}
                  className={`${styles.link} ${styles.linkDisabled}`}
                  title="Your account is pending deletion"
                >
                  <span className={styles.iconWrap}>
                    <Icon size={20} strokeWidth={1.75} />
                  </span>
                  <span className={styles.label}>{label}</span>
                </span>
              );
            }
            return (
              <Link
                key={path}
                href={`${basePath}${path}` || '/'}
                className={`${styles.link} ${active ? styles.linkActive : ''}`}
              >
                <span className={styles.iconWrap}>
                  <Icon size={20} strokeWidth={1.75} />
                  {badge > 0 && <span className={styles.badge} />}
                </span>
                <span className={styles.label}>{label}</span>
              </Link>
            );
          })}
        </nav>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={20} strokeWidth={1.75} />
          <span className={styles.label}>{t.logout}</span>
        </button>
      </aside>

      {/* Mobile bottom nav — hidden on login/join */}
      <nav className={`${styles.bottomNav} ${isAuthPage ? styles.bottomNavHidden : ''}`}>
        {links.map(({ path, icon: Icon, label, badge, lockable }) => {
          const disabled = deletionPending && lockable;
          const active = isActive(path);
          if (disabled) {
            return (
              <span
                key={path}
                className={`${styles.bottomLink} ${styles.bottomLinkDisabled}`}
                title="Your account is pending deletion"
              >
                <Icon size={22} strokeWidth={1.75} />
                <span className={styles.bottomLabel}>{label}</span>
              </span>
            );
          }
          return (
            <Link
              key={path}
              href={`${basePath}${path}` || '/'}
              className={`${styles.bottomLink} ${active ? styles.bottomLinkActive : ''}`}
            >
              <span className={styles.iconWrap}>
                <Icon size={22} strokeWidth={1.75} />
                {badge > 0 && <span className={styles.badge} />}
              </span>
              <span className={styles.bottomLabel}>{label}</span>
            </Link>
          );
        })}
        <button onClick={handleLogout} className={styles.bottomLink}>
          <LogOut size={22} strokeWidth={1.75} />
          <span className={styles.bottomLabel}>{t.logout}</span>
        </button>
      </nav>
    </>
  );
}
