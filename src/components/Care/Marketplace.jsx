'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from './Care.module.css';
import SitterCard from './SitterCard';
import contentEN from '@/data/careContent.en.json';
import contentDE from '@/data/careContent.de.json';

const STORAGE_KEY = 'care_marketplace_state';
const SHIMMER_MIN_MS = 400;
const SLIDER_DEBOUNCE_MS = 150;
// Number of skeleton cards to show while loading
const SKELETON_COUNT = 4;

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

// Road-distance multiplier based on user's city
// Bangalore: 1.5 (dense grid with traffic), Stuttgart: 1.3 (more direct roads)
function roadMultiplier(lat) {
  if (lat != null && lat > 8 && lat < 20) return 1.5; // India / Bangalore latitude band
  return 1.3; // Europe default
}

// Check if a sitter is available for a date range
function isAvailableForDates(sitter, startDate, endDate) {
  if (!startDate && !endDate) return true;

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (sitter.alwaysAvailable) {
    if (!start || !end) return true;
    const unavail = sitter.unavailableDates || [];
    for (const d of unavail) {
      const date = new Date(d);
      if (date >= start && date <= end) return false;
    }
    return true;
  }

  // If sitter hasn't configured any availability dates, show them regardless of date filter
  const ranges = sitter.availableDates || [];
  if (ranges.length === 0) return true;

  for (const range of ranges) {
    const rangeStart = range.start ? new Date(range.start) : null;
    const rangeEnd = range.end ? new Date(range.end) : null;
    if (!rangeStart || !rangeEnd) continue;
    const overlapStart = !start || rangeStart <= end;
    const overlapEnd = !end || rangeEnd >= start;
    if (overlapStart && overlapEnd) return true;
  }
  return false;
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

export default function Marketplace({ initialCanSit, initialNeedsSitting, userName, userLocation, locale: localeProp }) {
  const locale = localeProp || 'en';
  const t = locale === 'de' ? contentDE.marketplace : contentEN.marketplace;

  const [canSit, setCanSit] = useState(initialCanSit);
  const [needsSitting, setNeedsSitting] = useState(initialNeedsSitting);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [radius, setRadius] = useState(25);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [resultsStale, setResultsStale] = useState(false);
  const [fetchedSitters, setFetchedSitters] = useState([]);
  const [shimmer, setShimmer] = useState(false); // true = show skeleton instead of cards
  const [displayedCount, setDisplayedCount] = useState(null); // count shown in header, updates after shimmer

  // Track which card indices have been revealed for the pop-in animation
  const [visibleCount, setVisibleCount] = useState(0);
  const animFrameRef = useRef(null);

  // Animated container height
  const gridContainerRef = useRef(null);
  const heightTweenRef = useRef(null);

  // Debounce slider
  const sliderDebounceRef = useRef(null);
  const pendingRadiusRef = useRef(radius);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    console.log('[Marketplace] userLocation:', userLocation);
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      if (saved) {
        if (saved.startDate) setStartDate(saved.startDate);
        if (saved.endDate) setEndDate(saved.endDate);
        if (saved.radius) setRadius(saved.radius);
        if (saved.fetchedSitters?.length) {
          // Re-apply distances in case they weren't calculated when originally cached
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
  }, []);

  // Persist state to sessionStorage whenever search results or filters change
  useEffect(() => {
    if (!searched) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        startDate, endDate, radius, fetchedSitters,
      }));
    } catch { /* ignore */ }
  }, [startDate, endDate, radius, fetchedSitters, searched]);

  // Tween container height to scrollHeight, then reset to auto
  const animateHeight = useCallback(() => {
    const el = gridContainerRef.current;
    if (!el) return;
    const from = el.offsetHeight;
    const to = el.scrollHeight;
    if (from === to) return;
    el.style.height = `${from}px`;
    // force reflow
    void el.offsetHeight;
    el.style.height = `${to}px`;
    if (heightTweenRef.current) clearTimeout(heightTweenRef.current);
    heightTweenRef.current = setTimeout(() => {
      if (gridContainerRef.current) gridContainerRef.current.style.height = 'auto';
    }, 310); // slightly after 300ms transition
  }, []);

  // Pop-in animation: reveal cards one by one when results arrive
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

  // Slider change: debounce, show shimmer, update radius, then reveal cards
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
        const remaining = Math.max(0, SHIMMER_MIN_MS - elapsed);
        setTimeout(() => {
          setShimmer(false);
        }, remaining);
      }, 0);
    }, SLIDER_DEBOUNCE_MS);
    // Update display immediately for responsive feel
    setRadius(newRadius);
  }, [searched]);

  const handleToggle = async (field, value) => {
    const newCanSit = field === 'canSit' ? value : (value ? false : canSit);
    const newNeedsSitting = field === 'needsSitting' ? value : (value ? false : needsSitting);

    setCanSit(newCanSit);
    setNeedsSitting(newNeedsSitting);
    if (searched) setResultsStale(true);
    else { setFetchedSitters([]); setSearched(false); }

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

  const handleSearch = async () => {
    setSearching(true);
    setSearched(true);
    setSearchError('');
    setResultsStale(false);
    setFetchedSitters([]);
    setVisibleCount(0);
    setShimmer(false);

    try {
      const res = await fetch(`/api/care/sitters?type=${apiQueryType}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = `API error ${res.status}: ${err.error || 'unknown'}`;
        setSearchError(msg);
        setDebugInfo(`type=${apiQueryType} status=${res.status}`);
        return;
      }

      let sitters = await res.json();
      const rawCount = sitters.length;
      if (userLocation?.lat != null && userLocation?.lng != null) {
        sitters = sitters.map((s) => {
          if (s.location?.lat == null || s.location?.lng == null) return s;
          return { ...s, _distance: haversine(userLocation.lat, userLocation.lng, s.location.lat, s.location.lng) * roadMultiplier(userLocation.lat) };
        });
      }
      const filtered = sitters.filter((s) => isAvailableForDates(s, startDate, endDate));
      setDebugInfo(`type=${apiQueryType} | API: ${rawCount} | date-filtered: ${filtered.length} | loc: ${userLocation ? `${userLocation.lat?.toFixed(2)},${userLocation.lng?.toFixed(2)}` : 'none'} | dates: "${startDate}"→"${endDate}"`);
      setFetchedSitters(filtered);
      animateCards(filtered.length);
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Network error. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const results = useMemo(() => {
    if (!searched) return null;
    return fetchedSitters
      .filter((s) => s._distance == null || s._distance <= radius)
      .sort((a, b) => (a._distance ?? 999) - (b._distance ?? 999));
  }, [searched, fetchedSitters, radius]);

  // Update displayed count + trigger height animation when shimmer ends
  useEffect(() => {
    if (!shimmer && results !== null) {
      setDisplayedCount(results.length);
      // Defer so the DOM has rendered the new cards before we measure
      requestAnimationFrame(() => animateHeight());
    }
  }, [shimmer, results, animateHeight]);

  // Also animate height on initial search complete
  useEffect(() => {
    if (!searching && searched && results !== null && !shimmer) {
      setDisplayedCount(results.length);
      requestAnimationFrame(() => animateHeight());
    }
  }, [searching]); // eslint-disable-line react-hooks/exhaustive-deps

  const apiQueryType = canSit ? 'needsSitting' : 'canSit';
  const currentType = canSit ? 'offerToSit' : 'findSitters';

  const noResultsText =
    currentType === 'findSitters'
      ? t.noResults.replace('{radius}', radius)
      : t.noNeedResults.replace('{radius}', radius);

  return (
    <div className={styles.pageWide}>
      <div className={styles.marketplaceHeader}>
        <h1 className={styles.pageTitle}>{t.title}</h1>
        <p className={styles.pageSubtitle}>{t.subtitle}</p>
      </div>

      {/* My Status card */}
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
        <Link href="/profile" style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--hunter-green)' }}>
          Edit profile →
        </Link>
      </div>

      {!canSit && !needsSitting ? (
        <div className={styles.statusPrompt}>
          <p className={styles.statusPromptTitle}>Enable a status to get started</p>
          <p className={styles.statusPromptText}>
            Toggle &quot;I can sit&quot; above to find cats that need a sitter, or &quot;I need sitting&quot; to find sitters for your cats. You cannot enable both at the same time.
          </p>
          {!userName && (
            <Link href="/profile" className={styles.profileLink}>
              Complete your profile first
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Search bar */}
          <div className={styles.searchBar}>
            <div className={styles.searchField}>
              <label className={styles.searchLabel}>{t.search.datesLabel} (from)</label>
              <input
                type="date"
                className={styles.searchInput}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className={styles.searchField}>
              <label className={styles.searchLabel}>{t.search.datesLabel} (to)</label>
              <input
                type="date"
                className={styles.searchInput}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {userLocation?.lat != null ? (
              <div className={styles.searchField}>
                <label className={styles.searchLabel}>
                  {t.search.radiusLabel}: {radius} {t.search.radiusUnit}
                </label>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={radius}
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                  className={styles.squigglySlider}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                  Move slider to adjust search area · Your location: {userLocation.name || 'your location'}
                </span>
              </div>
            ) : (
              <div className={styles.searchField}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                  <a href="/profile" style={{ color: 'var(--hunter-green)' }}>Add your location</a> to enable distance filtering
                </span>
              </div>
            )}
            <button className={styles.searchBtn} onClick={handleSearch} disabled={searching}>
              {searching ? <span className={styles.spinner} /> : t.search.search}
            </button>
          </div>
          {debugInfo && (
            <p style={{ fontSize: '0.72rem', color: '#888', marginTop: '0.5rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {debugInfo}
            </p>
          )}

          {/* Results */}
          {searched && (
            <div className={styles.resultsWrapper}>
              {resultsStale && (
                <div className={styles.resultsStaleOverlay}>
                  <span className={styles.staleMsg}>Your status changed — search again to update results</span>
                  <button className={styles.searchBtn} onClick={handleSearch} disabled={searching}>
                    {searching ? '...' : 'Search again'}
                  </button>
                </div>
              )}

              {/* Count line — fixed height so it never causes a jump */}
              <div className={styles.resultsCount}>
                {!searching && !shimmer && displayedCount !== null && displayedCount > 0 && (
                  `Showing ${displayedCount} ${currentType === 'findSitters' ? 'sitter' : 'member'}${displayedCount !== 1 ? 's' : ''} within ${radius} km`
                )}
              </div>

              {/* Animated height wrapper */}
              <div ref={gridContainerRef} className={styles.resultsAnimated}>
                {searching ? (
                  <div className={styles.searchingSpinner}>
                    <span className={styles.spinner} />
                  </div>
                ) : searchError ? (
                  <div className={styles.noResults} style={{ color: '#ef4444' }}>{searchError}</div>
                ) : shimmer ? (
                  <div className={styles.sitterGrid}>
                    {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : results !== null && results.length === 0 ? (
                  <div className={styles.noResults}>{noResultsText}</div>
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
                        <SitterCard sitter={sitter} type={currentType} locale={locale} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
