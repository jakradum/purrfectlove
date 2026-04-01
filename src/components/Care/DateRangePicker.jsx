'use client';

import { useState } from 'react';
import styles from './Care.module.css';

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toYMD(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fromYMD(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(ymd, locale) {
  if (!ymd) return '';
  const d = fromYMD(ymd);
  return d.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { day: 'numeric', month: 'short' });
}

/**
 * DateRangePicker
 *
 * Props:
 *   startDate   – YYYY-MM-DD string
 *   endDate     – YYYY-MM-DD string
 *   onChange    – ({ startDate, endDate }) => void
 *   onClear     – () => void
 *   locale      – 'en' | 'de'
 */
export default function DateRangePicker({ startDate, endDate, onChange, onClear, locale = 'en' }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayYMD = toYMD(today);

  const defaultMonth = startDate ? new Date(fromYMD(startDate).getFullYear(), fromYMD(startDate).getMonth(), 1)
    : new Date(today.getFullYear(), today.getMonth(), 1);

  const [viewMonth, setViewMonth] = useState(defaultMonth);
  // 'start' = picking start, 'end' = picking end
  const [picking, setPicking] = useState(startDate ? 'end' : 'start');

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const monthLabel = viewMonth.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { month: 'long', year: 'numeric' });

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handleDayClick = (ymd) => {
    if (ymd < todayYMD) return; // block past dates

    if (picking === 'start' || !startDate) {
      onChange({ startDate: ymd, endDate: '' });
      setPicking('end');
    } else {
      if (ymd < startDate) {
        // Clicked before start — restart selection
        onChange({ startDate: ymd, endDate: '' });
        setPicking('end');
      } else if (ymd === startDate) {
        // Clicked same day = single-day range
        onChange({ startDate: ymd, endDate: ymd });
        setPicking('start');
      } else {
        onChange({ startDate, endDate: ymd });
        setPicking('start');
      }
    }
  };

  const handleClear = () => {
    onChange({ startDate: '', endDate: '' });
    setPicking('start');
    onClear?.();
  };

  return (
    <div className={styles.drp}>
      {/* Selected range summary */}
      <div className={styles.drpSummary}>
        <button
          type="button"
          className={`${styles.drpSummaryBtn} ${picking === 'start' ? styles.drpSummaryBtnActive : ''}`}
          onClick={() => setPicking('start')}
        >
          <span className={styles.drpSummaryLabel}>{locale === 'de' ? 'Von' : 'From'}</span>
          <span className={styles.drpSummaryValue}>
            {startDate ? formatDate(startDate, locale) : (locale === 'de' ? 'Datum wählen' : 'Pick date')}
          </span>
        </button>
        <span className={styles.drpArrow}>→</span>
        <button
          type="button"
          className={`${styles.drpSummaryBtn} ${picking === 'end' ? styles.drpSummaryBtnActive : ''}`}
          onClick={() => { if (startDate) setPicking('end'); }}
          disabled={!startDate}
        >
          <span className={styles.drpSummaryLabel}>{locale === 'de' ? 'Bis' : 'To'}</span>
          <span className={styles.drpSummaryValue}>
            {endDate ? formatDate(endDate, locale) : (locale === 'de' ? 'Datum wählen' : 'Pick date')}
          </span>
        </button>
        {(startDate || endDate) && (
          <button type="button" className={styles.drpClearBtn} onClick={handleClear}>
            ✕
          </button>
        )}
      </div>

      {/* Month navigation */}
      <div className={styles.monthCalHeader}>
        <button type="button" className={styles.monthCalNav} onClick={() => setViewMonth(new Date(year, month - 1, 1))} aria-label="Previous month">‹</button>
        <span className={styles.monthCalTitle}>{monthLabel}</span>
        <button type="button" className={styles.monthCalNav} onClick={() => setViewMonth(new Date(year, month + 1, 1))} aria-label="Next month">›</button>
      </div>

      {/* DOW headers */}
      <div className={styles.monthCalDowRow}>
        {DOW.map(d => <span key={d} className={styles.monthCalDow}>{d}</span>)}
      </div>

      {/* Day grid */}
      <div className={styles.monthCalGrid}>
        {Array.from({ length: firstDow }).map((_, i) => <div key={`b${i}`} className={styles.monthCalBlank} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const ymd = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const isPast = ymd < todayYMD;
          const isStart = ymd === startDate;
          const isEnd = ymd === endDate;
          const isInRange = startDate && endDate && ymd > startDate && ymd < endDate;
          const isToday = ymd === todayYMD;

          let cls = styles.monthCalDay;
          if (isPast) {
            cls += ` ${styles.monthCalDayPast}`;
          } else if (isStart || isEnd) {
            cls += ` ${styles.drpDaySelected}`;
          } else if (isInRange) {
            cls += ` ${styles.drpDayInRange}`;
          } else {
            cls += ` ${styles.monthCalDayAvail}`;
          }
          if (isToday) cls += ` ${styles.monthCalDayToday}`;

          return (
            <button
              key={ymd}
              type="button"
              className={cls}
              disabled={isPast}
              onClick={() => handleDayClick(ymd)}
              aria-label={ymd}
            >
              {dayNum}
            </button>
          );
        })}
      </div>

      {picking === 'start' && !startDate && (
        <p className={styles.monthCalHint}>{locale === 'de' ? 'Startdatum tippen' : 'Tap a start date'}</p>
      )}
      {picking === 'end' && startDate && !endDate && (
        <p className={styles.monthCalHint}>{locale === 'de' ? 'Enddatum tippen' : 'Now tap an end date'}</p>
      )}
    </div>
  );
}
