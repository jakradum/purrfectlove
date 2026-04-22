'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect, useRef } from 'react';
import contentEN from '@/data/careContent.en.json';
import contentDE from '@/data/careContent.de.json';
import styles from './Care.module.css';

const LeafletMapInner = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '280px', background: '#f5f5f3', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.875rem' }}>
      Loading map…
    </div>
  ),
});

const LOCALE_CENTERS = {
  de: [48.7758, 9.1829],
  en: [12.9716, 77.5946],
};

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'PurrfectLove/1.0 (support@purrfectlove.org)' } }
    );
    const data = await res.json();
    const { suburb, neighbourhood, quarter, village, town, city, county, state_district } = data.address || {};
    const area = suburb || neighbourhood || quarter || village || state_district || '';
    const cityName = city || town || county || '';
    if (area && cityName && area !== cityName) return `${area}, ${cityName}`;
    return area || cityName || (data.display_name || '').split(',').slice(0, 2).join(',').trim() || '';
  } catch {
    return '';
  }
}

export default function LocationMapPicker({ value, onChange, locale = 'en', readOnly = false }) {
  const lp = (locale === 'de' ? contentDE : contentEN).profile.locationPicker;

  const defaultCenter = LOCALE_CENTERS[locale] || LOCALE_CENTERS.en;
  const savedCenter = value?.lat != null ? [value.lat, value.lng] : null;

  const [mapCenter, setMapCenter] = useState(savedCenter || defaultCenter);
  // pendingPosition: user has tapped/searched but not confirmed
  const [pendingPosition, setPendingPosition] = useState(null);

  const [geocoding, setGeocoding] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchDebounceRef = useRef(null);
  const searchContainerRef = useRef(null);

  const [geoSupported] = useState(() =>
    typeof window !== 'undefined' && typeof navigator !== 'undefined' && !!navigator.geolocation
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMapTap = useCallback((lat, lng) => {
    setPendingPosition([lat, lng]);
    setGeoError('');
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!pendingPosition) return;
    const [lat, lng] = pendingPosition;
    const latF = parseFloat(lat.toFixed(6));
    const lngF = parseFloat(lng.toFixed(6));
    setGeocoding(true);
    const name = await reverseGeocode(latF, lngF);
    setGeocoding(false);
    onChange({ lat: latF, lng: lngF, displayName: name, name: name || `${latF}, ${lngF}` });
    setPendingPosition(null);
  }, [pendingPosition, onChange]);

  const handleUseMyLocation = () => {
    setGeolocating(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const pos2 = [lat, lng];
        setMapCenter(pos2);
        setPendingPosition(pos2);
        setGeolocating(false);
      },
      (err) => {
        setGeolocating(false);
        setGeoError(err.code === 1 ? lp.geoError : lp.geoErrorGeneric);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    setSearchError('');
    clearTimeout(searchDebounceRef.current);
    if (!q.trim()) {
      setSearchResults([]);
      setDropdownOpen(false);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/care/geocode/search?q=${encodeURIComponent(q.trim())}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSearchResults(data);
        setDropdownOpen(data.length > 0);
      } catch {
        setSearchError(lp.searchError);
        setDropdownOpen(false);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const handleSelectResult = (result) => {
    const pos = [result.lat, result.lng];
    setMapCenter(pos);
    setPendingPosition(pos);
    setSearchQuery(result.displayName);
    setDropdownOpen(false);
    setSearchResults([]);
  };

  if (readOnly) {
    return (
      <div style={{ filter: 'grayscale(0.2) opacity(0.75)', borderRadius: '8px', overflow: 'hidden' }}>
        <LeafletMapInner
          center={savedCenter || defaultCenter}
          zoom={savedCenter ? 14 : 11}
          position={savedCenter}
          onPositionChange={() => {}}
          readOnly
        />
      </div>
    );
  }

  // The confirmed pin on the map = value (already saved) OR pendingPosition
  const displayPosition = pendingPosition || (value?.lat != null ? [value.lat, value.lng] : null);

  return (
    <div>
      {/* Instruction */}
      <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
        {lp.instruction}
      </p>

      {/* Search input */}
      <div ref={searchContainerRef} style={{ position: 'relative', marginBottom: '0.5rem' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={lp.searchPlaceholder}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '0.5rem 0.75rem', fontSize: '0.875rem',
            border: '1px solid rgba(44,95,79,0.25)', borderRadius: '8px',
            fontFamily: 'var(--font-outfit)', outline: 'none',
            background: '#fff',
          }}
        />
        {searchLoading && (
          <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#aaa' }}>…</span>
        )}
        {dropdownOpen && searchResults.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            background: '#fff', border: '1px solid rgba(44,95,79,0.2)', borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden',
          }}>
            {searchResults.map((r, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => handleSelectResult(r)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '0.5rem 0.75rem', fontSize: '0.83rem', color: '#333',
                  background: 'none', border: 'none', borderBottom: i < searchResults.length - 1 ? '1px solid #f0f0f0' : 'none',
                  cursor: 'pointer', fontFamily: 'var(--font-outfit)',
                }}
              >
                {r.displayName}
              </button>
            ))}
          </div>
        )}
      </div>

      {searchError && (
        <p style={{ fontSize: '0.78rem', color: '#ef4444', marginBottom: '0.4rem' }}>{searchError}</p>
      )}

      {/* Secondary geo link */}
      {geoSupported && (
        <div style={{ marginBottom: '0.5rem' }}>
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={geolocating}
            style={{
              background: 'none', border: 'none', padding: 0,
              fontSize: '0.78rem', color: 'var(--hunter-green)',
              textDecoration: 'underline', cursor: geolocating ? 'not-allowed' : 'pointer',
              opacity: geolocating ? 0.6 : 1, fontFamily: 'var(--font-outfit)',
            }}
          >
            {geolocating ? lp.geolocating : lp.useMyLocation}
          </button>
          {geoError && <span style={{ marginLeft: '0.5rem', fontSize: '0.78rem', color: '#ef4444' }}>{geoError}</span>}
        </div>
      )}

      {/* Map */}
      <div className={styles.mapCrosshair} style={{ position: 'relative' }}>
        <LeafletMapInner
          center={mapCenter}
          zoom={savedCenter ? 14 : 11}
          position={displayPosition}
          onPositionChange={handleMapTap}
        />
        {!pendingPosition && !value?.lat && (
          <div className={styles.mapPinHint}>Tap anywhere to drop a pin</div>
        )}
      </div>

      {/* "Use this location" button — only shown when there's a new pending pin */}
      <div style={{ minHeight: '2.5rem', marginTop: '0.5rem' }}>
        {pendingPosition && !geocoding && (
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1.25rem', background: 'var(--hunter-green)', color: '#fff',
              border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-outfit)',
            }}
          >
            {lp.useThisLocation}
          </button>
        )}
        {geocoding && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', margin: 0 }}>Looking up neighbourhood…</p>
        )}
      </div>
    </div>
  );
}
