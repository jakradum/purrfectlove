'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Care.module.css';
import CatAvatar from './CatAvatar';

const TAG_LABELS = {
  en: {
    shy: 'Shy', energetic: 'Energetic', senior: 'Senior', 'special needs': 'Special Needs',
    wet: 'Wet food', dry: 'Dry food', medication: 'Medication', 'special diet': 'Special diet',
  },
  de: {
    shy: 'Schüchtern', energetic: 'Energisch', senior: 'Senior', 'special needs': 'Besondere Bedürfnisse',
    wet: 'Nassfutter', dry: 'Trockenfutter', medication: 'Medikamente', 'special diet': 'Spezialdiät',
  },
};

const COVERS = [
  '/images/care/cover-pattern-1.png',
  '/images/care/cover-pattern-2.png',
  '/images/care/cover-pattern-3.png',
];

const COVER_FALLBACKS = ['#F6F4F0', '#F5D5C8', '#D4E4DF'];

function coverIndex(id) {
  if (!id) return 0;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h * 31) + id.charCodeAt(i)) >>> 0;
  return h % 3;
}

function IconMessage() {
  return (
    <svg viewBox="0 0 14 14" fill="none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" stroke="#666">
      <path d="M1 1h12a.5.5 0 01.5.5v8a.5.5 0 01-.5.5H4l-3 2.5V1.5A.5.5 0 011 1z"/>
    </svg>
  );
}

function IconPerson() {
  return (
    <svg viewBox="0 0 14 14" fill="none" strokeWidth="1.2" strokeLinecap="round" width="14" height="14" stroke="#666">
      <circle cx="7" cy="5" r="2.5"/>
      <path d="M1.5 13c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <div className={styles.cardCheckIcon}>
      <svg viewBox="0 0 9 9" fill="none" width="9" height="9">
        <path d="M1.5 4.5l2 2 4-4" stroke="#2C5F4F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

export default function SitterCard({
  sitter,
  locale = 'en',
  availabilityUnconfirmed = false,
  startDate,
  endDate,
  bookingState = null,
  onBooked,
  expanded = false,
  onExpand,
}) {
  const tagLabels = TAG_LABELS[locale] || TAG_LABELS.en;

  const {
    _id, _createdAt, name,
    identityVerified, trustedSitter, siteAdmin,
    photoUrl, avatarColour,
    feedingTypes, behavioralTraits,
    cats, _distance,
    availabilityDefault, maxCatsPerDay,
  } = sitter;

  const displayName = name || 'Member';

  const memberSince = _createdAt
    ? new Date(_createdAt).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { month: 'short', year: 'numeric' })
    : null;

  const catNames = (cats || []).map(c => c.name).filter(Boolean);
  const catNamesDisplay = catNames.length === 0
    ? null
    : catNames.length === 1
    ? catNames[0]
    : `${catNames.slice(0, -1).join(', ')} & ${catNames[catNames.length - 1]}`;

  const allCaps = [...new Set([...(behavioralTraits || []), ...(feedingTypes || [])])];
  const shownCaps = allCaps.slice(0, 4);
  const extraCount = allCaps.length - shownCaps.length;

  let availLabel = null;
  if (availabilityDefault === 'unavailable') {
    availLabel = locale === 'de' ? 'Verfügbarkeit auf Anfrage' : 'Availability on request';
  } else if (availabilityDefault === 'available') {
    availLabel = locale === 'de' ? 'Generell verfügbar' : 'Generally available';
  }

  const idx = coverIndex(_id || '');
  const coverSrc = COVERS[idx];
  const coverBg = COVER_FALLBACKS[idx];
  const hasDates = !!(startDate && endDate);

  // ── Inline booking form state ──────────────────────────────────────────────
  const [myCats, setMyCats] = useState(null); // null = not yet fetched
  const [selectedCats, setSelectedCats] = useState([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Lazy-fetch the logged-in user's cats on first expand
  useEffect(() => {
    if (!expanded || myCats !== null) return;
    fetch('/api/care/profile')
      .then(r => r.json())
      .then(doc => {
        const names = (doc.cats || []).map(c => c.name).filter(Boolean);
        setMyCats(names);
        if (names.length === 1) setSelectedCats(names);
      })
      .catch(() => setMyCats([]));
  }, [expanded, myCats]);

  // Reset form when card collapses
  useEffect(() => {
    if (!expanded) {
      setSelectedCats([]);
      setNote('');
      setFormError('');
      setSubmitting(false);
    }
  }, [expanded]);

  const toggleCat = (catName) => {
    setSelectedCats(prev =>
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
    );
  };

  const handleSubmit = async () => {
    setFormError('');
    if (selectedCats.length === 0) {
      setFormError('Please select at least one cat.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/care/bookings/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sitterId: _id,
          startDate,
          endDate,
          cats: selectedCats,
          message: note.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to send request.');
        return;
      }
      onBooked?.(data.bookingRef);
      onExpand?.(); // collapse the card
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.card}>
      {/* Cover */}
      <div
        className={styles.cardCover}
        style={{ backgroundImage: `url(${coverSrc})`, backgroundColor: coverBg }}
        aria-hidden="true"
      >
        <div className={styles.cardAvatarWrap}>
          <CatAvatar
            photoUrl={photoUrl}
            avatarColour={avatarColour}
            name={displayName}
            size={52}
            style={{ border: '3px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
          />
        </div>
      </div>

      {/* Card body */}
      <div className={styles.cardBody}>

        {/* Member since — right-aligned */}
        <div className={styles.cardMemberSince}>
          {availabilityUnconfirmed ? (
            <span className={styles.availUnconfirmedBadge}>
              {locale === 'de' ? 'Verfügbarkeit unbestätigt' : 'Availability unconfirmed'}
            </span>
          ) : memberSince ? (
            <>Member since {memberSince}</>
          ) : null}
          {siteAdmin && <span className={styles.adminBadge} style={{ marginLeft: 4 }}>Admin</span>}
        </div>

        {/* Top row: name + distance left, icon buttons right */}
        <div className={styles.cardTopRow}>
          <div>
            <div className={styles.cardUsername}>
              {displayName}
              {identityVerified && <span className={styles.verifiedBadge} title="Identity verified"> ✓</span>}
              {trustedSitter && <span className={styles.trustedBadge} title="Trusted sitter"> ⭐</span>}
            </div>
            {_distance !== undefined && (
              <div className={styles.cardDistLabel}>~{_distance.toFixed(1)} km</div>
            )}
          </div>
          <div className={styles.cardIconRow}>
            <Link href={`/care/${_id}`} className={styles.cardIconBtn} title="View profile">
              <IconPerson />
            </Link>
          </div>
        </div>

        {/* Cat names */}
        {catNamesDisplay && (
          <div className={styles.cardMetaLine}>
            {locale === 'de' ? 'Katzen: ' : 'Parent of '}{catNamesDisplay}
          </div>
        )}

        {/* Availability dot + label */}
        {availLabel && (
          <div className={styles.cardAvailRow}>
            <div className={styles.cardAvailDot} />
            <span className={styles.cardAvailText}>{availLabel}</span>
          </div>
        )}

        {/* Max cats per day */}
        {maxCatsPerDay > 0 && (
          <div className={styles.cardMetaLine}>
            {locale === 'de' ? `Bis zu ${maxCatsPerDay} Katzen pro Tag` : `Up to ${maxCatsPerDay} cat${maxCatsPerDay !== 1 ? 's' : ''} per day`}
          </div>
        )}

        {/* Capabilities checklist */}
        {shownCaps.length > 0 && (
          <div className={styles.cardChecklist}>
            {shownCaps.map(cap => (
              <div key={cap} className={styles.cardCheckItem}>
                <CheckIcon />
                <span>{tagLabels[cap] || cap}</span>
              </div>
            ))}
            {extraCount > 0 && (
              <div className={styles.cardCheckMore}>+{extraCount} more</div>
            )}
          </div>
        )}

        <div className={styles.cardDivider} />

        {/* Primary CTA */}
        {hasDates && (bookingState?.status === 'confirmed' || bookingState?.status === 'accepted') ? (
          <div className={styles.cardBookConfirmed}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="6.5" fill="#2C5F4F"/>
              <path d="M3.5 6.5l2 2 4-4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Booking confirmed · #{bookingState.bookingRef}
          </div>
        ) : hasDates && bookingState?.status === 'pending' ? (
          <div className={styles.cardBookPending}>
            <span className={styles.cardBookPendingDot} />
            Awaiting approval
          </div>
        ) : hasDates && !expanded ? (
          <button
            type="button"
            className={styles.cardBookBtn}
            onClick={onExpand}
          >
            {locale === 'de' ? 'Für diese Daten anfragen' : 'Book for these dates'}
          </button>
        ) : !hasDates ? (
          <Link href={`/care/${_id}`} className={styles.cardBookBtn}>
            {locale === 'de' ? 'Profil ansehen' : 'View profile'}
          </Link>
        ) : null}

        {/* ── Inline booking form (expands below CTA) ── */}
        <div className={`${styles.cardExpand} ${expanded ? styles.cardExpandOpen : ''}`}>
          <div className={styles.cardFormDivider} />

          {/* Cat selector — required */}
          <p className={styles.cardFormLabel}>
            Select your cats <span className={styles.cardFormRequired}>*</span>
          </p>
          <p style={{ fontSize: '11px', color: '#999', marginTop: '-8px', marginBottom: '10px', lineHeight: 1.5 }}>
            Select your cats so the sitter can know how many to expect
          </p>
          {myCats === null ? (
            <p style={{ marginBottom: 12 }}><span className={styles.spinner} style={{ width: 16, height: 16 }} /></p>
          ) : myCats.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.5, marginBottom: 12 }}>
              Add cats to your profile first.{' '}
              <Link href="/care/profile" style={{ color: '#2C5F4F', fontWeight: 600 }}>
                Go to profile →
              </Link>
            </p>
          ) : (
            <div className={styles.catChips}>
              {myCats.map(catName => (
                <button
                  key={catName}
                  type="button"
                  className={`${styles.catChip} ${selectedCats.includes(catName) ? styles.catChipSelected : ''}`}
                  onClick={() => toggleCat(catName)}
                >
                  {catName}
                </button>
              ))}
            </div>
          )}

          {/* Note field — optional */}
          <p className={styles.cardFormLabel}>Note <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#bbb' }}>(optional)</span></p>
          <textarea
            className={styles.cardNoteField}
            placeholder="Any notes for the sitter…"
            value={note}
            onChange={e => setNote(e.target.value)}
          />

          {formError && <p className={styles.cardFormError}>{formError}</p>}

          <div className={styles.cardFormBtnRow}>
            <button
              type="button"
              className={styles.cardFormCancelBtn}
              onClick={onExpand}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.cardFormSendBtn}
              onClick={handleSubmit}
              disabled={submitting || selectedCats.length === 0 || myCats === null}
            >
              {submitting ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
