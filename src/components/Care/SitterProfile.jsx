'use client';

import Link from 'next/link';
import styles from './Care.module.css';

const TAG_LABELS = {
  shy: 'Shy', energetic: 'Energetic', senior: 'Senior', 'special needs': 'Special Needs',
  wet: 'Wet food', dry: 'Dry food', medication: 'Medication', 'special diet': 'Special diet',
};

function TagList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={styles.tags}>
      {items.map((item) => (
        <span key={item} className={`${styles.tag} ${styles.tagGreen}`}>
          {TAG_LABELS[item] || item}
        </span>
      ))}
    </div>
  );
}

export default function SitterProfile({ sitter }) {
  const {
    name, location, bio, email, phone, contactPreference,
    bedrooms, householdSize, cats, maxCats, feedingTypes, behavioralTraits,
    canSit, needsSitting,
  } = sitter;

  const displayName = name || 'Member';
  const whatsappNumber = phone ? phone.replace(/\D/g, '') : null;

  return (
    <div className={styles.page}>
      <Link href="/care" className={styles.backLink}>← Back to network</Link>

      <div className={styles.profileDetailCard}>
        <h1 className={styles.profileDetailName}>{displayName}</h1>
        {location?.name && <p className={styles.profileDetailNeighborhood}>{location.name}</p>}
        {bio && <p className={styles.profileDetailBio}>{bio}</p>}

        <div className={styles.contactActions}>
          {contactPreference === 'whatsapp' && whatsappNumber ? (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.cardBtn} ${styles.cardBtnWhatsapp}`}
              style={{ textDecoration: 'none' }}
            >
              WhatsApp
            </a>
          ) : email ? (
            <a
              href={`mailto:${email}`}
              className={`${styles.cardBtn} ${styles.cardBtnPrimary}`}
              style={{ textDecoration: 'none' }}
            >
              Send Email
            </a>
          ) : null}
        </div>
      </div>

      {/* Home Details */}
      {(bedrooms || householdSize) && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Home</h2>
          <div className={styles.detailGrid}>
            {bedrooms && (
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Bedrooms</span>
                <span className={styles.detailItemValue}>{bedrooms}</span>
              </div>
            )}
            {householdSize && (
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Household Size</span>
                <span className={styles.detailItemValue}>{householdSize}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cats */}
      {cats && cats.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>My Cats</h2>
          <div className={styles.catList}>
            {cats.map((cat, idx) => (
              <div key={idx} className={styles.catListItem}>
                <p className={styles.catListItemName}>
                  {cat.name || 'Unnamed cat'}
                  {cat.age ? ` — ${cat.age} years old` : ''}
                </p>
                {cat.personality && cat.personality.length > 0 && (
                  <div style={{ marginBottom: '0.4rem' }}>
                    <TagList items={cat.personality} />
                  </div>
                )}
                {cat.diet && cat.diet.length > 0 && (
                  <div className={styles.tags}>
                    {cat.diet.map((d) => (
                      <span key={d} className={`${styles.tag} ${styles.tagBrown}`}>
                        {TAG_LABELS[d] || d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sitter Capabilities */}
      {canSit && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Sitting Capabilities</h2>
          {maxCats && (
            <div className={styles.formGroup}>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Max cats</span>
                <span className={styles.detailItemValue}>{maxCats}</span>
              </div>
            </div>
          )}
          {feedingTypes && feedingTypes.length > 0 && (
            <div className={styles.formGroup}>
              <p className={styles.profileLabel} style={{ marginBottom: '0.5rem' }}>Can handle feeding</p>
              <TagList items={feedingTypes} />
            </div>
          )}
          {behavioralTraits && behavioralTraits.length > 0 && (
            <div className={styles.formGroup}>
              <p className={styles.profileLabel} style={{ marginBottom: '0.5rem' }}>Comfortable with</p>
              <TagList items={behavioralTraits} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
