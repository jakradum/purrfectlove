'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import styles from './Care.module.css';
import SitterCard from './SitterCard';
import contentEN from '@/data/careContent.en.json';
import contentDE from '@/data/careContent.de.json';

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

// Check if a sitter is available for a date range
function isAvailableForDates(sitter, startDate, endDate) {
  if (!startDate && !endDate) return true;

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (sitter.alwaysAvailable) {
    // Check no unavailable dates fall in range
    if (!start || !end) return true;
    const unavail = sitter.unavailableDates || [];
    for (const d of unavail) {
      const date = new Date(d);
      if (date >= start && date <= end) return false;
    }
    return true;
  }

  // Check date range overlaps with available ranges
  const ranges = sitter.availableDates || [];
  if (ranges.length === 0) return false;

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

// Geocode a location string via browser Geocoding API or Google if available
async function geocodeLocation(locationStr) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (key) {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationStr)}&key=${key}`
    );
    const data = await res.json();
    if (data.results && data.results[0]) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
    return null;
  }
  return null;
}

export default function Marketplace({ initialCanSit, initialNeedsSitting, userName }) {
  const locale = 'en'; // Could be derived from URL if needed
  const t = locale === 'de' ? contentDE.marketplace : contentEN.marketplace;

  const [canSit, setCanSit] = useState(initialCanSit);
  const [needsSitting, setNeedsSitting] = useState(initialNeedsSitting);
  const [activeTab, setActiveTab] = useState('findSitters');

  // Search state
  const [locationInput, setLocationInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [radius, setRadius] = useState(10);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [searched, setSearched] = useState(false);

  const debounceRef = useRef(null);

  const handleToggle = async (field, value) => {
    if (field === 'canSit') setCanSit(value);
    else setNeedsSitting(value);

    try {
      await fetch('/api/care/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
    } catch (err) {
      console.error('Failed to update status:', err);
      // Revert
      if (field === 'canSit') setCanSit(!value);
      else setNeedsSitting(!value);
    }
  };

  const handleSearch = async () => {
    setSearching(true);
    setSearched(true);

    try {
      const type = activeTab === 'findSitters' ? 'canSit' : 'needsSitting';
      const res = await fetch(`/api/care/sitters?type=${type}`);
      if (!res.ok) {
        setResults([]);
        return;
      }
      let sitters = await res.json();

      // Filter by dates
      sitters = sitters.filter((s) => isAvailableForDates(s, startDate, endDate));

      // Filter by distance if location provided
      if (locationInput) {
        let userCoords = null;

        if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY) {
          userCoords = await geocodeLocation(locationInput);
        } else {
          // Try browser geolocation as fallback, but show all if no coords
          userCoords = null;
        }

        if (userCoords) {
          sitters = sitters
            .map((s) => {
              if (!s.location?.lat || !s.location?.lng) return null;
              const dist = haversine(userCoords.lat, userCoords.lng, s.location.lat, s.location.lng);
              return dist <= radius ? { ...s, _distance: dist } : null;
            })
            .filter(Boolean)
            .sort((a, b) => a._distance - b._distance);
        }
        // If no geocoding available, show all filtered by dates
      }

      setResults(sitters);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const showFindSitters = canSit || (!canSit && !needsSitting);
  const showOfferToSit = needsSitting || (!canSit && !needsSitting);
  const showTabs = canSit && needsSitting;

  const currentType = showTabs ? activeTab : canSit ? 'findSitters' : 'offerToSit';

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
        <Link href="/care/profile" style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--hunter-green)' }}>
          Edit profile →
        </Link>
      </div>

      {/* If neither set, show prompt */}
      {!canSit && !needsSitting ? (
        <div className={styles.statusPrompt}>
          <p className={styles.statusPromptTitle}>Set your status to get started</p>
          <p className={styles.statusPromptText}>
            Enable &quot;I can sit&quot; to find cats that need a sitter, or &quot;I need sitting&quot; to find sitters for your cats. You can enable both!
          </p>
          <Link href="/care/profile" className={styles.profileLink}>
            Set up my profile
          </Link>
        </div>
      ) : (
        <>
          {/* Tabs */}
          {showTabs && (
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'findSitters' ? styles.tabActive : ''}`}
                onClick={() => { setActiveTab('findSitters'); setResults(null); setSearched(false); }}
              >
                {t.tabs.findSitters}
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'offerToSit' ? styles.tabActive : ''}`}
                onClick={() => { setActiveTab('offerToSit'); setResults(null); setSearched(false); }}
              >
                {t.tabs.offerToSit}
              </button>
            </div>
          )}

          {/* Search bar */}
          <div className={styles.searchBar}>
            <div className={styles.searchField}>
              <label className={styles.searchLabel}>{t.search.locationLabel}</label>
              <input
                type="text"
                className={styles.searchInput}
                placeholder={t.search.locationPlaceholder}
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
              />
            </div>
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
            <div className={styles.searchField}>
              <label className={styles.searchLabel}>
                {t.search.radiusLabel}: {radius} {t.search.radiusUnit}
              </label>
              <input
                type="range"
                min={5}
                max={40}
                step={5}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <button className={styles.searchBtn} onClick={handleSearch} disabled={searching}>
              {searching ? '...' : t.search.search}
            </button>
          </div>

          {/* Results */}
          {results !== null && (
            results.length === 0 ? (
              <div className={styles.noResults}>{noResultsText}</div>
            ) : (
              <div className={styles.sitterGrid}>
                {results.map((sitter) => (
                  <SitterCard
                    key={sitter._id}
                    sitter={sitter}
                    type={currentType}
                    locale={locale}
                  />
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
