'use client';

import { useState, useMemo } from 'react';
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


export default function Marketplace({ initialCanSit, initialNeedsSitting, userName, userLocation, locale: localeProp }) {
  const locale = localeProp || 'en';
  const t = locale === 'de' ? contentDE.marketplace : contentEN.marketplace;

  const [canSit, setCanSit] = useState(initialCanSit);
  const [needsSitting, setNeedsSitting] = useState(initialNeedsSitting);

  // Search state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [radius, setRadius] = useState(10);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [resultsStale, setResultsStale] = useState(false);
  const [contactFilter, setContactFilter] = useState('email');
  // Store date-filtered sitters with distances; distance threshold applied live via radius
  const [fetchedSitters, setFetchedSitters] = useState([]);

  const handleToggle = async (field, value) => {
    // Mutually exclusive — turning one on turns the other off, but both can be off
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
    setResultsStale(false);

    try {
      const res = await fetch(`/api/care/sitters?type=${apiQueryType}`);
      if (!res.ok) { setFetchedSitters([]); return; }

      let sitters = await res.json();
      // Attach distance to every sitter that has coords
      if (userLocation?.lat != null && userLocation?.lng != null) {
        sitters = sitters.map((s) => {
          if (s.location?.lat == null || s.location?.lng == null) return s;
          return { ...s, _distance: haversine(userLocation.lat, userLocation.lng, s.location.lat, s.location.lng) };
        });
      }
      setFetchedSitters(sitters.filter((s) => isAvailableForDates(s, startDate, endDate)));
    } catch (err) {
      console.error('Search error:', err);
      setFetchedSitters([]);
    } finally {
      setSearching(false);
    }
  };

  // Apply radius threshold live — no new fetch needed
  const results = useMemo(() => {
    if (!searched) return null;
    return fetchedSitters
      .filter((s) => s._distance == null || s._distance <= radius)
      .filter((s) => !s.contactPreference || s.contactPreference === contactFilter)
      .sort((a, b) => (a._distance ?? 999) - (b._distance ?? 999));
  }, [searched, fetchedSitters, radius, contactFilter]);

  // canSit=true → find people who need sitting; needsSitting=true → find available sitters
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
                  max={40}
                  step={5}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className={styles.squigglySlider}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                  Move slider to adjust search area · from {userLocation.name || 'your location'}
                </span>
              </div>
            ) : (
              <div className={styles.searchField}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                  <a href="/care/profile" style={{ color: 'var(--hunter-green)' }}>Add your location</a> to enable distance filtering
                </span>
              </div>
            )}
            <div className={styles.searchField}>
              <label className={styles.searchLabel}>Contact via</label>
              <div className={styles.contactFilterGroup}>
                <label className={styles.contactFilterOption}>
                  <input
                    type="radio"
                    name="contactFilter"
                    value="email"
                    checked={contactFilter === 'email'}
                    onChange={() => setContactFilter('email')}
                  />
                  Email
                </label>
                <label className={styles.contactFilterOption}>
                  <input
                    type="radio"
                    name="contactFilter"
                    value="whatsapp"
                    checked={contactFilter === 'whatsapp'}
                    onChange={() => setContactFilter('whatsapp')}
                  />
                  WhatsApp
                </label>
              </div>
            </div>
            <button className={styles.searchBtn} onClick={handleSearch} disabled={searching}>
              {searching ? <span className={styles.spinner} /> : t.search.search}
            </button>
          </div>

          {/* Results */}
          {results !== null && (
            <div className={styles.resultsWrapper}>
              {resultsStale && (
                <div className={styles.resultsStaleOverlay}>
                  <span className={styles.staleMsg}>Your status changed — search again to update results</span>
                  <button className={styles.searchBtn} onClick={handleSearch} disabled={searching}>
                    {searching ? '...' : 'Search again'}
                  </button>
                </div>
              )}
              {results.length === 0 ? (
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
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
