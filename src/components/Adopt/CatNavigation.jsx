'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './CatNavigation.module.css';

export default function CatNavigation({ prevCat, nextCat, locale }) {
  const router = useRouter();
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  const minSwipeDistance = 50;

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
    return locale === 'de' ? `/de/adopt/${cat.slug}` : `/adopt/${cat.slug}`;
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && nextCat) {
      router.push(getHref(nextCat));
    } else if (isRightSwipe && prevCat) {
      router.push(getHref(prevCat));
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Add touch listeners to window for mobile swipe
  useEffect(() => {
    if (!isMobile) return;

    const handleStart = (e) => handleTouchStart(e);
    const handleMove = (e) => handleTouchMove(e);
    const handleEnd = () => handleTouchEnd();

    document.addEventListener('touchstart', handleStart, { passive: true });
    document.addEventListener('touchmove', handleMove, { passive: true });
    document.addEventListener('touchend', handleEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleStart);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isMobile, prevCat, nextCat]);

  // Desktop arrow buttons
  if (!isMobile) {
    return (
      <div className={styles.navigation}>
        {prevCat ? (
          <Link href={getHref(prevCat)} className={styles.navButton}>
            <ChevronLeft size={24} />
            <span className={styles.catName}>{prevCat.name}</span>
          </Link>
        ) : (
          <div className={styles.navPlaceholder} />
        )}

        {nextCat ? (
          <Link href={getHref(nextCat)} className={styles.navButton}>
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
