'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './Care.module.css';
import DateRangePicker from './DateRangePicker';

const SEEN_KEY = 'datePickerSeen';

function formatMonthDay(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2C5F4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2C5F4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

export default function FilterBar({ startDate, endDate, radius, onDatesChange, onRadiusChange, hasLocation, locale = 'en' }) {
  const [openPopover, setOpenPopover] = useState(null); // 'dates' | 'radius' | null
  const [seen, setSeen] = useState(true); // start true to avoid flash; corrected in effect
  const innerRef = useRef(null);
  const sliderRef = useRef(null);

  // Read localStorage on mount (client only)
  useEffect(() => {
    try {
      setSeen(!!localStorage.getItem(SEEN_KEY));
    } catch { /* ignore */ }
  }, []);

  // Dismiss pulse + hint on first dates interaction
  const markSeen = useCallback(() => {
    if (seen) return;
    setSeen(true);
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
  }, [seen]);

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
  useEffect(() => {
    paintTrack(sliderRef.current, radius);
  }, [radius, paintTrack]);

  const datesValue = startDate && endDate
    ? `${formatMonthDay(startDate)} – ${formatMonthDay(endDate)}`
    : startDate
    ? `${formatMonthDay(startDate)} – ?`
    : locale === 'de' ? 'Datum wählen' : 'Add dates';

  const toggle = (name) => setOpenPopover(p => p === name ? null : name);

  return (
    <div className={styles.filterBarWrap}>
      <div className={styles.filterBarInner} ref={innerRef}>
        <div className={`${styles.filterBar} ${seen ? styles.filterBarSeen : styles.filterBarPulse}`}>

          {/* Dates section — entire button is the tap target */}
          <button
            type="button"
            className={`${styles.filterSection} ${openPopover === 'dates' ? styles.filterSectionActive : ''}`}
            onClick={() => { markSeen(); toggle('dates'); }}
          >
            <div className={styles.filterIcon}>
              <CalendarIcon />
            </div>
            <div className={styles.filterTextGroup}>
              <span className={styles.filterLabel}>{locale === 'de' ? 'Datum' : 'Dates'}</span>
              <span className={styles.filterValue}>{datesValue}</span>
            </div>
          </button>

          <div className={styles.filterDivider} />

          {/* Radius section */}
          <button
            type="button"
            className={`${styles.filterSection} ${openPopover === 'radius' ? styles.filterSectionActive : ''} ${!hasLocation ? styles.filterSectionDim : ''}`}
            onClick={() => hasLocation && toggle('radius')}
            title={!hasLocation ? 'Add your location in your profile to enable radius filtering' : undefined}
          >
            <div className={styles.filterIcon}>
              <PinIcon />
            </div>
            <div className={styles.filterTextGroup}>
              <span className={styles.filterLabel}>{locale === 'de' ? 'Radius' : 'Radius'}</span>
              <span className={styles.filterValue}>{hasLocation ? `Within ${radius} km` : 'No location'}</span>
            </div>
          </button>
        </div>

        {/* Bouncing hint — hidden once seen */}
        {!seen && (
          <div className={styles.filterHint}>
            <span className={styles.filterHintArrow}>↑</span>
            <span>{locale === 'de' ? '↑ Tippe hier, um Daten auszuwählen' : 'Tap here to pick your dates and find sitters'}</span>
          </div>
        )}

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

        {/* Radius popover — right-aligned under the radius section */}
        {openPopover === 'radius' && (
          <div className={`${styles.filterPopover} ${styles.filterPopoverRight}`}>
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
