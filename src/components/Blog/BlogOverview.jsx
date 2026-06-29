'use client';
import { useEffect, useState } from 'react';
import styles from './BlogPostPage.module.css';

export default function BlogOverview({ text }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay so animation fires after paint
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const words = text.split(' ');
  const msPerWord = 110;

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
            className={styles.overviewWord}
            style={visible ? { animationDelay: `${i * msPerWord}ms` } : { animation: 'none', opacity: 0 }}
          >
            {word}{i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </p>
    </div>
  );
}
