'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './CareNavbar.module.css';
import NotificationBell from './NotificationBell';

export default function CareNavbar({ locale = 'en' }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/care/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const t = locale === 'de'
    ? { network: 'Netzwerk', profile: 'Profil', inbox: 'Posteingang', logout: 'Abmelden' }
    : { network: 'Network', profile: 'Profile', inbox: 'Inbox', logout: 'Log out' };

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <Image src="/logo.svg" alt="Purrfect Love" width={120} height={40} />
        </Link>

        <div className={styles.links}>
          <Link href="/" className={styles.link}>{t.network}</Link>
          <Link href="/inbox" className={styles.link}>{t.inbox}</Link>
          <NotificationBell locale={locale} />
          <Link href="/profile" className={styles.link}>{t.profile}</Link>
          <button onClick={handleLogout} className={styles.logoutBtn}>{t.logout}</button>
        </div>
      </div>
    </nav>
  );
}
