'use client';
import { useEffect, useRef } from 'react';
import styles from './BlogPostPage.module.css';

export default function BlogOverview({ text }) {
  const ref = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!ref.current) return;
      Array.from(ref.current.querySelectorAll('span')).forEach((span, i) => {
        span.style.animationDelay = `${i * 110}ms`;
        span.classList.add(styles.overviewWordVisible);
      });
    }, 80);
    return () => clearTimeout(t);
  }, []);

  const words = text.split(' ');

  return (
    <div className={styles.overviewBox}>
      <div className={styles.overviewLabel}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Overview
      </div>
      <p className={styles.overviewText} ref={ref}>
        {words.map((word, i) => (
          <span key={i} className={styles.overviewWord}>
            {word}{i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </p>
    </div>
  );
}
