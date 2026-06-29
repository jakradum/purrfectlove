'use client';
import { useEffect, useState } from 'react';
import styles from './BlogPostPage.module.css';

export default function BlogOverview({ text }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const words = text.split(' ');

  useEffect(() => {
    let i = 0;
    function next() {
      i++;
      setVisibleCount(i);
      if (i < words.length) setTimeout(next, 110);
    }
    const t = setTimeout(next, 80);
    return () => clearTimeout(t);
  }, [words.length]);

  return (
    <div className={styles.overviewBox}>
      <div className={styles.overviewLabel}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Overview
      </div>
      <p className={styles.overviewText}>
        {words.map((word, i) => (
          <span
            key={i}
            style={{
              display: 'inline',
              opacity: i < visibleCount ? 1 : 0,
              filter: i < visibleCount ? 'blur(0px)' : 'blur(3px)',
              transition: 'opacity 0.3s ease, filter 0.3s ease',
            }}
          >
            {word}{i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </p>
    </div>
  );
}
