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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C85C3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C85C3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C85C3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function SitTypeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C85C3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

const CLOSE_DURATION = 180; // ms — must match filterPopoverOut animation

export default function FilterBar({ startDate, endDate, radius, sitType, onDatesChange, onRadiusChange, onSitTypeChange, onRefresh, hasLocation, locale = 'en' }) {
  const [openPopover, setOpenPopover] = useState(null); // 'dates' | 'radius' | null
  const [closingPopover, setClosingPopover] = useState(null);
  const [seen, setSeen] = useState(true); // start true to avoid flash; corrected in effect
  const innerRef = useRef(null);
  const sliderRef = useRef(null);
  const openPopoverRef = useRef(null);
  openPopoverRef.current = openPopover;

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

  // Animated close helper
  const closePopover = useCallback((name) => {
    setClosingPopover(name);
    setTimeout(() => {
      setOpenPopover(p => p === name ? null : p);
      setClosingPopover(c => c === name ? null : c);
    }, CLOSE_DURATION);
  }, []);

  // Close popover on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (innerRef.current && !innerRef.current.contains(e.target)) {
        const current = openPopoverRef.current;
        if (current) closePopover(current);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [closePopover]);

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
    : locale === 'de' ? 'Datum wählen' : 'Choose dates you need sitting';

  const toggle = (name) => {
    if (openPopover === name || closingPopover === name) {
      closePopover(name);
    } else {
      if (openPopover) closePopover(openPopover);
      setOpenPopover(name);
    }
  };

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
            </div>
          </button>

          <div className={styles.filterDivider} />

          {/* Sit type section */}
          <button
            type="button"
            className={`${styles.filterSection} ${openPopover === 'sitType' ? styles.filterSectionActive : ''} ${sitType ? styles.filterSectionActive : ''}`}
            onClick={() => toggle('sitType')}
          >
            <div className={styles.filterIcon}>
              <SitTypeIcon />
            </div>
            <div className={styles.filterTextGroup}>
              <span className={styles.filterLabel}>{locale === 'de' ? 'Art' : 'Sit type'}</span>
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
        {(openPopover === 'dates' || closingPopover === 'dates') && (
          <div className={`${styles.filterPopover}${closingPopover === 'dates' ? ` ${styles.filterPopoverClosing}` : ''}`}>
            <p className={styles.filterPopoverTitle}>{locale === 'de' ? 'Reisedaten' : 'You are editing dates you need cat sitting help'}</p>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              locale={locale}
              onChange={({ startDate: s, endDate: e }) => {
                onDatesChange(s, e);
                if (s && e) closePopover('dates');
              }}
              onClear={() => onDatesChange('', '')}
            />
          </div>
        )}

        {/* Sit type popover */}
        {(openPopover === 'sitType' || closingPopover === 'sitType') && (
          <div className={`${styles.filterPopover}${closingPopover === 'sitType' ? ` ${styles.filterPopoverClosing}` : ''}`}>
            <p className={styles.filterPopoverTitle}>{locale === 'de' ? 'Art des Sittings' : 'What kind of sitting do you need?'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { value: null, label: 'Any' },
                { value: 'home_visit', label: 'Home visits — sitter comes to you' },
                { value: 'drop_off', label: 'Drop off — you bring your cat to the sitter' },
              ].map(({ value, label }) => (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => { onSitTypeChange(value); closePopover('sitType'); }}
                  style={{
                    textAlign: 'left', padding: '0.6rem 0.75rem', borderRadius: 8, cursor: 'pointer',
                    fontSize: '0.875rem', fontFamily: 'inherit',
                    border: sitType === value ? '1.5px solid #2C5F4F' : '1.5px solid #e5e7eb',
                    background: sitType === value ? '#EAF3DE' : '#fafafa',
                    color: sitType === value ? '#2C5F4F' : '#555',
                    fontWeight: sitType === value ? 600 : 400,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Radius popover — right-aligned under the radius section */}
        {(openPopover === 'radius' || closingPopover === 'radius') && (
          <div className={`${styles.filterPopover} ${styles.filterPopoverRight}${closingPopover === 'radius' ? ` ${styles.filterPopoverClosing}` : ''}`}>
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
