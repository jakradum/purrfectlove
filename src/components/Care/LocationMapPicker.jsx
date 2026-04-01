'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { OpenLocationCode } from 'open-location-code';
import styles from './Care.module.css';

const LeafletMapInner = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '280px', background: '#f5f5f3', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.875rem' }}>
      Loading map…
    </div>
  ),
});

const CITY_OPTIONS = [
  { value: 'Bangalore, India', placeholder: 'e.g. 7J4V+XH', center: [12.9716, 77.5946] },
  { value: 'Stuttgart, Germany', placeholder: 'e.g. GV3C+9X', center: [48.7758, 9.1829] },
];

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

export default function LocationMapPicker({ value, onChange, locale }) {
  const defaultCity = CITY_OPTIONS.find(c => locale === 'de' ? c.value.includes('Stuttgart') : c.value.includes('Bangalore')) || CITY_OPTIONS[0];

  const [mode, setMode] = useState('map');
  const [city, setCity] = useState(defaultCity);

  // Map mode state
  const [mapCenter, setMapCenter] = useState(
    value?.lat != null ? [value.lat, value.lng] : defaultCity.center
  );
  const [mapPosition, setMapPosition] = useState(
    value?.lat != null ? [value.lat, value.lng] : null
  );
  const [displayName, setDisplayName] = useState(value?.displayName || '');
  const [geocoding, setGeocoding] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Manual mode state
  const [locationInput, setLocationInput] = useState('');
  const [locationError, setLocationError] = useState('');
  const olc = new OpenLocationCode();

  const handleMapPin = useCallback(async (lat, lng) => {
    const latF = parseFloat(lat.toFixed(6));
    const lngF = parseFloat(lng.toFixed(6));
    setMapPosition([lat, lng]);
    setGeocoding(true);
    const name = await reverseGeocode(latF, lngF);
    setDisplayName(name);
    setGeocoding(false);
    onChange({ lat: latF, lng: lngF, displayName: name, name: name || `${latF}, ${lngF}` });
  }, [onChange]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeolocating(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setMapCenter([lat, lng]);
        setGeolocating(false);
        await handleMapPin(lat, lng);
      },
      () => {
        setGeolocating(false);
        setGeoError('Could not get your location. Please drop a pin manually.');
      },
      { timeout: 10000 }
    );
  };

  const handleManualInput = (raw, selectedCity = city) => {
    setLocationInput(raw);
    setLocationError('');
    const trimmed = raw.trim();
    if (!trimmed) { onChange(null); return; }

    const parts = trimmed.split(/\s+/);
    const token = parts[0];

    if (!token.includes('+') || !olc.isValid(token)) {
      setLocationError('Enter a valid Plus Code from plus.codes/map (e.g. 7J4VVHQ2+FC or 7J4V+XH)');
      onChange(null);
      return;
    }

    if (olc.isFull(token)) {
      try {
        const decoded = olc.decode(token);
        const lat = parseFloat(decoded.latitudeCenter.toFixed(6));
        const lng = parseFloat(decoded.longitudeCenter.toFixed(6));
        onChange({ lat, lng, name: token.toUpperCase(), displayName: null });
        return;
      } catch { /* fall through */ }
    }

    // Short code — append selected city
    const nameToStore = `${token} ${selectedCity.value}`;
    onChange({ lat: null, lng: null, name: nameToStore, displayName: null });
  };

  return (
    <div>
      {mode === 'map' ? (
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={geolocating}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', background: 'var(--hunter-green)', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600,
                cursor: geolocating ? 'not-allowed' : 'pointer', opacity: geolocating ? 0.7 : 1,
                fontFamily: 'var(--font-outfit)',
              }}
            >
              {geolocating ? '📍 Getting location…' : '📍 Use my location'}
            </button>
            {geoError && <span style={{ fontSize: '0.78rem', color: '#ef4444' }}>{geoError}</span>}
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
            Or tap the map to drop a pin, then drag it to adjust.
          </p>

          <LeafletMapInner
            center={mapCenter}
            position={mapPosition}
            onPositionChange={handleMapPin}
          />

          <div style={{ minHeight: '1.5rem', marginTop: '0.4rem' }}>
            {geocoding && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Looking up neighbourhood…</p>
            )}
            {displayName && !geocoding && (
              <p style={{ fontSize: '0.875rem', color: 'var(--hunter-green)', fontWeight: 500 }}>
                📍 {displayName}
              </p>
            )}
            {mapPosition && !geocoding && !displayName && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>
                {mapPosition[0].toFixed(5)}, {mapPosition[1].toFixed(5)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMode('manual')}
            style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-light)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', padding: 0, display: 'block' }}
          >
            Enter location manually instead →
          </button>
        </div>
      ) : (
        <div>
          <div className={styles.formGroup}>
            <label className={styles.profileLabel}>City <span style={{ color: '#ef4444' }}>*</span></label>
            <select
              className={styles.profileInput}
              value={city.value}
              onChange={(e) => {
                const selected = CITY_OPTIONS.find(c => c.value === e.target.value) || CITY_OPTIONS[0];
                setCity(selected);
                if (locationInput.trim()) handleManualInput(locationInput, selected);
              }}
            >
              {CITY_OPTIONS.map(({ value: v }) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.profileLabel}>Plus Code <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              type="text"
              className={styles.profileInput}
              value={locationInput}
              onChange={(e) => handleManualInput(e.target.value)}
              placeholder={city.placeholder}
            />
            {locationError && (
              <p className={styles.hint} style={{ color: '#ef4444' }}>{locationError}</p>
            )}
            {!locationError && value?.lat != null && value?.name && olc.isValid(value.name) && olc.isFull(value.name) && (
              <p className={styles.hint} style={{ fontFamily: 'monospace', color: 'var(--text-light)' }}>
                Resolved to: {value.name}
              </p>
            )}
            {!locationError && value?.name && value.lat == null && (
              <p className={styles.hint}>Will resolve to full code on save.</p>
            )}
          </div>

          <p className={styles.hint}>
            Find your Plus Code at{' '}
            <a href="https://plus.codes/map" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--hunter-green)' }}>plus.codes/map</a>
          </p>

          <button
            type="button"
            onClick={() => setMode('map')}
            style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-light)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', padding: 0, display: 'block' }}
          >
            ← Use map instead
          </button>
        </div>
      )}
    </div>
  );
}
