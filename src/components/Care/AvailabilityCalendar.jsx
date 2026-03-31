'use client';

import styles from './Care.module.css';

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const STRIP_DAYS = 14;

function toYMD(date) {
  // YYYY-MM-DD in local time
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysBetween(a, b) {
  return Math.round((b - a) / 86400000);
}

/**
 * Returns true if ymd (YYYY-MM-DD) falls within any of the blocked ranges.
 * Ranges are { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }.
 */
function isInRanges(ymd, ranges) {
  for (const r of ranges) {
    if (r.start && r.end && ymd >= r.start && ymd <= r.end) return true;
    // single-day range or open-ended
    if (r.start && !r.end && ymd === r.start) return true;
  }
  return false;
}

/**
 * Returns true if ymd is in the unavailableDates array (exact date strings).
 */
function isUnavailableDate(ymd, unavailableDates) {
  return (unavailableDates || []).includes(ymd);
}

export default function AvailabilityCalendar({ form, updatedAt }) {
  const { alwaysAvailable, availableDates = [], unavailableDates = [] } = form;

  // Build 14-day strip from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayYMD = toYMD(today);

  const days = Array.from({ length: STRIP_DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return { date: d, ymd: toYMD(d), dow: d.getDay() };
  });

  // Determine availability for each day
  function isAvailable(ymd) {
    if (alwaysAvailable) {
      // available unless blocked
      return !isUnavailableDate(ymd, unavailableDates) && !isInRanges(ymd, []);
    } else {
      // available only if in one of the available date ranges
      return isInRanges(ymd, availableDates);
    }
  }

  // Staleness
  let staleness = null;
  if (updatedAt) {
    const updated = new Date(updatedAt);
    const daysAgo = daysBetween(updated, new Date());
    staleness = { daysAgo, stale: daysAgo > 14 };
  }

  const modeLabel = alwaysAvailable
    ? 'Available unless marked'
    : 'Available on selected dates only';

  return (
    <div className={styles.availCalendar}>
      <div className={styles.availCalendarHeader}>
        <span className={styles.availCalendarMode}>{modeLabel}</span>
      </div>

      {/* Day columns */}
      <div className={styles.availStrip}>
        {days.map(({ date, ymd, dow }) => {
          const avail = isAvailable(ymd);
          const isToday = ymd === todayYMD;
          return (
            <div key={ymd} className={styles.availDayCol}>
              <span className={styles.availDayInitial}>{DAY_INITIALS[dow]}</span>
              <div
                className={[
                  styles.availDaySquare,
                  avail ? styles.availDayGreen : styles.availDayGrey,
                  isToday ? styles.availDayToday : '',
                ].join(' ')}
              >
                <span className={styles.availDayNum}>{date.getDate()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Staleness */}
      {staleness !== null && (
        <p
          className={styles.availStaleness}
          style={staleness.stale ? { color: '#b45309' } : {}}
        >
          Last updated {staleness.daysAgo === 0 ? 'today' : `${staleness.daysAgo} day${staleness.daysAgo !== 1 ? 's' : ''} ago`}
          {staleness.stale && ' · consider refreshing your availability'}
        </p>
      )}
    </div>
  );
}
