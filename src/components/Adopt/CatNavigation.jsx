'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './CatNavigation.module.css';

export default function CatNavigation({ prevCat, nextCat, locale }) {
  const getHref = (cat) => {
    if (!cat) return null;
    return locale === 'de' ? `/de/adopt/${cat.slug}` : `/adopt/${cat.slug}`;
  };

  // No navigation needed if no prev/next cats
  if (!prevCat && !nextCat) {
    return null;
  }

  return (
    <div className={styles.navigation}>
      {prevCat ? (
        <Link href={getHref(prevCat)} className={styles.navButton}>
          <ChevronLeft size={20} />
          <span className={styles.catName}>{prevCat.name}</span>
        </Link>
      ) : (
        <div className={styles.navPlaceholder} />
      )}

      <span className={styles.swipeHint}>
        {locale === 'de' ? 'Wischen zum Navigieren' : 'Swipe to navigate'}
      </span>

      {nextCat ? (
        <Link href={getHref(nextCat)} className={styles.navButton}>
          <span className={styles.catName}>{nextCat.name}</span>
          <ChevronRight size={20} />
        </Link>
      ) : (
        <div className={styles.navPlaceholder} />
      )}
    </div>
  );
}
