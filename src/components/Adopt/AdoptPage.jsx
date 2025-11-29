// src/components/Adopt/AdoptPage.jsx
import styles from './AdoptPage.module.css';
import { client } from '@/sanity/lib/client';
import CatCard from './CatCard';
import AdoptAnyCatButton from './AdoptAnyCatButton';
import contentEN from '@/data/pageContent.en.json';
import contentDE from '@/data/pageContent.de.json';

export default async function AdoptPage({ locale = 'en' }) {
  const content = locale === 'de' ? contentDE : contentEN;
  const adoptContent = content.adopt;

  // Filter cats by locale and exclude cats that have an adopted application
  // A cat is considered adopted if ANY application for it has status "adopted"
  const query = locale === 'de'
    ? `*[_type == "cat" && defined(locationDe) && count(*[_type == "application" && cat._ref == ^._id && status == "adopted"]) == 0] | order(_createdAt desc) {
        _id,
        name,
        slug,
        photos,
        ageMonths,
        "location": locationDe
      }`
    : `*[_type == "cat" && defined(locationEn) && count(*[_type == "application" && cat._ref == ^._id && status == "adopted"]) == 0] | order(_createdAt desc) {
        _id,
        name,
        slug,
        photos,
        ageMonths,
        "location": locationEn
      }`;

  const cats = await client.fetch(query, {}, { cache: 'no-store' });

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.heading}>{adoptContent.heading}</h1>
          <p className={styles.subheading}>{adoptContent.subheading}</p>
        </header>

        {cats.length > 0 ? (
          <div className={styles.grid}>
            {cats.map((cat) => (
              <CatCard
                key={cat._id}
                cat={cat}
                locale={locale}
                content={adoptContent}
              />
            ))}
          </div>
        ) : (
          <p className={styles.noCats}>{adoptContent.noCats}</p>
        )}

        <AdoptAnyCatButton content={adoptContent} locale={locale} />
      </div>
    </main>
  );
}
