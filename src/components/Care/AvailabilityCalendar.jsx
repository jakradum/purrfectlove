'use client';

import { useState, useRef } from 'react';
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
  const lastClickedRef = useRef(null);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstDow;

  const handlePrev = () => setViewMonth(new Date(year, month - 1, 1));
  const handleNext = () => setViewMonth(new Date(year, month + 1, 1));

  const handleDayClick = (ymd, isPast, e) => {
    if (readOnly || isPast || !onChange) return;

    if (e?.shiftKey && lastClickedRef.current && lastClickedRef.current !== ymd) {
      // Determine the toggle state from the first clicked date
      const anchorMarked = dates.includes(lastClickedRef.current);
      const [a, b] = lastClickedRef.current < ymd
        ? [lastClickedRef.current, ymd]
        : [ymd, lastClickedRef.current];

      // Build the range of non-past dates between a and b inclusive
      const range = [];
      const [ay, am, ad] = a.split('-').map(Number);
      const [by, bm, bd] = b.split('-').map(Number);
      const end = new Date(by, bm - 1, bd);
      for (let d = new Date(ay, am - 1, ad); d <= end; d.setDate(d.getDate() + 1)) {
        const dYmd = toYMD(d);
        if (dYmd >= toYMD(today)) range.push(dYmd);
      }

      // Apply: if anchor was marked → unmark all in range; if anchor was unmarked → mark all
      let next = [...dates];
      if (anchorMarked) {
        next = next.filter(d => !range.includes(d));
      } else {
        for (const d of range) {
          if (!next.includes(d)) next.push(d);
        }
      }
      onChange(next);
      return;
    }

    lastClickedRef.current = ymd;
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
              onClick={(e) => handleDayClick(ymd, isPast, e)}
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
