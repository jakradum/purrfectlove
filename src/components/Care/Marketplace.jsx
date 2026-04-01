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
// Bangalore: 1.66 (dense grid with traffic), Stuttgart: 1.66 (more direct roads)
function roadMultiplier(lat) {
  if (lat != null && lat > 8 && lat < 20) return 1.66; // India / Bangalore latitude band
  return 1.66; // Europe default
}

// Whether a sitter has configured any availability data
function hasAvailabilityData(sitter) {
  return sitter.alwaysAvailable === true || (sitter.availableDates || []).length > 0;
}

// Check if a sitter is available for a date range.
// Sitters with no availability data pass through (will get "unconfirmed" badge).
function isAvailableForDates(sitter, startDate, endDate) {
  if (!startDate || !endDate) return true;
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (sitter.alwaysAvailable) {
    // Check new range-based blocked periods
    const ranges = sitter.unavailableRanges || [];
    for (const r of ranges) {
      if (!r.start || !r.end) continue;
      const rStart = new Date(r.start);
      const rEnd = new Date(r.end);
      // Overlap: blocked range overlaps the requested dates
      if (rStart <= end && rEnd >= start) return false;
    }
    // Legacy single-date list fallback
    const unavail = sitter.unavailableDates || [];
    for (const d of unavail) {
      const date = new Date(d);
      if (date >= start && date <= end) return false;
    }
    return true;
  }

  const ranges = sitter.availableDates || [];
  // No availability data → include them (badge shown separately)
  if (ranges.length === 0) return true;

  for (const range of ranges) {
    const rangeStart = range.start ? new Date(range.start) : null;
    const rangeEnd = range.end ? new Date(range.end) : null;
    if (!rangeStart || !rangeEnd) continue;
    if (rangeStart <= end && rangeEnd >= start) return true;
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
  const [browseAsSitter, setBrowseAsSitter] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [radius, setRadius] = useState(10);
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

  // Last known result count for sizing the skeleton
  const lastResultCountRef = useRef(1);

  // Slider track fill
  const sliderRef = useRef(null);
  const updateSliderTrack = useCallback((val) => {
    const el = sliderRef.current;
    if (!el) return;
    const min = Number(el.min) || 1.5;
    const max = Number(el.max) || 20;
    const pct = ((val - min) / (max - min)) * 100;
    el.style.background = `linear-gradient(to right, var(--tabby-brown) ${pct}%, #d1d5db ${pct}%)`;
  }, []);

  // Keep track filled when radius changes
  useEffect(() => { updateSliderTrack(radius); }, [radius, updateSliderTrack]);

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

  // Browse mode: sitter-only users skip the date gate entirely
  // Also active when both flags are set and user explicitly chose "Browse as sitter"
  const isBrowseMode = (canSit && !needsSitting) || (canSit && needsSitting && browseAsSitter);

  // Auto-fetch in browse mode (no dates needed)
  const browseModeRef = useRef(false);
  useEffect(() => {
    const entering = isBrowseMode && !browseModeRef.current;
    browseModeRef.current = isBrowseMode;
    if (entering && (canSit || needsSitting)) {
      handleSearch();
    }
  }, [isBrowseMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-search when both dates selected; reset when dates cleared (seeker mode only)
  const prevDatesRef = useRef({ startDate: '', endDate: '' });
  useEffect(() => {
    if (isBrowseMode) return;
    const prev = prevDatesRef.current;
    prevDatesRef.current = { startDate, endDate };
    if (startDate && endDate && (canSit || needsSitting)) {
      // Only auto-search if a date actually changed (not on initial mount restore that already has results)
      if (prev.startDate !== startDate || prev.endDate !== endDate) {
        handleSearch();
      }
    } else if (!startDate || !endDate) {
      setSearched(false);
      setFetchedSitters([]);
      setDisplayedCount(null);
    }
  }, [startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const filtered = sitters
        .filter((s) => isAvailableForDates(s, startDate, endDate))
        .map((s) => ({ ...s, _availabilityUnconfirmed: !hasAvailabilityData(s) }));
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
      lastResultCountRef.current = results.length || 1;
      setDisplayedCount(results.length);
      requestAnimationFrame(() => animateHeight());
    }
  }, [shimmer, results, animateHeight]);

  // Also animate height on initial search complete
  useEffect(() => {
    if (!searching && searched && results !== null && !shimmer) {
      lastResultCountRef.current = results.length || 1;
      setDisplayedCount(results.length);
      requestAnimationFrame(() => animateHeight());
    }
  }, [searching]); // eslint-disable-line react-hooks/exhaustive-deps

  const datesSelected = !!(startDate && endDate);
  const apiQueryType = isBrowseMode ? 'needsSitting' : (canSit ? 'needsSitting' : 'canSit');
  const currentType = isBrowseMode ? 'offerToSit' : (canSit ? 'offerToSit' : 'findSitters');

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
            Toggle &quot;I can sit&quot; above to find cats that need a sitter, or &quot;I need sitting&quot; to find sitters for your cats.
          </p>
          {!userName && (
            <Link href="/profile" className={styles.profileLink}>
              Complete your profile first
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Browse-mode / seeker-mode toggle — only shown when both are true */}
          {canSit && needsSitting && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', background: 'rgba(44,95,79,0.06)', borderRadius: '10px', padding: '0.35rem', width: 'fit-content' }}>
              <button
                type="button"
                onClick={() => { setBrowseAsSitter(false); setSearched(false); setFetchedSitters([]); }}
                style={{
                  padding: '0.35rem 0.875rem', borderRadius: '7px', border: 'none', fontSize: '0.85rem', fontWeight: 600,
                  background: !browseAsSitter ? 'var(--hunter-green)' : 'transparent',
                  color: !browseAsSitter ? '#fff' : 'var(--hunter-green)',
                  cursor: 'pointer', fontFamily: 'var(--font-outfit)',
                }}
              >
                Find a sitter
              </button>
              <button
                type="button"
                onClick={() => setBrowseAsSitter(true)}
                style={{
                  padding: '0.35rem 0.875rem', borderRadius: '7px', border: 'none', fontSize: '0.85rem', fontWeight: 600,
                  background: browseAsSitter ? 'var(--hunter-green)' : 'transparent',
                  color: browseAsSitter ? '#fff' : 'var(--hunter-green)',
                  cursor: 'pointer', fontFamily: 'var(--font-outfit)',
                }}
              >
                Browse as sitter
              </button>
            </div>
          )}

          {/* Search bar — hidden in browse mode */}
          {!isBrowseMode && (
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
              {datesSelected && (
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.8rem', color: 'var(--text-light)', textDecoration: 'underline', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Clear dates
                  </button>
                </div>
              )}
              {userLocation?.lat != null ? (
                <div
                  className={styles.searchField}
                  title={!datesSelected ? 'Pick dates first' : undefined}
                >
                  <label className={styles.searchLabel} style={!datesSelected ? { opacity: 0.45 } : {}}>
                    {t.search.radiusLabel}: {radius} {t.search.radiusUnit}
                  </label>
                  <input
                    ref={sliderRef}
                    type="range"
                    min={1.5}
                    max={20}
                    step={0.5}
                    value={radius}
                    onChange={(e) => datesSelected && handleRadiusChange(Number(e.target.value))}
                    className={styles.squigglySlider}
                    disabled={!datesSelected}
                    style={!datesSelected ? { opacity: 0.35, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', opacity: !datesSelected ? 0.45 : 1 }}>
                    {!datesSelected
                      ? 'Pick dates first to filter by distance'
                      : `Move slider to adjust search area · ${userLocation.name || 'your location'}`}
                  </span>
                </div>
              ) : (
                <div className={styles.searchField}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                    <a href="/profile" style={{ color: 'var(--hunter-green)' }}>Add your location</a> to enable distance filtering
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Browse mode radius slider */}
          {isBrowseMode && userLocation?.lat != null && (
            <div className={styles.searchBar}>
              <div className={styles.searchField}>
                <label className={styles.searchLabel}>{t.search.radiusLabel}: {radius} {t.search.radiusUnit}</label>
                <input
                  ref={sliderRef}
                  type="range"
                  min={1.5}
                  max={20}
                  step={0.5}
                  value={radius}
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                  className={styles.squigglySlider}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                  {`Move slider to adjust search area · ${userLocation.name || 'your location'}`}
                </span>
              </div>
            </div>
          )}

          {/* Empty state — seeker mode only */}
          {!isBrowseMode && !datesSelected && !searching && (
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

          {/* Results — shown in browse mode always, or seeker mode once dates picked */}
          {(isBrowseMode || datesSelected || searching) && (
            <div className={styles.resultsWrapper}>
              {resultsStale && (
                <div className={styles.resultsStaleOverlay}>
                  <span className={styles.staleMsg}>Your status changed — </span>
                  <button className={styles.searchBtn} onClick={handleSearch} disabled={searching} style={{ display: 'inline', padding: '0', background: 'none', border: 'none', color: 'var(--hunter-green)', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}>
                    {searching ? '...' : 'search again'}
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
                    {Array.from({ length: lastResultCountRef.current }).map((_, i) => (
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
                        <SitterCard
                          sitter={sitter}
                          type={currentType}
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
        </>
      )}
    </div>
  );
}
