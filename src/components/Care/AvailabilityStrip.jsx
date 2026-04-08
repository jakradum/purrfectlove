'use client';

import { useState, useCallback } from 'react';
import styles from './Care.module.css';

function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseYMD(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

// Returns 'available' | 'unavailable' for a given date
function dayStatus(ymd, unavailableDatesV2, availabilityDefault) {
  const marked = new Set(unavailableDatesV2 || []);
  if (availabilityDefault === 'unavailable') {
    return marked.has(ymd) ? 'available' : 'unavailable';
  }
  return marked.has(ymd) ? 'unavailable' : 'available';
}

// Build array of Date objects for a full month calendar grid (Mon-aligned)
function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  // day of week: 0=Sun ... 6=Sat. We want Mon=0.
  let startDow = firstOfMonth.getDay(); // 0=Sun
  startDow = (startDow + 6) % 7; // convert: Mon=0, Tue=1, ... Sun=6

  const days = [];
  // pad before
  for (let i = 0; i < startDow; i++) {
    days.push(null);
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }
  // pad after to complete last row
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

// ─── Mini day strip (collapsed) ──────────────────────────────────────────────

function MiniDayStrip({ days, unavailableDatesV2, availabilityDefault }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className={styles.availMiniStrip}>
      {days.map((date, i) => {
        const ymd = toYMD(date);
        const isToday = sameDay(date, today);
        const status = isToday ? 'today' : dayStatus(ymd, unavailableDatesV2, availabilityDefault);
        return (
          <div
            key={i}
            className={`${styles.availMiniDay} ${styles[`availMiniDay_${status}`]}`}
            title={date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          >
            {date.getDate()}
          </div>
        );
      })}
    </div>
  );
}

// ─── Expanded month calendar ──────────────────────────────────────────────────

const DOW_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function ExpandedCalendar({ localDates, availabilityDefault, onToggle, viewMonth, onPrevMonth, onNextMonth }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const grid = buildMonthGrid(viewMonth.year, viewMonth.month);
  const monthLabel = new Date(viewMonth.year, viewMonth.month, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className={styles.availExpanded}>
      {/* Month nav */}
      <div className={styles.availMonthNav}>
        <button type="button" className={styles.availMonthBtn} onClick={onPrevMonth}>‹</button>
        <span className={styles.availMonthLabel}>{monthLabel}</span>
        <button type="button" className={styles.availMonthBtn} onClick={onNextMonth}>›</button>
      </div>

      {/* Day-of-week headers */}
      <div className={styles.availCalGrid}>
        {DOW_LABELS.map(d => (
          <div key={d} className={styles.availDowHeader}>{d}</div>
        ))}

        {grid.map((date, i) => {
          if (!date) {
            return <div key={`pad-${i}`} />;
          }
          const ymd = toYMD(date);
          const isPast = date < today;
          const isToday = sameDay(date, today);
          const status = dayStatus(ymd, localDates, availabilityDefault);

          let cellClass = styles.availCalCell;
          if (isPast) cellClass += ` ${styles.availCalCell_past}`;
          else if (isToday) cellClass += ` ${styles.availCalCell_today}`;
          else if (status === 'available') cellClass += ` ${styles.availCalCell_available}`;
          else cellClass += ` ${styles.availCalCell_unavailable}`;

          return (
            <button
              key={ymd}
              type="button"
              className={cellClass}
              disabled={isPast}
              onClick={() => !isPast && onToggle(ymd)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className={styles.availLegend}>
        <span className={styles.availLegendDot} style={{ background: '#EAF3DE', border: '1px solid #2C5F4F' }} />
        <span className={styles.availLegendLabel}>Available</span>
        <span className={styles.availLegendDot} style={{ background: '#FAECE7', border: '1px solid #993C1D' }} />
        <span className={styles.availLegendLabel}>Unavailable</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AvailabilityStrip({ myProfile, startDate, endDate, onSaved }) {
  const { _id, unavailableDatesV2 = [], availabilityDefault = 'available' } = myProfile || {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Mini strip: show search dates if set, else 10 days from today
  const miniDays = (() => {
    if (startDate && endDate) {
      const days = [];
      const cur = parseYMD(startDate);
      const stop = parseYMD(endDate);
      while (cur <= stop && days.length < 14) {
        days.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
      return days;
    }
    return Array.from({ length: 10 }, (_, i) => addDays(today, i));
  })();

  const monthLabel = today.toLocaleDateString('en-US', { month: 'long' });

  const [expanded, setExpanded] = useState(false);
  const [localDates, setLocalDates] = useState(unavailableDatesV2);
  const [viewMonth, setViewMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleEdit = () => {
    setLocalDates(unavailableDatesV2);
    setViewMonth({ year: today.getFullYear(), month: today.getMonth() });
    setSaveError('');
    setExpanded(true);
  };

  const handleCancel = () => {
    setExpanded(false);
    setSaveError('');
  };

  const handleToggle = useCallback((ymd) => {
    setLocalDates(prev => {
      const set = new Set(prev);
      if (set.has(ymd)) {
        set.delete(ymd);
      } else {
        set.add(ymd);
      }
      return Array.from(set).sort();
    });
  }, []);

  const handlePrevMonth = () => {
    setViewMonth(({ year, month }) => {
      if (month === 0) return { year: year - 1, month: 11 };
      return { year, month: month - 1 };
    });
  };

  const handleNextMonth = () => {
    setViewMonth(({ year, month }) => {
      if (month === 11) return { year: year + 1, month: 0 };
      return { year, month: month + 1 };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/care/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unavailableDatesV2: localDates }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError(err.error || 'Save failed. Please try again.');
        return;
      }
      setExpanded(false);
      onSaved?.(localDates);
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.availStrip}>
      {!expanded ? (
        /* Collapsed strip */
        <div className={styles.availStripCollapsed}>
          <div className={styles.availStripTop}>
            <span className={styles.availStripLabel}>Your availability · {monthLabel}</span>
            <button type="button" className={styles.availEditBtn} onClick={handleEdit}>
              Edit →
            </button>
          </div>
          <MiniDayStrip
            days={miniDays}
            unavailableDatesV2={unavailableDatesV2}
            availabilityDefault={availabilityDefault}
          />
        </div>
      ) : (
        /* Expanded calendar */
        <div className={styles.availStripExpandedWrap}>
          <div className={styles.availExpandedHeader}>
            <button type="button" className={styles.availBackBtn} onClick={handleCancel}>
              ← Cancel
            </button>
            <span className={styles.availStripLabel}>Your availability</span>
          </div>

          <ExpandedCalendar
            localDates={localDates}
            availabilityDefault={availabilityDefault}
            onToggle={handleToggle}
            viewMonth={viewMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />

          {saveError && <p className={styles.availSaveError}>{saveError}</p>}

          <button
            type="button"
            className={styles.availSaveBtn}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}
