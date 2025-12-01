'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SwipeWrapper({ children, prevHref, nextHref }) {
  const router = useRouter();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);

  const minSwipeDistance = 100;

  const onTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = 0;
    touchEndY.current = 0;
  };

  const onTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const onTouchEnd = () => {
    if (!touchEndX.current || !touchEndY.current) return;

    const distanceX = touchStartX.current - touchEndX.current;
    const distanceY = touchStartY.current - touchEndY.current;
    const absX = Math.abs(distanceX);
    const absY = Math.abs(distanceY);

    // Only trigger if horizontal swipe is dominant and long enough
    const isHorizontalSwipe = absX > absY * 2 && absX > minSwipeDistance;

    if (!isHorizontalSwipe) return;

    const isLeftSwipe = distanceX > 0;
    const isRightSwipe = distanceX < 0;

    if (isLeftSwipe && nextHref) {
      router.push(nextHref);
    } else if (isRightSwipe && prevHref) {
      router.push(prevHref);
    }
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ minHeight: '100%' }}
    >
      {children}
    </div>
  );
}
