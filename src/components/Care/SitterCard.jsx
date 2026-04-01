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

// Cover images: /public/images/care/3.png, 4.png, 5.png
const COVERS = [
  '/images/care/3.png',
  '/images/care/4.png',
  '/images/care/5.png',
];

const COVER_FALLBACKS = [
  'linear-gradient(135deg, #c8a8d8 0%, #a07cbf 100%)',
  'linear-gradient(135deg, #9ac8e8 0%, #5a9ccc 100%)',
  'linear-gradient(135deg, #f5b8c8 0%, #d87a98 100%)',
];

function coverIndex(id) {
  if (!id) return 0;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h * 31) + id.charCodeAt(i)) >>> 0;
  return h % 3;
}

export default function SitterCard({ sitter, type = 'canSit', locale = 'en', availabilityUnconfirmed = false }) {
  const t = locale === 'de' ? contentDE.marketplace.card : contentEN.marketplace.card;
  const tagLabels = TAG_LABELS[locale] || TAG_LABELS.en;

  const {
    _id, _createdAt, name, username, location,
    identityVerified, trustedSitter, siteAdmin,
    photoUrl, avatarColour,
    maxHomesPerDay, feedingTypes, behavioralTraits,
    cats, _distance,
    availabilityDefault,
  } = sitter;

  const displayName = username || name || 'Member';

  const memberSince = _createdAt
    ? new Date(_createdAt).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { month: 'short', year: 'numeric' })
    : null;

  // Capability pills — cap at 3, show overflow count
  const traits = type === 'findSitters' ? (behavioralTraits || []) : [];
  const capabilities = feedingTypes || [];
  const allPills = [...new Set([...traits, ...capabilities])];
  const shownPills = allPills.slice(0, 3);
  const extraCount = allPills.length - shownPills.length;

  // Cat names for "offer to sit" type
  const catNames = (cats || []).map(c => c.name).filter(Boolean);

  // Availability label
  let availLabel = null;
  if (availabilityDefault === 'unavailable') {
    availLabel = locale === 'de' ? 'Verfügbarkeit auf Anfrage' : 'Availability on request';
  } else if (availabilityDefault === 'available') {
    availLabel = locale === 'de' ? 'Generell verfügbar' : 'Generally available';
  }

  const idx = coverIndex(_id || '');
  const coverSrc = COVERS[idx];
  const coverFallback = COVER_FALLBACKS[idx];

  return (
    <div className={styles.card}>
      {/* Cover image */}
      <div
        className={styles.cardCover}
        style={{ backgroundImage: `url(${coverSrc}), ${coverFallback}` }}
        aria-hidden="true"
      >
        {/* Pixel cat avatar — overlaps cover/body boundary */}
        <div className={styles.cardAvatarWrap}>
          <CatAvatar
            photoUrl={photoUrl}
            avatarColour={avatarColour}
            name={displayName}
            size={56}
            style={{ border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          />
        </div>
      </div>

      {/* Card body */}
      <div className={styles.cardBody}>
        {/* Name + badges */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <h3 className={styles.cardName}>{displayName}</h3>
            {identityVerified && (
              <span className={styles.verifiedBadge} title="Identity verified">✓</span>
            )}
            {trustedSitter && (
              <span className={styles.trustedBadge} title="Trusted sitter">⭐</span>
            )}
            {siteAdmin && (
              <span className={styles.adminBadge}>Admin</span>
            )}
            {availabilityUnconfirmed && (
              <span className={styles.availUnconfirmedBadge} style={{ marginLeft: 'auto' }}>
                {locale === 'de' ? 'Unbestätigt' : 'Unconfirmed'}
              </span>
            )}
          </div>

          {/* Meta line: distance · member since */}
          <p className={styles.cardNeighborhood}>
            {_distance !== undefined
              ? `~${_distance.toFixed(1)} ${t.distance}`
              : location?.name || ''}
            {memberSince && (
              <span style={{ color: 'var(--text-light)', marginLeft: _distance !== undefined || location?.name ? '0.4rem' : 0 }}>
                · {locale === 'de' ? 'Dabei seit' : 'Since'} {memberSince}
              </span>
            )}
          </p>
        </div>

        {/* Cat names (offer-to-sit) */}
        {type === 'offerToSit' && catNames.length > 0 && (
          <p className={styles.cardMeta}>
            {catNames.length === 1 ? catNames[0] : `${catNames.slice(0, -1).join(', ')} & ${catNames[catNames.length - 1]}`}
          </p>
        )}

        {/* Max homes per day (find-sitters) */}
        {type === 'findSitters' && maxHomesPerDay && (
          <p className={styles.cardMeta}>
            {t.maxCats} <strong>{maxHomesPerDay}</strong> {t.cats}
          </p>
        )}

        {/* Availability label */}
        {availLabel && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: 0 }}>{availLabel}</p>
        )}

        {/* Capability pills */}
        {shownPills.length > 0 && (
          <div className={styles.tags} style={{ margin: 0 }}>
            {shownPills.map(tag => (
              <span key={tag} className={`${styles.tag} ${styles.tagGreen}`}>
                {tagLabels[tag] || tag}
              </span>
            ))}
            {extraCount > 0 && (
              <span className={`${styles.tag} ${styles.tagGreen}`} style={{ opacity: 0.6 }}>
                +{extraCount} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className={styles.cardActions}>
          <Link
            href={`/inbox?to=${_id}`}
            className={`${styles.cardBtn} ${styles.cardBtnPrimary}`}
          >
            {locale === 'de' ? 'Nachricht' : 'Message'}
          </Link>
          <Link
            href={`/${_id}`}
            className={`${styles.cardBtn} ${styles.cardBtnOutline}`}
          >
            {t.viewProfile}
          </Link>
        </div>
      </div>
    </div>
  );
}
