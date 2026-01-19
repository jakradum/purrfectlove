'use client';

import styles from './TagFilter.module.css';

export default function TagFilter({ allTags, selectedTags, onTagSelect, onClearAll, locale, getTagLabel }) {
  const clearAllText = locale === 'de' ? 'Alle löschen' : 'Clear all';

  if (!allTags || allTags.length === 0) {
    return null;
  }

  const hasSelectedTags = selectedTags && selectedTags.length > 0;

  return (
    <div className={styles.filterContainer}>
      {allTags.map((tag) => (
        <button
          key={tag}
          className={`${styles.tag} ${selectedTags.includes(tag) ? styles.active : ''}`}
          onClick={() => onTagSelect(tag)}
        >
          {getTagLabel ? getTagLabel(tag) : tag}
        </button>
      ))}
      {hasSelectedTags && (
        <button
          className={styles.clearAll}
          onClick={onClearAll}
        >
          {clearAllText}
        </button>
      )}
    </div>
  );
}
