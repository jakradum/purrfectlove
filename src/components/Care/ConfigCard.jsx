'use client';

import Link from 'next/link';
import styles from './Care.module.css';
import contentEN from '@/data/careContent.en.json';
import contentDE from '@/data/careContent.de.json';

const RADIUS_OPTIONS = [5, 10, 25, 50];

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function CarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l3-3h8l3 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
      <circle cx="7.5" cy="17.5" r="2.5"/>
      <circle cx="16.5" cy="17.5" r="2.5"/>
    </svg>
  );
}

function PawIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <ellipse cx="12" cy="17" rx="5" ry="3.5"/>
      <ellipse cx="6.5" cy="11.5" rx="2" ry="2.8"/>
      <ellipse cx="17.5" cy="11.5" rx="2" ry="2.8"/>
      <ellipse cx="9" cy="8" rx="1.8" ry="2.5"/>
      <ellipse cx="15" cy="8" rx="1.8" ry="2.5"/>
    </svg>
  );
}

export default function ConfigCard({
  startDate,
  endDate,
  sitType,
  radius,
  onDatesChange,
  onSitTypeChange,
  onRadiusChange,
  onSearch,
  myCats,
  selectedCats,
  onCatToggle,
  locale = 'en',
  loading = false,
}) {
  const t = (locale === 'de' ? contentDE : contentEN).marketplace.config;

  const startLabel = sitType === 'drop_off' ? t.dropOffLabel : t.fromLabel;
  const endLabel   = sitType === 'drop_off' ? t.pickUpLabel  : t.toLabel;

  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const canSearch = !!(startDate && endDate);

  return (
    <div className={styles.configCard}>

      {/* Sit type */}
      <div className={styles.configSection}>
        <p className={styles.configSectionLabel}>{t.sitTypeHeading}</p>
        <div className={styles.configSitTypeRow}>
          {[
            { value: null,         label: t.sitTypeAny,       desc: t.sitTypeAnyDesc,       icon: <PawIcon /> },
            { value: 'home_visit', label: t.sitTypeHomeVisit,  desc: t.sitTypeHomeVisitDesc,  icon: <HomeIcon /> },
            { value: 'drop_off',   label: t.sitTypeDropOff,   desc: t.sitTypeDropOffDesc,   icon: <CarIcon /> },
          ].map(({ value, label, desc, icon }) => (
            <button
              key={String(value)}
              type="button"
              className={`${styles.configSitTypeCard} ${sitType === value ? styles.configSitTypeCardActive : ''}`}
              onClick={() => onSitTypeChange(value)}
            >
              <span className={styles.configSitTypeIcon}>{icon}</span>
              <span className={styles.configSitTypeLabel}>{label}</span>
              <span className={styles.configSitTypeDesc}>{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className={styles.configSection}>
        <p className={styles.configSectionLabel}>{t.datesHeading}</p>
        <div className={styles.configDateRow}>
          <div className={styles.configDateField}>
            <label className={styles.configDateLabel}>{startLabel}</label>
            <input
              type="date"
              className={styles.configDateInput}
              value={startDate}
              min={todayISO()}
              onChange={e => {
                const s = e.target.value;
                // If new start is after current end, reset end
                const newEnd = endDate && s > endDate ? '' : endDate;
                onDatesChange(s, newEnd);
              }}
            />
          </div>
          <div className={styles.configDateArrow}>→</div>
          <div className={styles.configDateField}>
            <label className={styles.configDateLabel}>{endLabel}</label>
            <input
              type="date"
              className={styles.configDateInput}
              value={endDate}
              min={startDate || todayISO()}
              onChange={e => onDatesChange(startDate, e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Cats */}
      <div className={styles.configSection}>
        <p className={styles.configSectionLabel}>{t.catsHeading}</p>
        {myCats === null ? (
          <p className={styles.configCatLoading}>{t.loadingCats}</p>
        ) : myCats.length === 0 ? (
          <p className={styles.configNoCats}>
            {t.noCats}{' '}
            <Link href="/care/profile" style={{ color: '#2C5F4F', fontWeight: 600 }}>
              {locale === 'de' ? 'Zum Profil →' : 'Go to profile →'}
            </Link>
          </p>
        ) : (
          <div className={styles.configCatList}>
            {myCats.map(cat => {
              const selected = selectedCats.some(c => c._key === cat._key);
              return (
                <button
                  key={cat._key}
                  type="button"
                  className={`${styles.configCatChip} ${selected ? styles.configCatChipSelected : ''}`}
                  onClick={() => onCatToggle(cat)}
                >
                  {selected && <span className={styles.configCatCheck}>✓</span>}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Radius */}
      <div className={styles.configSection}>
        <p className={styles.configSectionLabel}>{t.radiusHeading}</p>
        <div className={styles.configRadiusRow}>
          {RADIUS_OPTIONS.map(km => (
            <button
              key={km}
              type="button"
              className={`${styles.configRadiusChip} ${radius === km ? styles.configRadiusChipActive : ''}`}
              onClick={() => onRadiusChange(km)}
            >
              {km} km
            </button>
          ))}
        </div>
      </div>

      {/* Find button */}
      <button
        type="button"
        className={styles.configSearchBtn}
        onClick={onSearch}
        disabled={loading || !canSearch}
      >
        {loading ? t.findingButton : t.findButton}
      </button>
    </div>
  );
}
