'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
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

  // Exclude if any requested date is auto-blocked by an accepted booking
  if (Array.isArray(sitter.blockedByBooking) && sitter.blockedByBooking.length > 0) {
    const requested = dateRange(startDate, endDate);
    const blocked = new Set(sitter.blockedByBooking);
    if (requested.some(d => blocked.has(d))) return false;
  }

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

export default function Marketplace({ userLocation, sitterId, locale: localeProp }) {
  const locale = localeProp || 'en';
  const t = locale === 'de' ? contentDE.marketplace : contentEN.marketplace;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [radius, setRadius] = useState(10);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [fetchedSitters, setFetchedSitters] = useState([]);
  const [shimmer, setShimmer] = useState(false);
  // myBookings: { [sitterId__startDate__endDate]: { status, bookingRef } }
  // Keyed by sitter+dates so state resets naturally when dates change.
  const [myBookings, setMyBookings] = useState({});
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [displayedCount, setDisplayedCount] = useState(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [toast, setToast] = useState(null); // { message, id }

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

  // Fetch the current user's pending/accepted bookings once on mount.
  // Used to derive per-card booking button state.
  useEffect(() => {
    fetch('/api/care/bookings/my')
      .then(r => r.ok ? r.json() : { bookings: [] })
      .then(({ bookings }) => {
        const map = {};
        for (const b of (bookings || [])) {
          const key = `${b.sitterId}__${b.startDate}__${b.endDate}`;
          map[key] = { status: b.status, bookingRef: b.bookingRef };
        }
        setMyBookings(map);
      })
      .catch(() => {/* silent — cards fall back to bookable state */});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss toast after 4 s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Supabase Realtime: watch for booking status changes where current user is the parent.
  // Replaces the 15-second polling interval.
  useEffect(() => {
    if (!sitterId) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const channel = supabase
      .channel(`marketplace-bookings-${sitterId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `parent_id=eq.${sitterId}` },
        (payload) => {
          const row = payload.new;
          const key = `${row.sitter_id}__${row.start_date}__${row.end_date}`;
          if (row.status === 'confirmed' || row.status === 'accepted') {
            setMyBookings(prev => ({
              ...prev,
              [key]: { status: 'confirmed', bookingRef: row.booking_ref },
            }));
          } else if (row.status === 'declined' || row.status === 'unavailable' || row.status === 'cancelled') {
            setMyBookings(prev => {
              const next = { ...prev };
              delete next[key];
              return next;
            });
            setToast({ message: 'Your booking request was declined', id: Date.now() });
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [sitterId]);

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
      const res = await fetch('/api/care/sitters');
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

  // Three-tier sort:
  //   1. Availability confirmed (unconfirmed last)
  //   2. Distance ascending (no location last)
  //   3. Rating descending (null last — field reserved for future use)
  const results = useMemo(() => {
    if (!searched) return null;
    return fetchedSitters
      .filter((s) => s._distance == null || s._distance <= radius)
      .sort((a, b) => {
        // Tier 1: confirmed availability first
        const aUnconfirmed = a._availabilityUnconfirmed ? 1 : 0;
        const bUnconfirmed = b._availabilityUnconfirmed ? 1 : 0;
        if (aUnconfirmed !== bUnconfirmed) return aUnconfirmed - bUnconfirmed;

        // Tier 2: distance ascending, nulls last
        const aDist = a._distance ?? Infinity;
        const bDist = b._distance ?? Infinity;
        if (aDist !== bDist) return aDist - bDist;

        // Tier 3: rating descending, nulls last
        const aRating = a.rating ?? -Infinity;
        const bRating = b.rating ?? -Infinity;
        return bRating - aRating;
      });
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

  return (
    <div className={styles.pageWide}>
      <div className={styles.marketplaceHeader}>
        <h1 className={styles.pageTitle}>{t.title}</h1>
        <p className={styles.pageSubtitle}>{t.subtitle}</p>
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
                {displayedCount} sitter{displayedCount !== 1 ? 's' : ''} available for {formatDateRange(startDate, endDate)}
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
                <h2 className={styles.datesEmptyHeading}>No sitters found nearby</h2>
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
                      locale={locale}
                      availabilityUnconfirmed={!!sitter._availabilityUnconfirmed}
                      startDate={startDate}
                      endDate={endDate}
                      bookingState={myBookings[`${sitter._id}__${startDate}__${endDate}`] ?? null}
                      onBooked={(bookingRef) => {
                        const key = `${sitter._id}__${startDate}__${endDate}`;
                        setMyBookings(prev => ({ ...prev, [key]: { status: 'pending', bookingRef } }));
                      }}
                      expanded={expandedCardId === sitter._id}
                      onExpand={() => setExpandedCardId(prev => prev === sitter._id ? null : sitter._id)}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {toast && (
        <div key={toast.id} className={styles.toast}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
