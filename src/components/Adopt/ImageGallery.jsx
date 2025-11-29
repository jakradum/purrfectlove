'use client';

import { useState } from 'react';
import styles from './ImageGallery.module.css';

// Receives pre-built image URLs from server component
export default function ImageGallery({ images, catName }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // images = [{ main: url, thumb: url }, ...]

  // If only one photo, show simple view
  if (!images || images.length <= 1) {
    return (
      <div className={styles.singleImage}>
        {images?.[0] && (
          <img
            src={images[0].main}
            alt={catName}
            className={styles.image}
          />
        )}
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className={styles.gallery}>
      <div className={styles.mainImageContainer}>
        <img
          src={images[currentIndex].main}
          alt={`${catName} - photo ${currentIndex + 1}`}
          className={styles.mainImage}
        />

        {/* Navigation arrows */}
        <button
          className={`${styles.navButton} ${styles.prevButton}`}
          onClick={goToPrevious}
          aria-label="Previous photo"
        >
          ‹
        </button>
        <button
          className={`${styles.navButton} ${styles.nextButton}`}
          onClick={goToNext}
          aria-label="Next photo"
        >
          ›
        </button>

        {/* Dot indicators */}
        <div className={styles.dots}>
          {images.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to photo ${index + 1}`}
            />
          ))}
        </div>

        {/* Photo counter */}
        <div className={styles.counter}>
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className={styles.thumbnails}>
        {images.map((image, index) => (
          <button
            key={index}
            className={`${styles.thumbnail} ${index === currentIndex ? styles.activeThumbnail : ''}`}
            onClick={() => goToSlide(index)}
          >
            <img
              src={image.thumb}
              alt={`${catName} - thumbnail ${index + 1}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
