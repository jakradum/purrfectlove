'use client';

import { useState, useCallback, useRef } from 'react';
import styles from './HappyCats.module.css';

function formatDate(dateStr, locale) {
  const [y, m] = dateStr.split('-').map(Number);
  return new Date(y, m - 1).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });
}

const ANIM_MS = 320;
const SCROLL_AMOUNT = 300;

export default function SuccessStoriesGrid({ stories, locale }) {
  const [active, setActive] = useState(null);
  const [closing, setClosing] = useState(false);
  const trackRef = useRef(null);

  const openModal = useCallback((story) => {
    setClosing(false);
    setActive(story);
  }, []);

  const closeModal = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setActive(null);
      setClosing(false);
    }, ANIM_MS);
  }, []);

  const scrollBy = (dir) => {
    trackRef.current?.scrollBy({ left: dir * SCROLL_AMOUNT, behavior: 'smooth' });
  };

  const storyCard = (story) => (
    <div key={story._id} className={styles.card} onClick={() => openModal(story)}>
      {story.imageUrl && (
        <div className={styles.cardImg}>
          <img src={story.imageUrl} alt={story.catName} />
        </div>
      )}
      <div className={styles.cardBody}>
        <div className={styles.catName}>{story.catName}</div>
        <div className={styles.byline}>
          by {story.adopterName} · {formatDate(story.adoptionDate, locale)}
        </div>
        {story.quote && (
          <div className={styles.quote}>"{story.quote}"</div>
        )}
        <span className={styles.readLink}>{locale === 'de' ? 'Geschichte lesen →' : 'Read story →'}</span>
      </div>
    </div>
  );

  return (
    <>
      {stories.length < 2 ? (
        <div className={styles.singleCardWrap}>
          {stories.map(storyCard)}
        </div>
      ) : (
        <div className={styles.carouselWrap}>
          <button
            className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`}
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
          >
            ‹
          </button>

          <div className={styles.carouselTrack} ref={trackRef}>
            {stories.map(storyCard)}
          </div>

          <button
            className={`${styles.carouselArrow} ${styles.carouselArrowRight}`}
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
          >
            ›
          </button>
        </div>
      )}

      {active && (
        <div
          className={`${styles.overlay} ${closing ? styles.overlayClosing : ''}`}
          onClick={closeModal}
        >
          <div
            className={`${styles.modal} ${closing ? styles.modalClosing : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.handle} />
            <button className={styles.closeBtn} onClick={closeModal} aria-label="Close">
              <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
                <path d="M2 2l10 10M12 2L2 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className={styles.modalInner}>
              {active.imageUrl && (
                <img src={active.imageUrl} alt={active.catName} className={styles.modalImg} />
              )}
              <div className={styles.modalBody}>
                <div className={styles.modalCatName}>{active.catName}</div>
                <div className={styles.modalByline}>
                  Story by {active.adopterName} · {formatDate(active.adoptionDate, locale)}
                </div>
                {active.quote && (
                  <div className={styles.modalQuote}>"{active.quote}"</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
