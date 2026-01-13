'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './LocaleSuggestion.module.css';

export default function LocaleSuggestion({ currentLocale = 'en' }) {
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestedLocale, setSuggestedLocale] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    // Check if user has already dismissed the suggestion
    const dismissed = localStorage.getItem('localeSuggestionDismissed');
    if (dismissed) return;

    // Detect user's location using timezone as a proxy
    const detectLocation = () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Common German timezones
      const germanTimezones = ['Europe/Berlin', 'Europe/Zurich', 'Europe/Vienna'];

      // Common Indian timezone
      const indianTimezones = ['Asia/Kolkata', 'Asia/Calcutta'];

      if (germanTimezones.includes(timezone) && currentLocale === 'en') {
        return 'de';
      } else if (indianTimezones.includes(timezone) && currentLocale === 'de') {
        return 'en';
      }

      return null;
    };

    const detected = detectLocation();
    if (detected) {
      setSuggestedLocale(detected);
      setShowSuggestion(true);
    }
  }, [currentLocale]);

  const handleDismiss = () => {
    localStorage.setItem('localeSuggestionDismissed', 'true');
    setShowSuggestion(false);
  };

  const getSuggestedUrl = () => {
    if (suggestedLocale === 'de') {
      return `/de${pathname === '/' ? '' : pathname}`;
    } else {
      const withoutDe = pathname.replace(/^\/de/, '');
      return withoutDe || '/';
    }
  };

  if (!showSuggestion || !suggestedLocale) return null;

  const content = {
    en: {
      message: 'Looks like you\'re browsing from Germany. Would you like to switch to the German site?',
      switchButton: 'Switch to Deutschland',
      dismissButton: 'Stay on India'
    },
    de: {
      message: 'Es sieht so aus, als würdest du aus Indien zugreifen. Möchtest du zur indischen Seite wechseln?',
      switchButton: 'Zu India wechseln',
      dismissButton: 'Auf Deutschland bleiben'
    }
  };

  const t = content[currentLocale] || content.en;

  return (
    <div className={styles.banner}>
      <div className={styles.container}>
        <p className={styles.message}>{t.message}</p>
        <div className={styles.actions}>
          <Link href={getSuggestedUrl()} className={styles.switchButton}>
            {t.switchButton}
          </Link>
          <button onClick={handleDismiss} className={styles.dismissButton}>
            {t.dismissButton}
          </button>
        </div>
      </div>
    </div>
  );
}
