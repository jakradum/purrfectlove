// src/components/CatCard.jsx
import Link from 'next/link';
import styles from './CatCard.module.css';
import imageUrlBuilder from '@sanity/image-url';
import { client } from '@/sanity/lib/client';

const builder = imageUrlBuilder(client);

function urlFor(source) {
  return builder.image(source);
}

function formatAge(ageMonths, locale, content) {
  if (!ageMonths) return null;

  if (ageMonths < 12) {
    return `${ageMonths} ${ageMonths === 1 ? content.month : content.months}`;
  }

  const years = Math.floor(ageMonths / 12);
  const remainingMonths = ageMonths % 12;

  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? content.year : content.years}`;
  }

  return `${years} ${years === 1 ? content.year : content.years}, ${remainingMonths} ${remainingMonths === 1 ? content.month : content.months}`;
}

export default function CatCard({ cat, locale, content }) {
  const photo = cat.photos?.[0];
  const age = formatAge(cat.ageMonths, locale, content);
  const href = locale === 'de' ? `/de/adopt/${cat.slug?.current}` : `/adopt/${cat.slug?.current}`;

  return (
    <Link href={href} className={styles.card}>
      {photo && (
        <div className={styles.imageWrapper}>
          <img
            src={urlFor(photo).width(400).height(400).url()}
            alt={cat.name}
            className={styles.image}
          />
        </div>
      )}
      <div className={styles.info}>
        <h3 className={styles.name}>{cat.name}</h3>
        <div className={styles.details}>
          {age && <span className={styles.age}>{age}</span>}
          {cat.location && (
            <>
              {age && <span className={styles.separator}>·</span>}
              <span className={styles.location}>{cat.location}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
