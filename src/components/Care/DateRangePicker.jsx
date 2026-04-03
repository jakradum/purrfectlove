'use client';

import { useState, useRef } from 'react';
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
  const lastClickedRef = useRef(null);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const monthLabel = viewMonth.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { month: 'long', year: 'numeric' });

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handleDayClick = (ymd, e) => {
    if (ymd < todayYMD) return; // block past dates

    // Shift+click: treat last clicked date as start, current as end (or vice versa)
    if (e?.shiftKey && lastClickedRef.current && lastClickedRef.current !== ymd) {
      const [a, b] = lastClickedRef.current < ymd
        ? [lastClickedRef.current, ymd]
        : [ymd, lastClickedRef.current];
      onChange({ startDate: a, endDate: b });
      setPicking('start');
      return;
    }

    lastClickedRef.current = ymd;

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
          const isSingleDay = isStart && isEnd;
          const isInRange = startDate && endDate && ymd > startDate && ymd < endDate;
          const isEndpoint = isStart || isEnd;
          const isToday = ymd === todayYMD;

          // Outer button: strip background for range context
          let outerCls = styles.monthCalDay;
          if (isStart && !isSingleDay) outerCls += ` ${styles.drpDayOuterStart}`;
          else if (isEnd && !isSingleDay) outerCls += ` ${styles.drpDayOuterEnd}`;
          else if (isInRange) outerCls += ` ${styles.drpDayOuterMid}`;
          if (isPast) outerCls += ` ${styles.monthCalDayPast}`;

          // Inner span: circle
          let innerCls = styles.drpDayInner;
          if (isEndpoint) innerCls += ` ${styles.drpDayInnerSelected}`;
          else if (isInRange) innerCls += ` ${styles.drpDayInnerMid}`;
          else if (!isPast) innerCls += ` ${styles.drpDayInnerAvail}`;
          if (isToday) innerCls += ` ${styles.drpDayInnerToday}`;

          return (
            <button
              key={ymd}
              type="button"
              className={outerCls}
              disabled={isPast}
              onMouseDown={(e) => { if (e.shiftKey) e.preventDefault(); }}
              onClick={(e) => handleDayClick(ymd, e)}
              aria-label={ymd}
            >
              <span className={innerCls}>{dayNum}</span>
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
