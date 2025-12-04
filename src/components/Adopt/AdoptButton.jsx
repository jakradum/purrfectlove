'use client';
import { useState } from 'react';
import AdoptionForm from './AdoptionForm';
import styles from './AdoptButton.module.css';

export default function AdoptButton({ cat, content, locale = 'en' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className={styles.adoptButton}
        onClick={() => setIsOpen(true)}
      >
        {content.adoptButton.replace('{catName}', cat.name)}
      </button>

      {isOpen && (
        <AdoptionForm
          cat={cat}
          content={content}
          locale={locale}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
