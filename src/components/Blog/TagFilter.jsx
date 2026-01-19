'use client';

import { useState, useEffect } from 'react';
import styles from './TagFilter.module.css';

export default function TagFilter({ allTags, selectedTag, onTagSelect, locale }) {
  const clearText = locale === 'de' ? 'Alle' : 'All';

  if (!allTags || allTags.length === 0) {
    return null;
  }

  return (
    <div className={styles.filterContainer}>
      <button
        className={`${styles.tag} ${!selectedTag ? styles.active : ''}`}
        onClick={() => onTagSelect(null)}
      >
        {clearText}
      </button>
      {allTags.map((tag) => (
        <button
          key={tag}
          className={`${styles.tag} ${selectedTag === tag ? styles.active : ''}`}
          onClick={() => onTagSelect(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
