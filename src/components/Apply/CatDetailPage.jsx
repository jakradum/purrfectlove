// src/components/Apply/CatDetailPage.jsx
import { notFound } from 'next/navigation';
import styles from './CatDetailPage.module.css';
import { client } from '@/sanity/lib/client';
import imageUrlBuilder from '@sanity/image-url';
import Breadcrumb from '@/components/Breadcrumb';
import AdoptButton from './AdoptButton';
import contentEN from '@/data/pageContent.en.json';
import contentDE from '@/data/pageContent.de.json';

const builder = imageUrlBuilder(client);

function urlFor(source) {
  return builder.image(source);
}

function formatAge(ageMonths, content) {
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

function getGoodWithList(goodWith, labels) {
  const items = [];
  if (goodWith?.children) items.push(labels.children);
  if (goodWith?.cats) items.push(labels.cats);
  if (goodWith?.dogs) items.push(labels.dogs);
  return items;
}

export default async function CatDetailPage({ slug, locale = 'en' }) {
  const content = locale === 'de' ? contentDE : contentEN;
  const applyContent = content.apply;

  const query = locale === 'de'
    ? `*[_type == "cat" && slug.current == $slug][0] {
        _id,
        name,
        slug,
        photos,
        age,
        ageMonths,
        gender,
        traits,
        description,
        "location": locationDe,
        healthStatus,
        goodWith
      }`
    : `*[_type == "cat" && slug.current == $slug][0] {
        _id,
        name,
        slug,
        photos,
        age,
        ageMonths,
        gender,
        traits,
        description,
        "location": locationEn,
        healthStatus,
        goodWith
      }`;

  const cat = await client.fetch(query, { slug }, { next: { revalidate: 0 } });

  if (!cat) {
    notFound();
  }

  const exactAge = formatAge(cat.ageMonths, applyContent);
  const ageDisplay = exactAge || applyContent.ageGroups?.[cat.age] || cat.age;
  const goodWithList = getGoodWithList(cat.goodWith, applyContent.labels);

  const homeHref = locale === 'de' ? '/de' : '/';
  const applyHref = locale === 'de' ? '/de/apply' : '/apply';
  const breadcrumbItems = [
    { href: homeHref, label: applyContent.breadcrumb.home },
    { href: applyHref, label: applyContent.breadcrumb.apply },
    { label: cat.name },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Breadcrumb items={breadcrumbItems} />

        <div className={styles.content}>
          <div className={styles.gallery}>
            {cat.photos?.map((photo, index) => (
              <div key={index} className={styles.imageWrapper}>
                <img
                  src={urlFor(photo).width(800).height(800).url()}
                  alt={`${cat.name} - photo ${index + 1}`}
                  className={styles.image}
                />
              </div>
            ))}
          </div>

          <div className={styles.details}>
            <h1 className={styles.name}>{cat.name}</h1>

            <div className={styles.meta}>
              {ageDisplay && <span className={styles.age}>{ageDisplay}</span>}
            </div>

            {cat.traits && (
              <p className={styles.traits}>{cat.traits}</p>
            )}

            <p className={styles.description}>{cat.description}</p>

            <div className={styles.info}>
              {cat.location && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{applyContent.labels.location}</span>
                  <span className={styles.infoValue}>{cat.location}</span>
                </div>
              )}

              {cat.healthStatus?.vaccinated && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{applyContent.labels.vaccinated}</span>
                  <span className={styles.infoValue}>✓</span>
                </div>
              )}

              {goodWithList.length > 0 && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{applyContent.labels.goodWith}</span>
                  <span className={styles.infoValue}>{goodWithList.join(', ')}</span>
                </div>
              )}
            </div>

            <AdoptButton cat={cat} content={applyContent} />
          </div>
        </div>

        <Breadcrumb items={breadcrumbItems} />
      </div>
    </main>
  );
}
