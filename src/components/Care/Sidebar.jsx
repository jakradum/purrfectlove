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
    : { network: 'Get Care', inbox: 'Inbox', profile: 'Profile', logout: 'Log out' };

  const links = [
    { path: '', icon: LayoutGrid, label: t.network },
    { path: '/inbox', icon: MessageSquare, label: t.inbox, badge: unreadCount },
    { path: '/profile', icon: User, label: t.profile },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={styles.sidebar}>
        <nav className={styles.nav}>
          {links.map(({ path, icon: Icon, label, badge }) => (
            <Link
              key={path}
              href={`${basePath}${path}` || '/'}
              className={`${styles.link} ${isActive(path) ? styles.linkActive : ''}`}
            >
              <span className={styles.iconWrap}>
                <Icon size={20} strokeWidth={1.75} />
                {badge > 0 && <span className={styles.badge}>{badge > 9 ? '9+' : badge}</span>}
              </span>
              <span className={styles.label}>{label}</span>
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={20} strokeWidth={1.75} />
          <span className={styles.label}>{t.logout}</span>
        </button>
      </aside>

      {/* Mobile bottom nav — hidden on login/join */}
      <nav className={`${styles.bottomNav} ${isAuthPage ? styles.bottomNavHidden : ''}`}>
        {links.map(({ path, icon: Icon, label, badge }) => (
          <Link
            key={path}
            href={`${basePath}${path}` || '/'}
            className={`${styles.bottomLink} ${isActive(path) ? styles.bottomLinkActive : ''}`}
          >
            <span className={styles.iconWrap}>
              <Icon size={22} strokeWidth={1.75} />
              {badge > 0 && <span className={styles.badge}>{badge > 9 ? '9+' : badge}</span>}
            </span>
            <span className={styles.bottomLabel}>{label}</span>
          </Link>
        ))}
        <button onClick={handleLogout} className={styles.bottomLink}>
          <LogOut size={22} strokeWidth={1.75} />
          <span className={styles.bottomLabel}>{t.logout}</span>
        </button>
      </nav>
    </>
  );
}
