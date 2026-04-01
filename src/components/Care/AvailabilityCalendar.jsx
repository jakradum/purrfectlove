'use client';

import { useState } from 'react';
import styles from './Care.module.css';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Full-month tap-to-toggle availability calendar.
 *
 * Props:
 *   markedDates        – string[] of YYYY-MM-DD strings (explicitly marked dates)
 *   availabilityDefault – 'available' | 'unavailable' (default: 'available')
 *                        'available'  → markedDates are the unavailable days (green default, tap to mark red)
 *                        'unavailable'→ markedDates are the available days  (grey default, tap to mark green)
 *   onChange           – (dates: string[]) => void   [omit or pass null for read-only display]
 *   onDefaultChange    – (newDefault: string) => void [called when toggle changes]
 *   readOnly           – boolean, default false
 *   initialMonth       – Date (first day of the month to show initially), default = today's month
 *
 * Legacy compat: also accepts `unavailableDates` prop (treated as markedDates with default='available')
 */
export default function AvailabilityCalendar({
  markedDates,
  unavailableDates, // legacy alias
  availabilityDefault = 'available',
  onChange,
  onDefaultChange,
  readOnly = false,
  initialMonth,
}) {
  const dates = markedDates ?? unavailableDates ?? [];

  const today = startOfDay(new Date());
  const todayYMD = toYMD(today);

  const defaultMonth = initialMonth
    ? new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1)
    : new Date(today.getFullYear(), today.getMonth(), 1);

  const [viewMonth, setViewMonth] = useState(defaultMonth);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstDow;

  const handlePrev = () => setViewMonth(new Date(year, month - 1, 1));
  const handleNext = () => setViewMonth(new Date(year, month + 1, 1));

  const handleDayClick = (ymd, isPast) => {
    if (readOnly || isPast || !onChange) return;
    const isMarked = dates.includes(ymd);
    onChange(isMarked ? dates.filter(d => d !== ymd) : [...dates, ymd]);
  };

  // In 'available' mode: marked = unavailable (red), unmarked = available (green)
  // In 'unavailable' mode: marked = available (green), unmarked = unavailable (grey)
  const isDayAvailable = (ymd) =>
    availabilityDefault === 'available'
      ? !dates.includes(ymd)
      : dates.includes(ymd);

  const hintText = availabilityDefault === 'available'
    ? 'Tap a date to mark it unavailable. All other days are shown as available.'
    : 'Tap a date to mark it available. All other days are shown as unavailable.';

  return (
    <div className={styles.monthCal}>
      {/* Default availability toggle */}
      {!readOnly && onDefaultChange && (
        <div className={styles.availDefaultToggle}>
          <span className={styles.availDefaultLabel}>I&apos;m generally:</span>
          <div className={styles.availDefaultBtns}>
            <button
              type="button"
              className={`${styles.availDefaultBtn} ${availabilityDefault === 'available' ? styles.availDefaultBtnActive : ''}`}
              onClick={() => onDefaultChange('available')}
            >
              Available
            </button>
            <button
              type="button"
              className={`${styles.availDefaultBtn} ${availabilityDefault === 'unavailable' ? styles.availDefaultBtnActiveRed : ''}`}
              onClick={() => onDefaultChange('unavailable')}
            >
              Unavailable
            </button>
          </div>
        </div>
      )}

      {/* Navigation header */}
      <div className={styles.monthCalHeader}>
        <button type="button" className={styles.monthCalNav} onClick={handlePrev} aria-label="Previous month">‹</button>
        <span className={styles.monthCalTitle}>{monthLabel}</span>
        <button type="button" className={styles.monthCalNav} onClick={handleNext} aria-label="Next month">›</button>
      </div>

      {/* Day-of-week headers */}
      <div className={styles.monthCalDowRow}>
        {DAY_LABELS.map(d => (
          <span key={d} className={styles.monthCalDow}>{d}</span>
        ))}
      </div>

      {/* Day grid */}
      <div className={styles.monthCalGrid}>
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} className={styles.monthCalBlank} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateObj = new Date(year, month, dayNum);
          const ymd = toYMD(dateObj);
          const isPast = dateObj < today;
          const isToday = ymd === todayYMD;
          const avail = isDayAvailable(ymd);

          let cellClass = styles.monthCalDay;
          if (isPast) {
            cellClass += ` ${styles.monthCalDayPast}`;
          } else if (avail) {
            cellClass += ` ${styles.monthCalDayAvail}`;
          } else {
            cellClass += ` ${styles.monthCalDayUnavail}`;
          }
          if (isToday) cellClass += ` ${styles.monthCalDayToday}`;

          return (
            <button
              key={ymd}
              type="button"
              className={cellClass}
              onClick={() => handleDayClick(ymd, isPast)}
              disabled={readOnly || isPast}
              aria-label={`${ymd}${avail ? ' (available)' : ' (unavailable)'}`}
              aria-pressed={!readOnly ? !avail : undefined}
            >
              {dayNum}
            </button>
          );
        })}
      </div>

      {!readOnly && (
        <p className={styles.monthCalHint}>{hintText}</p>
      )}
    </div>
  );
}
