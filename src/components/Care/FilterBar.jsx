'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import styles from './Care.module.css';
import DateRangePicker from './DateRangePicker';

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

const CLOSE_DURATION = 180;

export default function FilterBar({ startDate, endDate, radius, sitType, onDatesChange, onRadiusChange, onSitTypeChange, onRefresh, hasLocation, locale = 'en', loading = false }) {
  const [panel, setPanel] = useState(null);       // 'dates' | 'sitType' | 'radius' | null
  const [panelClosing, setPanelClosing] = useState(false);
  const [popLeft, setPopLeft] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  const [stuck, setStuck] = useState(false);

  const innerRef    = useRef(null);
  const popoverRef  = useRef(null);
  const datesRef    = useRef(null);
  const sitTypeRef  = useRef(null);
  const radiusRef   = useRef(null);
  const closeTimer  = useRef(null);
  const sentinelRef = useRef(null);

  // Compute pixel left for the popover relative to innerRef
  const getLeft = useCallback((name) => {
    if (!innerRef.current || !popoverRef.current) return 0;
    const cRect = innerRef.current.getBoundingClientRect();
    const popW  = popoverRef.current.offsetWidth;

    if (name === 'dates' && datesRef.current) {
      return datesRef.current.getBoundingClientRect().left - cRect.left;
    }
    if (name === 'sitType' && sitTypeRef.current) {
      const r = sitTypeRef.current.getBoundingClientRect();
      const center = r.left + r.width / 2 - cRect.left;
      return Math.max(0, center - popW / 2);
    }
    if (name === 'radius' && radiusRef.current) {
      const r = radiusRef.current.getBoundingClientRect();
      return Math.min(cRect.width - popW, r.right - cRect.left - popW);
    }
    return 0;
  }, []);

  // On first open: position synchronously before browser paint (no visible jump)
  useLayoutEffect(() => {
    if (!panel || isSliding || !popoverRef.current) return;
    setPopLeft(getLeft(panel));
  }, [panel, isSliding, getLeft]);

  const closePanel = useCallback(() => {
    clearTimeout(closeTimer.current);
    setPanelClosing(true);
    setIsSliding(false);
    closeTimer.current = setTimeout(() => {
      setPanel(null);
      setPanelClosing(false);
    }, CLOSE_DURATION);
  }, []);

  const switchPanel = useCallback((name) => {
    clearTimeout(closeTimer.current);

    // Same panel tapped → close
    if (panel === name && !panelClosing) {
      closePanel();
      return;
    }

    // Slide: panel already open, switching to a different one
    if (panel !== null && !panelClosing) {
      const el = popoverRef.current;

      // Switch content, then slide left position to new panel
      setPanel(name);
      setIsSliding(true);

      requestAnimationFrame(() => {
        const newLeft = getLeft(name);

        el.style.transition = 'left 0.38s cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.left       = `${newLeft}px`;

        setPopLeft(newLeft);
        setTimeout(() => {
          el.style.transition = '';
          setIsSliding(false);
        }, 420);
      });
      return;
    }

    // Fresh open (panel was null or was closing)
    setPanelClosing(false);
    setIsSliding(false);
    setPanel(name);
    // useLayoutEffect handles positioning before paint
  }, [panel, panelClosing, closePanel, getLeft]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // Detect sticky "stuck" state via sentinel above the bar
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!panel && !panelClosing) return;
    const onDown = (e) => {
      if (innerRef.current && !innerRef.current.contains(e.target)) closePanel();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [panel, panelClosing, closePanel]);

  const RADIUS_OPTIONS = [5, 10, 25, 50];

  const datesValue = startDate && endDate
    ? `${formatMonthDay(startDate)} – ${formatMonthDay(endDate)}`
    : startDate
    ? `${formatMonthDay(startDate)} – ?`
    : locale === 'de' ? 'Datum wählen' : 'Choose dates you need sitting';

  return (
    <>
    <div ref={sentinelRef} style={{ height: 0 }} />
    <div className={`${styles.filterBarWrap}${stuck ? ` ${styles.filterBarWrapStuck}` : ''}`}>
      <div className={styles.filterBarInner} ref={innerRef}>
        <div className={styles.filterBar}>

          <button
            ref={datesRef}
            type="button"
            className={`${styles.filterSection} ${panel === 'dates' ? styles.filterSectionActive : ''}`}
            onClick={() => switchPanel('dates')}
          >
            <div className={styles.filterIcon}><CalendarIcon /></div>
            <div className={styles.filterTextGroup}>
              <span className={styles.filterLabel}>{locale === 'de' ? 'Datum' : 'Dates'}</span>
            </div>
          </button>

          <div className={styles.filterDivider} />

          <button
            ref={sitTypeRef}
            type="button"
            className={`${styles.filterSection} ${panel === 'sitType' || sitType ? styles.filterSectionActive : ''}`}
            onClick={() => switchPanel('sitType')}
          >
            <div className={styles.filterIcon}><SitTypeIcon /></div>
            <div className={styles.filterTextGroup}>
              <span className={styles.filterLabel}>{locale === 'de' ? 'Art' : 'Sit type'}</span>
            </div>
          </button>

          <div className={styles.filterDivider} />

          <button
            ref={radiusRef}
            type="button"
            className={`${styles.filterSection} ${panel === 'radius' ? styles.filterSectionActive : ''} ${!hasLocation ? styles.filterSectionDim : ''}`}
            onClick={() => hasLocation && switchPanel('radius')}
            title={!hasLocation ? 'Add your location in your profile to enable radius filtering' : undefined}
          >
            <div className={styles.filterIcon}><PinIcon /></div>
            <div className={styles.filterTextGroup}>
              <span className={styles.filterLabel}>{locale === 'de' ? 'Radius' : 'Radius'}</span>
            </div>
          </button>

          {loading && <div className={styles.filterBarLoadingOverlay} />}
        </div>

        {/* Single sliding panel — mounts on first open (plays unfurl), slides on switch */}
        {(panel !== null || panelClosing) && (
          <div
            ref={popoverRef}
            className={`${styles.filterPopover}${panelClosing ? ` ${styles.filterPopoverClosing}` : ''}`}
            style={{ left: popLeft }}
          >
            {panel === 'dates' && (
              <>
                <p className={styles.filterPopoverTitle}>{locale === 'de' ? 'Reisedaten' : 'You are editing dates you need cat sitting help'}</p>
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  locale={locale}
                  onChange={({ startDate: s, endDate: e }) => {
                    onDatesChange(s, e);
                    if (s && e) closePanel();
                  }}
                  onClear={() => onDatesChange('', '')}
                />
              </>
            )}
            {panel === 'sitType' && (
              <>
                <p className={styles.filterPopoverTitle}>{locale === 'de' ? 'Art des Sittings' : 'What kind of sitting do you need?'}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { value: null,         label: locale === 'de' ? 'Alle'                                    : 'Any' },
                    { value: 'home_visit', label: locale === 'de' ? 'Hausbesuch — Sitter kommt zu dir'        : 'Home visits — sitter comes to you' },
                    { value: 'drop_off',   label: locale === 'de' ? 'Abgabe — du bringst deine Katze zum Sitter' : 'Drop off — you bring your cat to the sitter' },
                  ].map(({ value, label }) => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => { onSitTypeChange(value); closePanel(); }}
                      style={{
                        textAlign: 'left', padding: '0.6rem 0.75rem', borderRadius: 8, cursor: 'pointer',
                        fontSize: '0.875rem', fontFamily: 'inherit',
                        border:      sitType === value ? '1.5px solid #2C5F4F' : '1.5px solid #e5e7eb',
                        background:  sitType === value ? '#EAF3DE' : '#fafafa',
                        color:       sitType === value ? '#2C5F4F' : '#555',
                        fontWeight:  sitType === value ? 600 : 400,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {panel === 'radius' && (
              <>
                <p className={styles.filterPopoverTitle}>{locale === 'de' ? 'Suchradius' : 'Search radius'}</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {RADIUS_OPTIONS.map((km) => (
                    <button
                      key={km}
                      type="button"
                      onClick={() => { onRadiusChange(km); closePanel(); }}
                      style={{
                        padding: '0.45rem 1rem', borderRadius: 20,
                        fontSize: '0.875rem', fontFamily: 'inherit',
                        fontWeight: radius === km ? 700 : 500,
                        cursor: 'pointer',
                        border:     radius === km ? '1.5px solid #2C5F4F' : '1.5px solid #e5e7eb',
                        background: radius === km ? '#EAF3DE' : '#fafafa',
                        color:      radius === km ? '#2C5F4F' : '#555',
                        transition: 'all 0.12s',
                      }}
                    >
                      {km} km
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
