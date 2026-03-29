'use client';

import Link from 'next/link';
import styles from './Care.module.css';
import contentEN from '@/data/careContent.en.json';
import contentDE from '@/data/careContent.de.json';

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

export default function SitterCard({ sitter, type = 'canSit', locale = 'en' }) {
  const t = locale === 'de' ? contentDE.marketplace.card : contentEN.marketplace.card;
  const tagLabels = TAG_LABELS[locale] || TAG_LABELS.en;

  const {
    _id, name, location, bio, contactPreference, email, phone,
    hideEmail, hideWhatsApp,
    maxCats, feedingTypes, behavioralTraits, cats, _distance,
  } = sitter;

  const bothHidden = hideEmail && hideWhatsApp;

  const displayName = name || 'Member';
  const traits = type === 'findSitters'
    ? (behavioralTraits || [])
    : [];

  const capabilities = feedingTypes || [];
  const allTags = [...new Set([...traits, ...capabilities])].slice(0, 4);

  const whatsappNumber = phone ? phone.replace(/\D/g, '') : null;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardName}>{displayName}</h3>
          {location?.name && <p className={styles.cardNeighborhood}>{location.name}</p>}
        </div>
        {_distance !== undefined && (
          <span className={styles.distanceBadge}>
            {_distance.toFixed(1)} {t.distance}
          </span>
        )}
      </div>

      {bio && <p className={styles.cardBio}>{bio}</p>}

      {/* For sitters: show capabilities */}
      {type === 'findSitters' && maxCats && (
        <p className={styles.cardMeta}>
          {t.maxCats} <strong>{maxCats}</strong> {t.cats}
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
          <Link
            href={`/inbox?to=${_id}`}
            className={`${styles.cardBtn} ${styles.cardBtnPrimary}`}
          >
            Send Message
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
          <a
            href={`mailto:${email}`}
            className={`${styles.cardBtn} ${styles.cardBtnPrimary}`}
          >
            {t.contactEmail}
          </a>
        ) : null}

        <Link
          href={`/${_id}`}
          className={`${styles.cardBtn} ${styles.cardBtnOutline}`}
        >
          {t.viewProfile}
        </Link>
      </div>
    </div>
  );
}
