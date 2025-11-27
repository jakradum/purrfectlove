// src/components/ApplyPage.jsx
import styles from './ApplyPage.module.css';
import { client } from '@/sanity/lib/client';
import CatCard from './CatCard';
import contentEN from '@/data/pageContent.en.json';
import contentDE from '@/data/pageContent.de.json';

export default async function ApplyPage({ locale = 'en' }) {
  const content = locale === 'de' ? contentDE : contentEN;
  const applyContent = content.apply;

  // Filter cats by locale based on which locality field is filled
  const query = locale === 'de'
    ? `*[_type == "cat" && status == "available" && defined(locationDe)] | order(_createdAt desc) {
        _id,
        name,
        slug,
        photos,
        ageMonths,
        "location": locationDe
      }`
    : `*[_type == "cat" && status == "available" && defined(locationEn)] | order(_createdAt desc) {
        _id,
        name,
        slug,
        photos,
        ageMonths,
        "location": locationEn
      }`;

  const cats = await client.fetch(query, {}, { next: { revalidate: 0 } });

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.heading}>{applyContent.heading}</h1>
          <p className={styles.subheading}>{applyContent.subheading}</p>
        </header>

        {cats.length > 0 ? (
          <div className={styles.grid}>
            {cats.map((cat) => (
              <CatCard
                key={cat._id}
                cat={cat}
                locale={locale}
                content={applyContent}
              />
            ))}
          </div>
        ) : (
          <p className={styles.noCats}>{applyContent.noCats}</p>
        )}
      </div>
    </main>
  );
}
