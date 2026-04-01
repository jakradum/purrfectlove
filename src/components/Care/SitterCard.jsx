'use client';

import Link from 'next/link';
import styles from './Care.module.css';
import contentEN from '@/data/careContent.en.json';
import contentDE from '@/data/careContent.de.json';
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

// Wavy cover pattern PNGs — /public/images/care/cover-pattern-{1,2,3}.png
const COVERS = [
  '/images/care/cover-pattern-1.png',
  '/images/care/cover-pattern-2.png',
  '/images/care/cover-pattern-3.png',
];

// Colour fallbacks while PNG loads (whisker-cream, paw-pink, hunter-green tints)
const COVER_FALLBACKS = [
  '#F6F4F0',
  '#F5D5C8',
  '#D4E4DF',
];

function coverIndex(id) {
  if (!id) return 0;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h * 31) + id.charCodeAt(i)) >>> 0;
  return h % 3;
}

export default function SitterCard({ sitter, locale = 'en', availabilityUnconfirmed = false }) {
  const t = locale === 'de' ? contentDE.marketplace.card : contentEN.marketplace.card;
  const tagLabels = TAG_LABELS[locale] || TAG_LABELS.en;

  const {
    _id, _createdAt, name, username,
    identityVerified, trustedSitter, siteAdmin,
    photoUrl, avatarColour,
    feedingTypes, behavioralTraits,
    cats, _distance,
    availabilityDefault,
  } = sitter;

  const displayName = username || name || 'Member';

  const memberSince = _createdAt
    ? new Date(_createdAt).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { month: 'short', year: 'numeric' })
    : null;

  // Cat names — always shown regardless of view type
  const catNames = (cats || []).map(c => c.name).filter(Boolean);
  const catNamesDisplay = catNames.length === 0
    ? null
    : catNames.length === 1
    ? catNames[0]
    : `${catNames.slice(0, -1).join(', ')} & ${catNames[catNames.length - 1]}`;

  // Capability pills — traits + feeding types, capped at 3
  const allPills = [...new Set([...(behavioralTraits || []), ...(feedingTypes || [])])];
  const shownPills = allPills.slice(0, 3);
  const extraCount = allPills.length - shownPills.length;

  // Availability label
  let availLabel = null;
  if (availabilityDefault === 'unavailable') {
    availLabel = locale === 'de' ? 'Verfügbarkeit auf Anfrage' : 'Availability on request';
  } else if (availabilityDefault === 'available') {
    availLabel = locale === 'de' ? 'Generell verfügbar' : 'Generally available';
  }

  const idx = coverIndex(_id || '');
  const coverSrc = COVERS[idx];
  const coverBg = COVER_FALLBACKS[idx];

  return (
    <div className={styles.card}>
      {/* Cover image — wavy pattern PNG */}
      <div
        className={styles.cardCover}
        style={{ backgroundImage: `url(${coverSrc})`, backgroundColor: coverBg }}
        aria-hidden="true"
      >
        {/* Avatar — overlaps cover/body boundary */}
        <div className={styles.cardAvatarWrap}>
          <CatAvatar
            photoUrl={photoUrl}
            avatarColour={avatarColour}
            name={displayName}
            size={64}
            style={{ border: '3px solid #F6F4F0', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          />
        </div>
      </div>

      {/* Card body */}
      <div className={styles.cardBody}>
        {/* Top row: member since + unconfirmed badge */}
        <div className={styles.cardMetaRow}>
          {availabilityUnconfirmed ? (
            <span className={styles.availUnconfirmedBadge}>
              {locale === 'de' ? 'Verfügbarkeit unbestätigt' : 'Availability unconfirmed'}
            </span>
          ) : memberSince ? (
            <span className={styles.memberSince}>
              {locale === 'de' ? 'Dabei seit' : 'Since'} {memberSince}
            </span>
          ) : null}
          {siteAdmin && <span className={styles.adminBadge}>Admin</span>}
        </div>

        {/* Name + badges + distance */}
        <div className={styles.cardNameRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0, flex: 1 }}>
            <h3 className={styles.cardName}>{displayName}</h3>
            {identityVerified && <span className={styles.verifiedBadge} title="Identity verified">✓</span>}
            {trustedSitter && <span className={styles.trustedBadge} title="Trusted sitter">⭐</span>}
          </div>
          {_distance !== undefined && (
            <span className={styles.distanceBadge}>~{_distance.toFixed(1)} km</span>
          )}
        </div>

        {/* Cat names subtitle */}
        {catNamesDisplay && (
          <p className={styles.cardSubtitle}>{catNamesDisplay}</p>
        )}

        {/* Availability indicator */}
        {availLabel && (
          <div className={styles.availRow}>
            <div className={styles.tickCircle}>✓</div>
            <span className={styles.availText}>{availLabel}</span>
          </div>
        )}

        {/* Capability pills */}
        {shownPills.length > 0 && (
          <div className={styles.tags} style={{ margin: 0 }}>
            {shownPills.map(tag => (
              <span key={tag} className={`${styles.tag} ${styles.tagOutline}`}>
                {tagLabels[tag] || tag}
              </span>
            ))}
            {extraCount > 0 && (
              <span className={`${styles.tag} ${styles.tagMore}`}>+{extraCount}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className={styles.cardActions}>
          <Link href={`/inbox?to=${_id}`} className={`${styles.cardBtn} ${styles.cardBtnBrown}`}>
            {locale === 'de' ? 'Nachricht' : 'Message'}
          </Link>
          <Link href={`/${_id}`} className={`${styles.cardBtn} ${styles.cardBtnPrimary}`}>
            {t.viewProfile}
          </Link>
        </div>
      </div>
    </div>
  );
}
