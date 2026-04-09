'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
  let startDow = firstOfMonth.getDay(); // 0=Sun
  startDow = (startDow + 6) % 7; // convert: Mon=0, Tue=1, ... Sun=6

  const days = [];
  for (let i = 0; i < startDow; i++) {
    days.push(null);
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function formatSummaryDate(ymd) {
  if (!ymd) return 'Pick date';
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Mini day strip (collapsed) ──────────────────────────────────────────────

const DOW_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

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

// ─── Expanded month calendar with range picker ────────────────────────────────

function ExpandedCalendar({ localDates, availabilityDefault, onApplyRange, viewMonth, onPrevMonth, onNextMonth }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayYMD = toYMD(today);

  const [picking, setPicking] = useState('start'); // 'start' | 'end'
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');

  const grid = buildMonthGrid(viewMonth.year, viewMonth.month);
  const monthLabel = new Date(viewMonth.year, viewMonth.month, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleDayClick = (ymd) => {
    if (ymd < todayYMD) return;

    if (picking === 'start' || !rangeStart) {
      setRangeStart(ymd);
      setRangeEnd('');
      setPicking('end');
    } else {
      if (ymd < rangeStart) {
        // Restart selection
        setRangeStart(ymd);
        setRangeEnd('');
        setPicking('end');
      } else {
        // Complete the range (single day if same as start)
        setRangeEnd(ymd);
        setPicking('start');
        onApplyRange(rangeStart, ymd);
        setRangeStart('');
        setRangeEnd('');
      }
    }
  };

  const handleClearRange = () => {
    setRangeStart('');
    setRangeEnd('');
    setPicking('start');
  };

  return (
    <div className={styles.availExpanded}>
      {/* From / To summary */}
      <div className={styles.availSummary}>
        <button
          type="button"
          className={`${styles.availSummaryBtn} ${picking === 'start' ? styles.availSummaryBtnActive : ''}`}
          onClick={handleClearRange}
        >
          <span className={styles.availSummaryLabel}>From</span>
          <span className={styles.availSummaryValue}>{formatSummaryDate(rangeStart)}</span>
        </button>
        <span className={styles.availSummaryArrow}>→</span>
        <button
          type="button"
          className={`${styles.availSummaryBtn} ${picking === 'end' ? styles.availSummaryBtnActive : ''}`}
          onClick={() => { if (rangeStart) setPicking('end'); }}
          disabled={!rangeStart}
        >
          <span className={styles.availSummaryLabel}>To</span>
          <span className={styles.availSummaryValue}>{formatSummaryDate(rangeEnd)}</span>
        </button>
      </div>

      {/* Hint */}
      {picking === 'start' && !rangeStart && (
        <p className={styles.availCalHint}>Tap a start date to toggle availability</p>
      )}
      {picking === 'end' && rangeStart && (
        <p className={styles.availCalHint}>Now tap an end date</p>
      )}

      {/* Month nav */}
      <div className={styles.availMonthNav}>
        <button type="button" className={styles.availMonthBtn} onClick={onPrevMonth}>‹</button>
        <span className={styles.availMonthLabel}>{monthLabel}</span>
        <button type="button" className={styles.availMonthBtn} onClick={onNextMonth}>›</button>
      </div>

      {/* Day-of-week headers + grid */}
      <div className={styles.availCalGrid}>
        {DOW_LABELS.map(d => (
          <div key={d} className={styles.availDowHeader}>{d}</div>
        ))}

        {grid.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} />;

          const ymd = toYMD(date);
          const isPast = date < today;
          const isToday = sameDay(date, today);
          const status = dayStatus(ymd, localDates, availabilityDefault);

          // Range selection highlight
          const isSingleDay = rangeStart === rangeEnd && rangeStart === ymd;
          const isRangeStart = ymd === rangeStart && rangeStart !== rangeEnd;
          const isRangeEnd = ymd === rangeEnd && rangeStart !== rangeEnd;
          const isInRange = rangeStart && rangeEnd && ymd > rangeStart && ymd < rangeEnd;
          const isRangeEndpoint = ymd === rangeStart || ymd === rangeEnd;

          // Outer: handles the range-strip background
          let outerCls = styles.availCalOuter;
          if (isRangeStart && rangeEnd) outerCls += ` ${styles.availCalOuter_start}`;
          else if (isRangeEnd) outerCls += ` ${styles.availCalOuter_end}`;
          else if (isInRange) outerCls += ` ${styles.availCalOuter_mid}`;

          // Inner: the visible circle
          let innerCls = styles.availCalInner;
          if (isPast) innerCls += ` ${styles.availCalInner_past}`;
          else if (isToday && !isRangeEndpoint) innerCls += ` ${styles.availCalInner_today}`;
          else if (isRangeEndpoint || isSingleDay) innerCls += ` ${styles.availCalInner_endpoint}`;
          else if (isInRange) innerCls += ` ${styles.availCalInner_inRange}`;
          else if (status === 'available') innerCls += ` ${styles.availCalInner_available}`;
          else innerCls += ` ${styles.availCalInner_unavailable}`;

          // Show ✓ / strikethrough only for non-special states
          const showStatus = !isPast && !isRangeEndpoint && !isInRange && !isSingleDay && !isToday;

          return (
            <button
              key={ymd}
              type="button"
              className={outerCls}
              disabled={isPast}
              onClick={() => handleDayClick(ymd)}
            >
              <span className={innerCls}>
                <span className={showStatus && status === 'unavailable' ? styles.availCalDayNumStrike : styles.availCalDayNum}>
                  {date.getDate()}
                </span>
                {showStatus && status === 'available' && (
                  <span className={styles.availCalCheck}>✓</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className={styles.availLegend}>
        <span className={styles.availLegendDot} style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)' }} />
        <span className={styles.availLegendLabel}>Available ✓</span>
        <span className={styles.availLegendDot} style={{ background: 'rgba(200,92,63,0.5)', border: 'none' }} />
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

  const COLLAPSE_MS = 200; // must match availPanelOut duration

  const [expanded, setExpanded] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [localDates, setLocalDates] = useState(unavailableDatesV2);
  const [viewMonth, setViewMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const stripRef = useRef(null);
  const collapseRef = useRef(null);

  const collapse = useCallback(() => {
    setIsCollapsing(true);
    collapseRef.current = setTimeout(() => {
      setExpanded(false);
      setIsCollapsing(false);
    }, COLLAPSE_MS);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(collapseRef.current), []);

  // Collapse on outside click
  useEffect(() => {
    if (!expanded) return;
    const onDown = (e) => {
      if (stripRef.current && !stripRef.current.contains(e.target)) {
        collapse();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [expanded, collapse]);

  const handleEdit = () => {
    setLocalDates(unavailableDatesV2);
    setViewMonth({ year: today.getFullYear(), month: today.getMonth() });
    setSaveError('');
    setExpanded(true);
    setIsCollapsing(false);
  };

  // Toggle all dates in a range
  const handleApplyRange = useCallback((start, end) => {
    setLocalDates(prev => {
      const set = new Set(prev);
      const cur = parseYMD(start);
      const stop = parseYMD(end);
      while (cur <= stop) {
        const ymd = toYMD(cur);
        if (set.has(ymd)) set.delete(ymd);
        else set.add(ymd);
        cur.setDate(cur.getDate() + 1);
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
      collapse();
      onSaved?.(localDates);
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isOpen = expanded || isCollapsing;

  return (
    <div
      className={`${styles.availStripCard}${isOpen ? ` ${styles.availStripCard_expanded}` : ''}`}
      ref={stripRef}
      onClick={(e) => {
        if (!expanded && !isCollapsing) {
          handleEdit();
        } else if (expanded && !isCollapsing && !e.target.closest('button, input')) {
          collapse();
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      {!expanded && !isCollapsing ? (
        /* Collapsed strip */
        <div className={styles.availStripCollapsed}>
          <div className={styles.availStripTop}>
            <span className={styles.availStripLabel}>Your availability · {monthLabel}</span>
          </div>
          <MiniDayStrip
            days={miniDays}
            unavailableDatesV2={unavailableDatesV2}
            availabilityDefault={availabilityDefault}
          />
          <p className={styles.availHelpText}>Days when you need a sitter are automatically marked unavailable for you.</p>
        </div>
      ) : (
        /* Expanded calendar */
        <div className={`${styles.availStripExpandedWrap}${isCollapsing ? ` ${styles.availStripExpandedWrap_closing}` : ''}`}>
          <div className={styles.availEditTitle}>
            <span className={styles.availEditTitleMain}>Your available dates for cat sitting</span>
            <span className={styles.availEditTitleClose}>Tap anywhere to close</span>
          </div>

          <div className={styles.availCalWrap}>
            <ExpandedCalendar
              localDates={localDates}
              availabilityDefault={availabilityDefault}
              onApplyRange={handleApplyRange}
              viewMonth={viewMonth}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />
          </div>

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
