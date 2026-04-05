'use client';

import { useState, useRef } from 'react';
import { DayPicker } from 'react-day-picker';
import styles from './Care.module.css';

function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function BlockedDateOverrideModal({ date, onCancel, onConfirm }) {
  const label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <div className={styles.rdpOverlayBackdrop}>
      <div className={styles.rdpOverlayModal}>
        <p className={styles.rdpOverlayText}>
          <strong>{label}</strong> is blocked because your cats are being looked after. Are you sure you want to mark yourself as available?
        </p>
        <div className={styles.rdpOverlayBtns}>
          <button type="button" className={styles.rdpOverlayCancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={styles.rdpOverlayConfirmBtn} onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Props:
 *   markedDates          – string[] of YYYY-MM-DD strings
 *   availabilityDefault  – 'available' | 'unavailable' (default: 'available')
 *   onChange             – (dates: string[]) => void  (omit for read-only)
 *   onDefaultChange      – (newDefault: string) => void
 *   readOnly             – boolean, default false
 *   blockedDates         – string[] of YYYY-MM-DD from accepted bookings (optional)
 *
 * Legacy compat: also accepts `unavailableDates` prop (treated as markedDates)
 */
export default function AvailabilityCalendar({
  markedDates,
  unavailableDates, // legacy alias
  availabilityDefault = 'available',
  onChange,
  onDefaultChange,
  onOverride,       // (ymd: string) => void — called when a blocked date is confirmed overridden
  readOnly = false,
  blockedDates = [],
}) {
  const dates = markedDates ?? unavailableDates ?? [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewMonth, setViewMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [overriddenDates, setOverriddenDates] = useState(new Set());
  const [pendingOverride, setPendingOverride] = useState(null); // Date | null
  const lastClickedRef = useRef(null);

  const isBlocked = (ymd) => blockedDates.includes(ymd);
  const isOverridden = (ymd) => overriddenDates.has(ymd);
  const isAvailFn = (ymd) =>
    availabilityDefault === 'available'
      ? !dates.includes(ymd)
      : dates.includes(ymd);

  // ─── Modifier functions (applied to day buttons) ─────────────────────────────
  const modifiers = {
    availDay: (d) => {
      if (d < today) return false;
      const y = toYMD(d);
      return !isBlocked(y) && isAvailFn(y);
    },
    unavailDay: (d) => {
      if (d < today) return false;
      const y = toYMD(d);
      return !isBlocked(y) && !isAvailFn(y);
    },
    blockedDay: (d) => {
      if (d < today) return false;
      const y = toYMD(d);
      return isBlocked(y) && !isOverridden(y);
    },
    overriddenDay: (d) => {
      if (d < today) return false;
      const y = toYMD(d);
      return isBlocked(y) && isOverridden(y);
    },
  };

  const modifiersStyles = {
    availDay: {
      background: '#EAF3DE',
      color: '#2C5F4F',
      fontWeight: 600,
      borderRadius: '6px',
    },
    unavailDay: {
      background: '#FCE8DF',
      color: '#B84A2E',
      textDecoration: 'line-through',
      borderRadius: '6px',
    },
    blockedDay: {
      background: '#FEF3C7',
      color: '#92400E',
      borderRadius: '6px',
    },
    overriddenDay: {
      background: 'repeating-linear-gradient(45deg, #FEF3C7, #FEF3C7 5px, #D1FAE5 5px, #D1FAE5 10px)',
      color: '#2C5F4F',
      borderRadius: '6px',
    },
  };

  // ─── Click handling ──────────────────────────────────────────────────────────
  const handleDayClick = (date, _modifiers, e) => {
    if (readOnly || !onChange) return;
    if (date < today) return;

    const ymd = toYMD(date);

    // Blocked and not yet overridden → show confirmation modal
    if (isBlocked(ymd) && !isOverridden(ymd)) {
      setPendingOverride(date);
      return;
    }

    // Shift+click range selection
    if (e?.shiftKey && lastClickedRef.current && lastClickedRef.current !== ymd) {
      const anchor = lastClickedRef.current;
      const anchorMarked = dates.includes(anchor);
      const [a, b] = anchor < ymd ? [anchor, ymd] : [ymd, anchor];
      const [ay, am, ad] = a.split('-').map(Number);
      const [by, bm, bd] = b.split('-').map(Number);
      const end = new Date(by, bm - 1, bd);
      const range = [];
      for (let cur = new Date(ay, am - 1, ad); cur <= end; cur.setDate(cur.getDate() + 1)) {
        const dYmd = toYMD(cur);
        if (dYmd >= toYMD(today)) range.push(dYmd);
      }
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

  const handleOverrideConfirm = () => {
    if (!pendingOverride) return;
    const ymd = toYMD(pendingOverride);
    // Record as overridden locally so the visual state changes
    setOverriddenDates(prev => new Set([...prev, ymd]));
    // Notify parent so it can track which blocked dates were overridden for blockedByBooking sync
    onOverride?.(ymd);
    // Make the date available in markedDates
    let next;
    if (availabilityDefault === 'available') {
      // default=available: markedDates = unavailable days → remove to make available
      next = dates.filter(d => d !== ymd);
    } else {
      // default=unavailable: markedDates = available days → add to make available
      next = dates.includes(ymd) ? dates : [...dates, ymd];
    }
    onChange?.(next);
    setPendingOverride(null);
  };

  const hintText = availabilityDefault === 'available'
    ? 'Tap a date to mark it unavailable. Shift+click to select a range.'
    : 'Tap a date to mark it available. Shift+click to select a range.';

  return (
    <div className={styles.rdpWrap}>
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

      <DayPicker
        className="purrfect-rdp"
        month={viewMonth}
        onMonthChange={setViewMonth}
        disabled={{ before: today }}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        onDayButtonClick={handleDayClick}
        onDayButtonMouseDown={(date, _modifiers, e) => {
          if (e?.shiftKey) e.preventDefault(); // prevent text selection
        }}
      />

      {/* Legend */}
      {!readOnly && (
        <div className={styles.rdpLegend}>
          <span className={styles.rdpLegendItem}>
            <span className={styles.rdpLegendDot} style={{ background: '#EAF3DE', border: '1px solid #a3c98a' }} />
            Available
          </span>
          <span className={styles.rdpLegendItem}>
            <span className={styles.rdpLegendDot} style={{ background: '#FCE8DF', border: '1px solid #e4a98a' }} />
            Unavailable
          </span>
          {blockedDates.length > 0 && (
            <>
              <span className={styles.rdpLegendItem}>
                <span className={styles.rdpLegendDot} style={{ background: '#FEF3C7', border: '1px solid #f0c040' }} />
                Booking
              </span>
              <span className={styles.rdpLegendItem}>
                <span
                  className={styles.rdpLegendDot}
                  style={{
                    background: 'repeating-linear-gradient(45deg, #FEF3C7, #FEF3C7 5px, #D1FAE5 5px, #D1FAE5 10px)',
                    border: '1px solid #a3c98a',
                  }}
                />
                Override
              </span>
            </>
          )}
        </div>
      )}

      {!readOnly && (
        <p className={styles.rdpHint}>{hintText}</p>
      )}

      {pendingOverride && (
        <BlockedDateOverrideModal
          date={pendingOverride}
          onCancel={() => setPendingOverride(null)}
          onConfirm={handleOverrideConfirm}
        />
      )}
    </div>
  );
}
