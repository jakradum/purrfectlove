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

// Cover patterns — place files at /public/images/care/cover-pattern-{1,2,3}.png
// Falls back to a CSS gradient if the image doesn't exist yet.
const COVER_PATTERNS = [
  '/images/care/cover-pattern-1.png',
  '/images/care/cover-pattern-2.png',
  '/images/care/cover-pattern-3.png',
];

const COVER_FALLBACKS = [
  'linear-gradient(135deg, #c8a8d8 0%, #a07cbf 100%)',  // purple
  'linear-gradient(135deg, #9ac8e8 0%, #5a9ccc 100%)',  // blue
  'linear-gradient(135deg, #f5b8c8 0%, #d87a98 100%)',  // pink
];

function coverIndex(id) {
  // Deterministic cover assignment based on last 2 chars of id
  const code = id ? id.charCodeAt(id.length - 1) + id.charCodeAt(id.length - 2) : 0;
  return code % 3;
}

export default function SitterCard({ sitter, type = 'canSit', locale = 'en', availabilityUnconfirmed = false }) {
  const t = locale === 'de' ? contentDE.marketplace.card : contentEN.marketplace.card;
  const tagLabels = TAG_LABELS[locale] || TAG_LABELS.en;

  const {
    _id, _createdAt, name, username, location, bio, contactPreference, email, phone,
    hideEmail, hideWhatsApp, siteAdmin, photoUrl, avatarColour,
    identityVerified, trustedSitter,
    maxHomesPerDay, feedingTypes, behavioralTraits, cats, _distance,
  } = sitter;

  const memberSinceYear = _createdAt ? new Date(_createdAt).getFullYear() : null;

  const bothHidden = hideEmail && hideWhatsApp;

  const displayName = username || name || 'Member';
  const traits = type === 'findSitters'
    ? (behavioralTraits || [])
    : [];

  const capabilities = feedingTypes || [];
  const allTags = [...new Set([...traits, ...capabilities])].slice(0, 4);

  const whatsappNumber = phone ? phone.replace(/\D/g, '') : null;

  const idx = coverIndex(_id || '');
  const coverPattern = COVER_PATTERNS[idx];
  const coverFallback = COVER_FALLBACKS[idx];

  return (
    <div className={styles.card} style={{ padding: 0 }}>
      {/* Cover image */}
      <div
        className={styles.cardCover}
        style={{ backgroundImage: `url(${coverPattern}), ${coverFallback}` }}
        aria-hidden="true"
      />

      {/* Content below cover */}
      <div className={styles.cardBody}>
        {/* Avatar overlapping cover */}
        <div className={styles.cardAvatarWrap}>
          <CatAvatar photoUrl={photoUrl} avatarColour={avatarColour} name={displayName} size={52} style={{ border: '3px solid #fff' }} />
          {siteAdmin && (
            <span className={styles.adminBadge}>Admin</span>
          )}
        </div>

        {/* Name row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
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
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
              {_distance !== undefined ? (
                <p className={styles.cardNeighborhood} style={{ margin: 0 }}>~{_distance.toFixed(1)} {t.distance}</p>
              ) : location?.name ? (
                <p className={styles.cardNeighborhood} style={{ margin: 0 }}>{location.name}</p>
              ) : null}
              {memberSinceYear && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
                  · Member since {memberSinceYear}
                </span>
              )}
            </div>
          </div>
          {availabilityUnconfirmed && (
            <span className={styles.availUnconfirmedBadge}>
              {locale === 'de' ? 'Verfügbarkeit unbestätigt' : 'Avail. unconfirmed'}
            </span>
          )}
        </div>

        {bio && <p className={styles.cardBio}>{bio}</p>}

        {/* For sitters: show capabilities */}
        {type === 'findSitters' && maxHomesPerDay && (
          <p className={styles.cardMeta}>
            {t.maxCats} <strong>{maxHomesPerDay}</strong> {t.cats}
          </p>
        )}

        {/* For needs-sitting: show cats */}
        {type === 'offerToSit' && cats && cats.length > 0 && (
          <p className={styles.cardMeta}>
            {cats.length} cat{cats.length !== 1 ? 's' : ''}: {cats.map((c) => c.name).filter(Boolean).join(', ')}
          </p>
        )}

        {allTags.length > 0 && (
          <div className={styles.tags}>
            {allTags.map((tag) => (
              <span key={tag} className={`${styles.tag} ${styles.tagGreen}`}>
                {tagLabels[tag] || tag}
              </span>
            ))}
          </div>
        )}

        <div className={styles.cardActions}>
          {bothHidden ? (
            <Link href={`/inbox?to=${_id}`} className={`${styles.cardBtn} ${styles.cardBtnPrimary}`}>
              Message
            </Link>
          ) : contactPreference === 'whatsapp' && whatsappNumber ? (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.cardBtn} ${styles.cardBtnWhatsapp}`}
            >
              {t.contactWhatsapp}
            </a>
          ) : email ? (
            <a href={`mailto:${email}`} className={`${styles.cardBtn} ${styles.cardBtnPrimary}`}>
              {t.contactEmail}
            </a>
          ) : null}

          <Link href={`/${_id}`} className={`${styles.cardBtn} ${styles.cardBtnOutline}`}>
            {t.viewProfile}
          </Link>
        </div>
      </div>
    </div>
  );
}
