'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import posthog from 'posthog-js';
import styles from './Care.module.css';
import CatAvatar from './CatAvatar';
import WaiverModal from './WaiverModal';
import BookingRequestModal from './BookingRequestModal';

const TAG_LABELS = {
  en: {
    shy: 'Shy', confident: 'Confident', gentle: 'Gentle', playful: 'Playful', independent: 'Independent',
    good_with_cats: 'Good with other cats', prefers_solo: 'Prefers to be only cat', good_with_kids: 'Good with kids',
    senior: 'Senior', special_needs: 'Special needs', on_medication: 'On medication', indoor_only: 'Indoor only',
    wet: 'Wet food', dry: 'Dry food', medication: 'Medication', 'special diet': 'Special diet',
  },
  de: {
    shy: 'Schüchtern', confident: 'Selbstbewusst', gentle: 'Sanft', playful: 'Verspielt', independent: 'Selbstständig',
    good_with_cats: 'Verträgt andere Katzen', prefers_solo: 'Lieber allein', good_with_kids: 'Verträgt Kinder',
    senior: 'Senior', special_needs: 'Besondere Bedürfnisse', on_medication: 'Medikamentenbedarf', indoor_only: 'Nur für drinnen',
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
  sitType = null,
  bookingState = null,
  onBooked,
  onWithdrawn,
  expanded = false,
  onExpand,
}) {
  const tagLabels = TAG_LABELS[locale] || TAG_LABELS.en;

  const {
    _id, _createdAt, name,
    identityVerified, trustedSitter, siteAdmin,
    photoUrl, avatarColour, coverImageUrl,
    feedingTypes, behavioralTraits, bio,
    cats, _distance, location,
    availabilityDefault, maxCatsPerDay,
    canDoHomeVisit, canHostCats,
  } = sitter;

  // Whether the sitter can do both types — requires user to pick one if no filter applied
  const sitterDoesBoth = !!(canDoHomeVisit && canHostCats);

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
  const coverSrc = coverImageUrl || COVERS[idx];
  const coverBg = COVER_FALLBACKS[idx];
  const hasDates = !!(startDate && endDate);

  // ── UX-10: traits expand toggle ───────────────────────────────────────────
  const [traitsExpanded, setTraitsExpanded] = useState(false);
  // ── Profile modal ─────────────────────────────────────────────────────────
  const [profileOpen, setProfileOpen] = useState(false);
  // ── Booking flow state ────────────────────────────────────────────────────
  const [waiverOpen, setWaiverOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingModalKey, setBookingModalKey] = useState(0);

  const openBookingFlow = () => {
    if (posthog.__loaded) posthog.capture('booking_initiated', { sitter_id: _id });
    const waiverAccepted = typeof window !== 'undefined' && localStorage.getItem('pl_waiver_accepted');
    if (waiverAccepted) {
      setBookingModalKey(k => k + 1);
      setBookingModalOpen(true);
    } else {
      setWaiverOpen(true);
    }
  };
  const [myCatData, setMyCatData] = useState(null); // null = not yet fetched, [] = fetched but empty
  const myCats = myCatData ? myCatData.map(c => c.name).filter(Boolean) : null;
  const [selectedCats, setSelectedCats] = useState([]);
  const [localSitType, setLocalSitType] = useState(sitType); // null until user picks when sitter does both
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Analytics: fire sitter_card_viewed once when card scrolls into view
  const cardRef = useRef(null);
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !_id) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (posthog.__loaded) posthog.capture('sitter_card_viewed', { sitter_id: _id });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [_id]);

  // Compatibility: traits of selected cats that match sitter's behavioralTraits
  const catTraitSet = new Set(
    (myCatData || [])
      .filter(c => selectedCats.includes(c.name))
      .flatMap(c => c.personality || [])
  );

  // Lazy-fetch the logged-in user's cats on first expand
  useEffect(() => {
    if (!expanded || myCatData !== null) return;
    fetch('/api/care/profile')
      .then(r => r.json())
      .then(doc => {
        const cats = doc.cats || [];
        setMyCatData(cats);
        const names = cats.map(c => c.name).filter(Boolean);
        if (names.length === 1) setSelectedCats(names);
      })
      .catch(() => setMyCatData([]));
  }, [expanded, myCatData]);

  // Reset form when card collapses
  useEffect(() => {
    if (!expanded) {
      setSelectedCats([]);
      setLocalSitType(sitType);
      setNote('');
      setFormError('');
      setSubmitting(false);
    }
  }, [expanded, sitType]);

  const toggleCat = (catName) => {
    setSelectedCats(prev =>
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
    );
  };

  const handleWithdraw = async () => {
    if (!bookingState?._id) return;
    setWithdrawing(true);
    try {
      await fetch('/api/care/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: bookingState._id, reason: 'Request withdrawn by sender.' }),
      });
      onWithdrawn?.();
    } catch { /* silent */ }
    setWithdrawing(false);
  };

  const handleSubmit = async () => {
    setFormError('');
    if (sitterDoesBoth && !sitType && !localSitType) {
      setFormError('Please choose a sit type.');
      return;
    }
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
          sitType: localSitType || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to send request.');
        return;
      }
      onBooked?.(data.bookingRef, data.bookingId);
      onExpand?.(); // collapse the card
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <div className={styles.card} ref={cardRef}>
      {/* Cover */}
      <div
        className={styles.cardCover}
        style={coverImageUrl
          ? { backgroundImage: `url(${coverSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { backgroundImage: `url(${coverSrc})`, backgroundColor: coverBg }
        }
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
            {(_distance !== undefined || location?.name) && (
              <div className={styles.cardDistLabel}>
                {_distance !== undefined ? `~${_distance.toFixed(1)} km` : ''}
                {_distance !== undefined && location?.name ? ' · ' : ''}
                {location?.name || ''}
              </div>
            )}
          </div>
          <div className={styles.cardIconRow}>
            <button
              type="button"
              className={styles.cardIconBtn}
              title="View profile"
              onClick={() => setProfileOpen(true)}
            >
              <IconPerson />
            </button>
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

        {/* Capabilities checklist — UX-10: tap "+N more" to expand inline */}
        {allCaps.length > 0 && (
          <>
            <div className={styles.cardChecklistLabel}>Cats I can handle</div>
            <div className={styles.cardChecklist}>
              {(traitsExpanded ? allCaps : shownCaps).map(cap => (
                <div key={cap} className={styles.cardCheckItem}>
                  <CheckIcon />
                  <span>{tagLabels[cap] || cap}</span>
                </div>
              ))}
              {!traitsExpanded && extraCount > 0 && (
                <div
                  className={styles.cardCheckMore}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={e => { e.stopPropagation(); setTraitsExpanded(true); }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setTraitsExpanded(true); } }}
                >
                  +{extraCount} more
                </div>
              )}
              {traitsExpanded && extraCount > 0 && (
                <div
                  className={styles.cardCheckMore}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={e => { e.stopPropagation(); setTraitsExpanded(false); }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setTraitsExpanded(false); } }}
                >
                  show less
                </div>
              )}
            </div>
          </>
        )}

        <div className={styles.cardDivider} />

        {/* Primary CTA — stopPropagation so card click doesn't fire */}
        {hasDates && (bookingState?.status === 'confirmed' || bookingState?.status === 'accepted') ? (
          <div style={{ display: 'flex', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
            <div className={styles.cardBookConfirmed}>
              <svg width="10" height="10" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="6.5" fill="#2C5F4F"/>
                <path d="M3.5 6.5l2 2 4-4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Confirmed · #{bookingState.bookingRef}
            </div>
          </div>
        ) : hasDates && bookingState?.status === 'pending' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
            <div className={styles.cardBookPending}>
              <span className={styles.cardBookPendingDot} />
              Awaiting approval
            </div>
            <button
              type="button"
              className={styles.cardWithdrawBtn}
              onClick={handleWithdraw}
              disabled={withdrawing}
            >
              {withdrawing ? 'Withdrawing…' : 'Withdraw request'}
            </button>
          </div>
        ) : hasDates && !expanded ? (
          <button
            type="button"
            className={styles.cardBookBtn}
            onClick={e => { e.stopPropagation(); openBookingFlow(); }}
          >
            {locale === 'de' ? 'Für diese Daten anfragen' : 'Book for these dates'}
          </button>
        ) : !hasDates ? (
          <Link href={`/care/${_id}`} className={styles.cardBookBtn} onClick={e => e.stopPropagation()}>
            {locale === 'de' ? 'Profil ansehen' : 'View profile'}
          </Link>
        ) : null}

        {/* ── Inline booking form (expands below CTA) ── */}
        <div className={`${styles.cardExpand} ${expanded ? styles.cardExpandOpen : ''}`} onClick={e => e.stopPropagation()}>
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
              {myCats.map(catName => {
                const selected = selectedCats.includes(catName);
                return (
                  <button
                    key={catName}
                    type="button"
                    className={`${styles.catChip} ${selected ? styles.catChipSelected : styles.catChipUnselected}`}
                    onClick={() => toggleCat(catName)}
                  >
                    {selected && (
                      <span className={styles.catChipCheck}>
                        <svg viewBox="0 0 8 8" fill="none" width="8" height="8">
                          <path d="M1 4l2 2 4-4" stroke="#2C5F4F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                    {catName}
                  </button>
                );
              })}
            </div>
          )}

          {/* Compatibility signal — shown when cats selected and sitter has traits */}
          {selectedCats.length > 0 && catTraitSet.size > 0 && (behavioralTraits || []).length > 0 && (
            <div className={styles.traitCompatBlock}>
              <p className={styles.cardFormLabel}>Compatibility</p>
              <div className={styles.traitCompatRow}>
                {(behavioralTraits || []).map(trait => (
                  <span
                    key={trait}
                    className={`${styles.traitCompatChip} ${catTraitSet.has(trait) ? styles.traitCompatMatch : ''}`}
                  >
                    {tagLabels[trait] || trait}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sit type — picker when sitter does both and no filter applied, else read-only confirmation */}
          {sitterDoesBoth && !sitType ? (
            <div style={{ marginBottom: '0.75rem' }}>
              <p className={styles.cardFormLabel}>Sit type <span style={{ color: '#C85C3F' }}>*</span></p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[
                  { value: 'home_visit', label: 'Home visit', desc: 'sitter comes to you' },
                  { value: 'drop_off',   label: 'Drop off',   desc: 'you bring your cat to the sitter' },
                ].map(({ value, label, desc }) => (
                  <label
                    key={value}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.5rem 0.75rem', borderRadius: 8, cursor: 'pointer',
                      border: localSitType === value ? '1.5px solid #2C5F4F' : '1.5px solid #e5e7eb',
                      background: localSitType === value ? '#F0F7F4' : '#fafafa',
                    }}
                  >
                    <input
                      type="radio"
                      name={`sittype-${_id}`}
                      value={value}
                      checked={localSitType === value}
                      onChange={() => setLocalSitType(value)}
                      style={{ accentColor: '#2C5F4F', width: 15, height: 15 }}
                    />
                    <span style={{ fontSize: '0.875rem', color: '#2D2D2D' }}>
                      <strong style={{ fontWeight: 600 }}>{label}</strong>
                      <span style={{ color: '#888', fontWeight: 400 }}> — {desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : sitType ? (
            <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 8, background: '#F0F7F4', border: '1px solid #C8E6C9' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#2C5F4F', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sit type</p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.875rem', color: '#2D2D2D' }}>
                {sitType === 'home_visit' ? 'Home visit — sitter comes to you' : 'Drop off — you bring your cat to the sitter'}
              </p>
            </div>
          ) : null}

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

    {waiverOpen && (
      <WaiverModal
        locale={locale}
        onAgree={() => {
          localStorage.setItem('pl_waiver_accepted', '1');
          setWaiverOpen(false);
          setBookingModalKey(k => k + 1);
          setBookingModalOpen(true);
        }}
        onCancel={() => setWaiverOpen(false)}
      />
    )}

    {bookingModalOpen && (
      <BookingRequestModal
        key={bookingModalKey}
        sitterId={_id}
        sitterName={displayName}
        startDate={startDate}
        endDate={endDate}
        canDoHomeVisit={canDoHomeVisit}
        canHostCats={canHostCats}
        sitterProfile={sitter}
        onClose={() => setBookingModalOpen(false)}
        onSuccess={({ bookingRef, bookingId }) => {
          onBooked?.(bookingRef, bookingId);
        }}
      />
    )}

    {/* ── Profile modal ── */}
    {profileOpen && createPortal(
      <div className={styles.sitterModalOverlay} onClick={() => setProfileOpen(false)}>
        <div className={styles.sitterModal} onClick={e => e.stopPropagation()}>
          <div
            className={styles.sitterModalCover}
            style={coverImageUrl
              ? { backgroundImage: `url(${coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { backgroundImage: `url(${coverSrc})`, backgroundColor: coverBg }
            }
          >
            <button type="button" className={styles.sitterModalCloseBtn} onClick={() => setProfileOpen(false)} aria-label="Close">×</button>
            <div style={{ position: 'absolute', bottom: -26, left: 20 }}>
              <CatAvatar photoUrl={photoUrl} avatarColour={avatarColour} name={displayName} size={52} style={{ border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
            </div>
          </div>

          <div className={styles.sitterModalBody}>
            <p className={styles.sitterModalName}>
              {displayName}
              {identityVerified && <span className={styles.verifiedBadge} title="Identity verified"> ✓</span>}
              {trustedSitter && <span className={styles.trustedBadge} title="Trusted sitter"> ⭐</span>}
            </p>
            <p className={styles.sitterModalMeta}>
              {[
                _distance != null ? `~${_distance.toFixed(1)} km away` : null,
                location?.name || null,
                memberSince ? `Member since ${memberSince}` : null,
              ].filter(Boolean).join(' · ')}
            </p>

            {bio && <p className={styles.sitterModalBio}>{bio}</p>}

            {availLabel && (
              <div className={styles.sitterModalSection}>
                <p className={styles.sitterModalSectionTitle}>Availability</p>
                <div className={styles.cardAvailRow}>
                  <div className={styles.cardAvailDot} />
                  <span className={styles.cardAvailText}>{availLabel}</span>
                </div>
              </div>
            )}

            {(canDoHomeVisit || canHostCats) && (
              <div className={styles.sitterModalSection}>
                <p className={styles.sitterModalSectionTitle}>Sits offered</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {canDoHomeVisit && <span className={styles.capabilityPill}>Home visits</span>}
                  {canHostCats && <span className={styles.capabilityPill}>Drop-off</span>}
                  {maxCatsPerDay > 0 && <span className={styles.capabilityPill}>Up to {maxCatsPerDay} cat{maxCatsPerDay !== 1 ? 's' : ''}/day</span>}
                </div>
              </div>
            )}

            {allCaps.length > 0 && (
              <div className={styles.sitterModalSection}>
                <p className={styles.sitterModalSectionTitle}>Cats I can handle</p>
                <div className={styles.cardChecklist}>
                  {allCaps.map(cap => (
                    <div key={cap} className={styles.cardCheckItem}>
                      <CheckIcon />
                      <span>{tagLabels[cap] || cap}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(cats || []).length > 0 && (
              <div className={styles.sitterModalSection}>
                <p className={styles.sitterModalSectionTitle}>Their cats</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {(cats || []).map((cat, i) => {
                    const meta = [
                      cat.breed || null,
                      cat.age != null ? `${cat.age} yr${cat.age !== 1 ? 's' : ''}` : null,
                    ].filter(Boolean).join(' · ');
                    const personalityTags = (cat.personality || []);
                    return (
                      <div key={cat.name || i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                        {cat.photoUrl ? (
                          <img src={cat.photoUrl} alt={cat.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #e5e7eb' }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EAF3DE', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🐱</div>
                        )}
                        <div>
                          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#2D2D2D' }}>{cat.name || 'Cat'}</p>
                          {meta && <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#888' }}>{meta}</p>}
                          {personalityTags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.3rem' }}>
                              {personalityTags.map(tag => (
                                <span key={tag} style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 999, background: '#F5F0E8', color: '#5A4033', fontWeight: 500 }}>
                                  {tagLabels[tag] || tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {hasDates && !bookingState?.status ? (
              <button
                type="button"
                className={styles.sitterModalBookBtn}
                onClick={() => { setProfileOpen(false); openBookingFlow(); }}
              >
                {locale === 'de' ? 'Für diese Daten anfragen' : 'Book for these dates'}
              </button>
            ) : !hasDates ? (
              <Link href={`/care/${_id}`} className={styles.sitterModalBookBtn}>
                View full profile
              </Link>
            ) : null}
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
