'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './Care.module.css';
import DateRangePicker from './DateRangePicker';

function formatMonthDay(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export default function FilterBar({ startDate, endDate, radius, onDatesChange, onRadiusChange, hasLocation, locale = 'en' }) {
  const [openPopover, setOpenPopover] = useState(null); // 'dates' | 'radius' | null
  const innerRef = useRef(null);
  const sliderRef = useRef(null);

  // Close popover on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (innerRef.current && !innerRef.current.contains(e.target)) {
        setOpenPopover(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Radius slider track fill
  const paintTrack = useCallback((el, val) => {
    if (!el) return;
    const pct = ((val - 3) / (25 - 3)) * 100;
    el.style.background = `linear-gradient(to right, var(--tabby-brown) ${pct}%, #e5e7eb ${pct}%)`;
  }, []);
  const sliderRefCb = useCallback((el) => {
    sliderRef.current = el;
    if (el) paintTrack(el, Number(el.value));
  }, [paintTrack]);
  useEffect(() => { paintTrack(sliderRef.current, radius); }, [radius, paintTrack]);

  const datesValue = startDate && endDate
    ? `${formatMonthDay(startDate)} – ${formatMonthDay(endDate)}`
    : startDate
    ? `${formatMonthDay(startDate)} – ?`
    : locale === 'de' ? 'Datum wählen' : 'Add dates';

  const toggle = (name) => setOpenPopover(p => p === name ? null : name);

  return (
    <div className={styles.filterBarWrap}>
      {/* Inner div is position: relative so popovers are positioned relative to it,
          even when the outer sticky wrapper is in its "fixed" position */}
      <div className={styles.filterBarInner} ref={innerRef}>
        <div className={styles.filterBar}>
          {/* Dates section */}
          <button
            type="button"
            className={`${styles.filterSection} ${openPopover === 'dates' ? styles.filterSectionActive : ''}`}
            onClick={() => toggle('dates')}
          >
            <span className={styles.filterLabel}>{locale === 'de' ? 'Datum' : 'Dates'}</span>
            <span className={styles.filterValue}>{datesValue}</span>
          </button>

          <div className={styles.filterDivider} />

          {/* Radius section */}
          <button
            type="button"
            className={`${styles.filterSection} ${openPopover === 'radius' ? styles.filterSectionActive : ''} ${!hasLocation ? styles.filterSectionDim : ''}`}
            onClick={() => hasLocation && toggle('radius')}
            title={!hasLocation ? 'Add your location in your profile to enable radius filtering' : undefined}
          >
            <span className={styles.filterLabel}>{locale === 'de' ? 'Radius' : 'Radius'}</span>
            <span className={styles.filterValue}>{hasLocation ? `Within ${radius} km` : 'No location'}</span>
          </button>

          {/* Search button */}
          <button
            type="button"
            className={styles.filterSearchBtn}
            aria-label="Search"
            onClick={() => setOpenPopover(null)}
          >
            <SearchIcon />
          </button>
        </div>

        {/* Dates popover */}
        {openPopover === 'dates' && (
          <div className={styles.filterPopover}>
            <p className={styles.filterPopoverTitle}>{locale === 'de' ? 'Reisedaten' : 'Select dates'}</p>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              locale={locale}
              onChange={({ startDate: s, endDate: e }) => {
                onDatesChange(s, e);
                if (s && e) setOpenPopover(null);
              }}
              onClear={() => onDatesChange('', '')}
            />
          </div>
        )}

        {/* Radius popover */}
        {openPopover === 'radius' && (
          <div className={styles.filterPopover}>
            <p className={styles.filterPopoverTitle}>{locale === 'de' ? 'Suchradius' : 'Search radius'}</p>
            <div className={styles.radiusDisplay}>
              <span className={styles.radiusNumber}>{radius}</span>
              <span className={styles.radiusUnit}>{locale === 'de' ? 'Kilometer von dir' : 'kilometres from you'}</span>
            </div>
            <input
              ref={sliderRefCb}
              type="range"
              min={3}
              max={25}
              step={0.5}
              value={radius}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className={styles.radiusSliderInput}
            />
            <div className={styles.radiusSliderLabels}>
              <span>3 km</span>
              <span>25 km</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
