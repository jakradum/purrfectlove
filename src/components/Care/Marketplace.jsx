'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import styles from './Care.module.css';
import SitterCard from './SitterCard';
import FilterBar from './FilterBar';
import contentEN from '@/data/careContent.en.json';
import contentDE from '@/data/careContent.de.json';

const STORAGE_KEY = 'care_marketplace_state';
const SHIMMER_MIN_MS = 400;
const SLIDER_DEBOUNCE_MS = 150;

// Haversine distance in km
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Road-distance multiplier
function roadMultiplier(lat) {
  if (lat != null && lat > 8 && lat < 20) return 1.66;
  return 1.66;
}

// Whether a sitter has configured any availability data
function hasAvailabilityData(sitter) {
  if (sitter.availabilityDefault) return true;
  if (Array.isArray(sitter.unavailableDatesV2)) return true;
  return sitter.alwaysAvailable === true || (sitter.availableDates || []).length > 0;
}

// Build an array of YYYY-MM-DD strings between start and end (inclusive)
function dateRange(startISO, endISO) {
  const dates = [];
  const cur = new Date(startISO);
  const stop = new Date(endISO);
  while (cur <= stop) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// Check if a sitter is available for a date range
function isAvailableForDates(sitter, startDate, endDate) {
  if (!startDate || !endDate) return true;

  if (sitter.availabilityDefault || Array.isArray(sitter.unavailableDatesV2)) {
    const requested = dateRange(startDate, endDate);
    const marked = new Set(sitter.unavailableDatesV2 || []);

    if (sitter.availabilityDefault === 'unavailable') {
      return requested.every(d => marked.has(d));
    } else {
      return !requested.some(d => marked.has(d));
    }
  }

  // Legacy system
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (sitter.alwaysAvailable) {
    const ranges = sitter.unavailableRanges || [];
    for (const r of ranges) {
      if (!r.start || !r.end) continue;
      if (new Date(r.start) <= end && new Date(r.end) >= start) return false;
    }
    for (const d of (sitter.unavailableDates || [])) {
      const date = new Date(d);
      if (date >= start && date <= end) return false;
    }
    return true;
  }

  const ranges = sitter.availableDates || [];
  if (ranges.length === 0) return true;
  for (const range of ranges) {
    const rangeStart = range.start ? new Date(range.start) : null;
    const rangeEnd = range.end ? new Date(range.end) : null;
    if (!rangeStart || !rangeEnd) continue;
    if (rangeStart <= end && rangeEnd >= start) return true;
  }
  return false;
}

// Format "Apr 3 – 6" or "Apr 3 – May 1"
function formatDateRange(s, e) {
  if (!s || !e) return '';
  const [sy, sm, sd] = s.split('-').map(Number);
  const [ey, em, ed] = e.split('-').map(Number);
  const startFmt = new Date(sy, sm - 1, sd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endFmt = sm === em
    ? new Date(ey, em - 1, ed).toLocaleDateString('en-US', { day: 'numeric' })
    : new Date(ey, em - 1, ed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startFmt} – ${endFmt}`;
}

function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonAvatar} />
        <div className={styles.skeletonHeaderText}>
          <div className={styles.skeletonLine} style={{ height: '14px', width: '60%' }} />
          <div className={styles.skeletonLine} style={{ height: '11px', width: '35%' }} />
        </div>
      </div>
      <div className={styles.skeletonLine} style={{ height: '11px', width: '90%' }} />
      <div className={styles.skeletonLine} style={{ height: '11px', width: '75%' }} />
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
        <div className={styles.skeletonLine} style={{ height: '24px', width: '64px', borderRadius: '20px' }} />
        <div className={styles.skeletonLine} style={{ height: '24px', width: '64px', borderRadius: '20px' }} />
      </div>
      <div className={styles.skeletonActions}>
        <div className={styles.skeletonBtn} />
        <div className={styles.skeletonBtn} />
      </div>
    </div>
  );
}

export default function Marketplace({ initialCanSit, initialNeedsSitting, userLocation, locale: localeProp, userAvailabilityDefault = 'available', userMarkedDates = [] }) {
  const locale = localeProp || 'en';
  const t = locale === 'de' ? contentDE.marketplace : contentEN.marketplace;

  // Stateful — user can toggle from marketplace; PATCHed to profile API
  const [canSit, setCanSit] = useState(initialCanSit);
  const [needsSitting, setNeedsSitting] = useState(initialNeedsSitting);

  const handleToggle = async (field, value) => {
    const newCanSit = field === 'canSit' ? value : canSit;
    const newNeedsSitting = field === 'needsSitting' ? value : needsSitting;
    setCanSit(newCanSit);
    setNeedsSitting(newNeedsSitting);
    try {
      await fetch('/api/care/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canSit: newCanSit, needsSitting: newNeedsSitting }),
      });
    } catch (err) {
      console.error('Failed to update status:', err);
      setCanSit(initialCanSit);
      setNeedsSitting(initialNeedsSitting);
    }
  };

  // Fresh availability data for conflict banner
  const [ownAvailDefault, setOwnAvailDefault] = useState(userAvailabilityDefault);
  const [ownMarkedDates, setOwnMarkedDates] = useState(userMarkedDates);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [radius, setRadius] = useState(10);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [fetchedSitters, setFetchedSitters] = useState([]);
  const [shimmer, setShimmer] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(null);
  const [visibleCount, setVisibleCount] = useState(0);

  const animFrameRef = useRef(null);
  const gridContainerRef = useRef(null);
  const heightTweenRef = useRef(null);
  const sliderDebounceRef = useRef(null);
  const pendingRadiusRef = useRef(radius);
  const lastResultCountRef = useRef(1);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      if (saved) {
        if (saved.startDate) setStartDate(saved.startDate);
        if (saved.endDate) setEndDate(saved.endDate);
        if (saved.radius) setRadius(saved.radius);
        if (saved.fetchedSitters?.length) {
          let sitters = saved.fetchedSitters;
          if (userLocation?.lat != null && userLocation?.lng != null) {
            sitters = sitters.map((s) => {
              if (s.location?.lat == null || s.location?.lng == null) return s;
              return { ...s, _distance: haversine(userLocation.lat, userLocation.lng, s.location.lat, s.location.lng) * roadMultiplier(userLocation.lat) };
            });
          }
          setFetchedSitters(sitters);
          setSearched(true);
          setVisibleCount(sitters.length);
        }
      }
    } catch { /* sessionStorage unavailable */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to sessionStorage
  useEffect(() => {
    if (!searched) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ startDate, endDate, radius, fetchedSitters }));
    } catch { /* ignore */ }
  }, [startDate, endDate, radius, fetchedSitters, searched]);

  // Tween container height
  const animateHeight = useCallback(() => {
    const el = gridContainerRef.current;
    if (!el) return;
    const from = el.offsetHeight;
    const to = el.scrollHeight;
    if (from === to) return;
    el.style.height = `${from}px`;
    void el.offsetHeight;
    el.style.height = `${to}px`;
    if (heightTweenRef.current) clearTimeout(heightTweenRef.current);
    heightTweenRef.current = setTimeout(() => {
      if (gridContainerRef.current) gridContainerRef.current.style.height = 'auto';
    }, 310);
  }, []);

  // Pop-in animation: reveal cards one by one
  function animateCards(count) {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setVisibleCount(0);
    let i = 0;
    const step = () => {
      i++;
      setVisibleCount(i);
      if (i < count) animFrameRef.current = requestAnimationFrame(step);
    };
    animFrameRef.current = requestAnimationFrame(step);
  }

  // Radius change with shimmer (debounced)
  const handleRadiusChange = useCallback((newRadius) => {
    pendingRadiusRef.current = newRadius;
    if (sliderDebounceRef.current) clearTimeout(sliderDebounceRef.current);
    sliderDebounceRef.current = setTimeout(() => {
      const r = pendingRadiusRef.current;
      if (!searched) { setRadius(r); return; }
      const shimmerStart = Date.now();
      setShimmer(true);
      setTimeout(() => {
        setRadius(r);
        const elapsed = Date.now() - shimmerStart;
        setTimeout(() => setShimmer(false), Math.max(0, SHIMMER_MIN_MS - elapsed));
      }, 0);
    }, SLIDER_DEBOUNCE_MS);
    setRadius(newRadius);
  }, [searched]);

  // Fetch own profile when dates change (conflict banner)
  useEffect(() => {
    if (!startDate || !endDate) return;
    fetch('/api/care/profile')
      .then(r => r.json())
      .then(doc => {
        setOwnAvailDefault(doc.availabilityDefault || 'available');
        setOwnMarkedDates(doc.unavailableDatesV2 || []);
      })
      .catch(() => {});
  }, [startDate, endDate]);

  // Auto-search when both dates selected
  const prevDatesRef = useRef({ startDate: '', endDate: '' });
  useEffect(() => {
    const prev = prevDatesRef.current;
    prevDatesRef.current = { startDate, endDate };
    if (startDate && endDate) {
      if (prev.startDate !== startDate || prev.endDate !== endDate) {
        handleSearch();
      }
    } else if (!startDate || !endDate) {
      setSearched(false);
      setFetchedSitters([]);
      setDisplayedCount(null);
    }
  }, [startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async () => {
    setSearching(true);
    setSearched(true);
    setSearchError('');
    setFetchedSitters([]);
    setVisibleCount(0);
    setShimmer(false);

    try {
      const res = await fetch('/api/care/sitters?type=canSit');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSearchError(`API error ${res.status}: ${err.error || 'unknown'}`);
        return;
      }
      let sitters = await res.json();
      if (userLocation?.lat != null && userLocation?.lng != null) {
        sitters = sitters.map((s) => {
          if (s.location?.lat == null || s.location?.lng == null) return s;
          return { ...s, _distance: haversine(userLocation.lat, userLocation.lng, s.location.lat, s.location.lng) * roadMultiplier(userLocation.lat) };
        });
      }
      const filtered = sitters
        .filter((s) => isAvailableForDates(s, startDate, endDate))
        .map((s) => ({ ...s, _availabilityUnconfirmed: !hasAvailabilityData(s) }));
      setFetchedSitters(filtered);
      animateCards(filtered.length);
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Network error. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // Filter strictly to the chosen radius — no silent expansion
  const results = useMemo(() => {
    if (!searched) return null;
    return fetchedSitters
      .filter((s) => s._distance == null || s._distance <= radius)
      .sort((a, b) => (a._distance ?? 999) - (b._distance ?? 999));
  }, [searched, fetchedSitters, radius]);

  // Update displayed count + trigger height animation when shimmer ends
  useEffect(() => {
    if (!shimmer && results !== null) {
      lastResultCountRef.current = results.length || 1;
      setDisplayedCount(results.length);
      requestAnimationFrame(() => animateHeight());
    }
  }, [shimmer, results, animateHeight]);

  useEffect(() => {
    if (!searching && searched && results !== null && !shimmer) {
      lastResultCountRef.current = results.length || 1;
      setDisplayedCount(results.length);
      requestAnimationFrame(() => animateHeight());
    }
  }, [searching]); // eslint-disable-line react-hooks/exhaustive-deps

  const datesSelected = !!(startDate && endDate);

  // Conflict banner: shown if user is both a sitter and a seeker, and their availability overlaps
  const showConflictBanner = datesSelected && canSit && needsSitting && (() => {
    const requested = dateRange(startDate, endDate);
    const marked = new Set(ownMarkedDates || []);
    if (ownAvailDefault === 'unavailable') {
      return requested.some(d => marked.has(d));
    } else {
      return requested.some(d => !marked.has(d));
    }
  })();

  return (
    <div className={styles.pageWide}>
      <div className={styles.marketplaceHeader}>
        <h1 className={styles.pageTitle}>{t.title}</h1>
        <p className={styles.pageSubtitle}>{t.subtitle}</p>
      </div>

      {/* Status toggles — placed above filter bar */}
      <div className={styles.statusCard}>
        <span className={styles.statusCardTitle}>{t.myStatus}</span>
        <div className={styles.toggleRow}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={canSit}
              onChange={(e) => handleToggle('canSit', e.target.checked)}
            />
            <span className={styles.toggleSlider} />
          </label>
          <span className={styles.toggleLabel}>{t.iCanSit}</span>
        </div>
        <div className={styles.toggleRow}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={needsSitting}
              onChange={(e) => handleToggle('needsSitting', e.target.checked)}
            />
            <span className={styles.toggleSlider} />
          </label>
          <span className={styles.toggleLabel}>{t.iNeedSitting}</span>
        </div>
      </div>

      <FilterBar
        startDate={startDate}
        endDate={endDate}
        radius={radius}
        onDatesChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        onRadiusChange={handleRadiusChange}
        hasLocation={userLocation?.lat != null}
        locale={locale}
      />

      {/* Conflict banner */}
      {showConflictBanner && (
        <div className={styles.conflictBanner}>
          <span>⚠️</span>
          <span>
            You&apos;re marked as available to sit on some of these dates.{' '}
            <a href="/profile#availability" className={styles.conflictBannerLink}>Update your availability</a>
            {' '}if your plans have changed.
          </span>
        </div>
      )}

      {/* Empty state — no dates selected */}
      {!datesSelected && !searching && (
        <div className={styles.datesEmptyState}>
          <div className={styles.datesEmptyIcon}>🗓️</div>
          <h2 className={styles.datesEmptyHeading}>
            {locale === 'de' ? 'Wann brauchst du eine Betreuung?' : 'When do you need a sitter?'}
          </h2>
          <p className={styles.datesEmptyText}>
            {locale === 'de'
              ? 'Wähle deine Daten aus, um zu sehen, wer verfügbar ist.'
              : 'Pick your dates above to see who\'s available.'}
          </p>
        </div>
      )}

      {/* Results area */}
      {(datesSelected || searching) && (
        <div className={styles.resultsWrapper}>
          {/* Results header */}
          {!searching && !shimmer && displayedCount !== null && displayedCount > 0 && (
            <div className={styles.resultsHeader}>
              <span className={styles.resultsHeaderText}>
                Showing {displayedCount} sitter{displayedCount !== 1 ? 's' : ''} for {formatDateRange(startDate, endDate)}
              </span>
            </div>
          )}

          {/* Animated height wrapper */}
          <div ref={gridContainerRef} className={styles.resultsAnimated}>
            {searching ? (
              <div className={styles.searchingSpinner}>
                <span className={styles.spinner} />
              </div>
            ) : searchError ? (
              <div className={styles.datesEmptyState}>
                <div className={styles.datesEmptyIcon}>⚠️</div>
                <h2 className={styles.datesEmptyHeading} style={{ color: '#b91c1c' }}>Something went wrong</h2>
                <p className={styles.datesEmptyText}>We couldn&apos;t load results. Please check your connection and try again.</p>
                <button
                  type="button"
                  onClick={handleSearch}
                  style={{ marginTop: '1rem', padding: '0.5rem 1.25rem', background: 'var(--hunter-green)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-outfit)' }}
                >
                  Try again
                </button>
              </div>
            ) : shimmer ? (
              <div className={styles.sitterGrid}>
                {Array.from({ length: lastResultCountRef.current }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : results !== null && results.length === 0 ? (
              <div className={styles.datesEmptyState}>
                <div className={styles.datesEmptyIcon}>🐾</div>
                <h2 className={styles.datesEmptyHeading}>No one found nearby</h2>
                <p className={styles.datesEmptyText}>
                  {locale === 'de'
                    ? `Keine Sitter innerhalb von ${radius} km gefunden. Versuche einen größeren Radius.`
                    : `No sitters found within ${radius} km for these dates. Try increasing the radius.`}
                </p>
              </div>
            ) : results !== null ? (
              <div className={styles.sitterGrid}>
                {results.map((sitter, i) => (
                  <div
                    key={sitter._id}
                    className={styles.cardPopIn}
                    style={{
                      opacity: i < visibleCount ? 1 : 0,
                      transform: i < visibleCount ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
                      transition: 'opacity 0.25s ease, transform 0.25s ease',
                    }}
                  >
                    <SitterCard
                      sitter={sitter}
                      type="findSitters"
                      locale={locale}
                      availabilityUnconfirmed={!!sitter._availabilityUnconfirmed}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
