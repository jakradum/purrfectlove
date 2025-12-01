'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './CatNavigation.module.css';

export default function CatNavigation({ prevCat, nextCat, locale }) {
  const router = useRouter();
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Store current cat refs to avoid stale closures
  const prevCatRef = useRef(prevCat);
  const nextCatRef = useRef(nextCat);
  const localeRef = useRef(locale);

  // Update refs when props change
  useEffect(() => {
    prevCatRef.current = prevCat;
    nextCatRef.current = nextCat;
    localeRef.current = locale;
  }, [prevCat, nextCat, locale]);

  const minSwipeDistance = 50;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getHref = (cat, useRef = true) => {
    if (!cat) return null;
    const loc = useRef ? localeRef.current : locale;
    return loc === 'de' ? `/de/adopt/${cat.slug}` : `/adopt/${cat.slug}`;
  };

  // Add touch listeners to window for mobile swipe
  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      touchEndX.current = null;
    };

    const handleTouchMove = (e) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      if (touchStartX.current === null || touchEndX.current === null) return;

      const distance = touchStartX.current - touchEndX.current;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      if (isLeftSwipe && nextCatRef.current) {
        const href = getHref(nextCatRef.current);
        if (href) router.push(href);
      } else if (isRightSwipe && prevCatRef.current) {
        const href = getHref(prevCatRef.current);
        if (href) router.push(href);
      }

      touchStartX.current = null;
      touchEndX.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, router]);

  // Desktop arrow buttons
  if (!isMobile) {
    return (
      <div className={styles.navigation}>
        {prevCat ? (
          <Link href={getHref(prevCat, false)} className={styles.navButton}>
            <ChevronLeft size={24} />
            <span className={styles.catName}>{prevCat.name}</span>
          </Link>
        ) : (
          <div className={styles.navPlaceholder} />
        )}

        {nextCat ? (
          <Link href={getHref(nextCat, false)} className={styles.navButton}>
            <span className={styles.catName}>{nextCat.name}</span>
            <ChevronRight size={24} />
          </Link>
        ) : (
          <div className={styles.navPlaceholder} />
        )}
      </div>
    );
  }

  // Mobile: show swipe hint
  return (
    <div className={styles.swipeHint}>
      {(prevCat || nextCat) && (
        <span className={styles.swipeText}>
          {locale === 'de' ? 'Wischen für mehr Katzen' : 'Swipe for more cats'}
        </span>
      )}
    </div>
  );
}
