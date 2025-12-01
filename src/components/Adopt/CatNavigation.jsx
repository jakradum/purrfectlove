'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './CatNavigation.module.css';

export default function CatNavigation({ prevCat, nextCat, locale }) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  // Swipe tracking
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchEndX = useRef(null);
  const isHorizontalSwipe = useRef(false);

  // Store current cat refs to avoid stale closures in event handlers
  const prevCatRef = useRef(prevCat);
  const nextCatRef = useRef(nextCat);
  const localeRef = useRef(locale);

  // Update refs when props change
  useEffect(() => {
    prevCatRef.current = prevCat;
    nextCatRef.current = nextCat;
    localeRef.current = locale;
  }, [prevCat, nextCat, locale]);

  const minSwipeDistance = 80; // Increased for better detection

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getHref = (cat) => {
    if (!cat) return null;
    return localeRef.current === 'de' ? `/de/adopt/${cat.slug}` : `/adopt/${cat.slug}`;
  };

  const getLinkHref = (cat) => {
    if (!cat) return null;
    return locale === 'de' ? `/de/adopt/${cat.slug}` : `/adopt/${cat.slug}`;
  };

  // Mobile swipe detection
  useEffect(() => {
    if (!isMobile) return;
    if (!prevCat && !nextCat) return;

    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchEndX.current = null;
      isHorizontalSwipe.current = false;
    };

    const handleTouchMove = (e) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;

      const diffX = Math.abs(currentX - touchStartX.current);
      const diffY = Math.abs(currentY - touchStartY.current);

      // Determine if this is a horizontal swipe (more horizontal than vertical)
      if (!isHorizontalSwipe.current && (diffX > 10 || diffY > 10)) {
        isHorizontalSwipe.current = diffX > diffY * 1.5; // Require clearly horizontal
      }

      if (isHorizontalSwipe.current) {
        touchEndX.current = currentX;
      }
    };

    const handleTouchEnd = () => {
      if (!isHorizontalSwipe.current || touchStartX.current === null || touchEndX.current === null) {
        // Reset
        touchStartX.current = null;
        touchStartY.current = null;
        touchEndX.current = null;
        isHorizontalSwipe.current = false;
        return;
      }

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

      // Reset
      touchStartX.current = null;
      touchStartY.current = null;
      touchEndX.current = null;
      isHorizontalSwipe.current = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, router, prevCat, nextCat]);

  // No navigation needed if no prev/next cats
  if (!prevCat && !nextCat) {
    return null;
  }

  // Mobile: show navigation buttons + swipe hint
  if (isMobile) {
    return (
      <div className={styles.mobileNavigation}>
        <div className={styles.mobileButtons}>
          {prevCat ? (
            <Link href={getLinkHref(prevCat)} className={styles.mobileNavButton}>
              <ChevronLeft size={20} />
              <span>{prevCat.name}</span>
            </Link>
          ) : (
            <div className={styles.mobileNavPlaceholder} />
          )}

          {nextCat ? (
            <Link href={getLinkHref(nextCat)} className={styles.mobileNavButton}>
              <span>{nextCat.name}</span>
              <ChevronRight size={20} />
            </Link>
          ) : (
            <div className={styles.mobileNavPlaceholder} />
          )}
        </div>
        <p className={styles.swipeHint}>
          {locale === 'de' ? 'oder wischen zum navigieren' : 'or swipe to navigate'}
        </p>
      </div>
    );
  }

  // Desktop: arrow buttons
  return (
    <div className={styles.navigation}>
      {prevCat ? (
        <Link href={getLinkHref(prevCat)} className={styles.navButton}>
          <ChevronLeft size={24} />
          <span className={styles.catName}>{prevCat.name}</span>
        </Link>
      ) : (
        <div className={styles.navPlaceholder} />
      )}

      {nextCat ? (
        <Link href={getLinkHref(nextCat)} className={styles.navButton}>
          <span className={styles.catName}>{nextCat.name}</span>
          <ChevronRight size={24} />
        </Link>
      ) : (
        <div className={styles.navPlaceholder} />
      )}
    </div>
  );
}
