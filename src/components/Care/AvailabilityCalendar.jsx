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
 *   unavailableDates  – string[] of YYYY-MM-DD strings (days marked unavailable)
 *   onChange          – (dates: string[]) => void  [omit for read-only display]
 *   readOnly          – boolean, default false
 *   initialMonth      – Date (first day of the month to show initially), default = today's month
 */
export default function AvailabilityCalendar({
  unavailableDates = [],
  onChange,
  readOnly = false,
  initialMonth,
}) {
  const today = startOfDay(new Date());
  const todayYMD = toYMD(today);

  const defaultMonth = initialMonth
    ? new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1)
    : new Date(today.getFullYear(), today.getMonth(), 1);

  const [viewMonth, setViewMonth] = useState(defaultMonth);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Build the days in this month
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Padding cells before day 1
  const leadingBlanks = firstDow;

  const handlePrev = () => setViewMonth(new Date(year, month - 1, 1));
  const handleNext = () => setViewMonth(new Date(year, month + 1, 1));

  const handleDayClick = (ymd, isPast) => {
    if (readOnly || isPast || !onChange) return;
    const isUnavail = unavailableDates.includes(ymd);
    if (isUnavail) {
      onChange(unavailableDates.filter(d => d !== ymd));
    } else {
      onChange([...unavailableDates, ymd]);
    }
  };

  return (
    <div className={styles.monthCal}>
      {/* Navigation header */}
      <div className={styles.monthCalHeader}>
        <button
          type="button"
          className={styles.monthCalNav}
          onClick={handlePrev}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className={styles.monthCalTitle}>{monthLabel}</span>
        <button
          type="button"
          className={styles.monthCalNav}
          onClick={handleNext}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className={styles.monthCalDowRow}>
        {DAY_LABELS.map(d => (
          <span key={d} className={styles.monthCalDow}>{d}</span>
        ))}
      </div>

      {/* Day grid */}
      <div className={styles.monthCalGrid}>
        {/* Leading blanks */}
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} className={styles.monthCalBlank} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateObj = new Date(year, month, dayNum);
          const ymd = toYMD(dateObj);
          const isPast = dateObj < today;
          const isToday = ymd === todayYMD;
          const isUnavail = unavailableDates.includes(ymd);

          let cellClass = styles.monthCalDay;
          if (isPast) cellClass += ` ${styles.monthCalDayPast}`;
          else if (isUnavail) cellClass += ` ${styles.monthCalDayUnavail}`;
          else cellClass += ` ${styles.monthCalDayAvail}`;
          if (isToday) cellClass += ` ${styles.monthCalDayToday}`;

          return (
            <button
              key={ymd}
              type="button"
              className={cellClass}
              onClick={() => handleDayClick(ymd, isPast)}
              disabled={readOnly || isPast}
              aria-label={`${ymd}${isUnavail ? ' (unavailable)' : ' (available)'}`}
              aria-pressed={!readOnly ? isUnavail : undefined}
            >
              {dayNum}
            </button>
          );
        })}
      </div>

      {!readOnly && (
        <p className={styles.monthCalHint}>
          Tap a day to mark it unavailable. All other days are shown as available.
        </p>
      )}
    </div>
  );
}
