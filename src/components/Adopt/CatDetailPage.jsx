// src/components/Adopt/CatDetailPage.jsx
import { notFound } from 'next/navigation';
import styles from './CatDetailPage.module.css';
import { client } from '@/sanity/lib/client';
import imageUrlBuilder from '@sanity/image-url';
import Breadcrumb from '@/components/Breadcrumb';
import AdoptButton from './AdoptButton';
import ImageGallery from './ImageGallery';
import CatNavigation from './CatNavigation';
import SwipeWrapper from './SwipeWrapper';
import contentEN from '@/data/pageContent.en.json';
import contentDE from '@/data/pageContent.de.json';

const builder = imageUrlBuilder(client);

function urlFor(source) {
  return builder.image(source);
}

// Prepare image URLs for client component
function prepareImages(photos) {
  if (!photos) return [];
  return photos.map(photo => ({
    main: urlFor(photo).width(800).height(800).url(),
    thumb: urlFor(photo).width(100).height(100).url()
  }));
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
  const adoptContent = content.adopt;

  // Only show cats that don't have an adopted application
  // A cat is considered adopted if ANY application for it has status "adopted"
  const query = locale === 'de'
    ? `*[_type == "cat" && slug.current == $slug && count(*[_type == "application" && cat._ref == ^._id && status == "adopted"]) == 0][0] {
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
    : `*[_type == "cat" && slug.current == $slug && count(*[_type == "application" && cat._ref == ^._id && status == "adopted"]) == 0][0] {
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

  const cat = await client.fetch(query, { slug }, { cache: 'no-store' });

  // Return 404 if cat doesn't exist or is adopted
  if (!cat) {
    notFound();
  }

  // Fetch all available cats for navigation
  const allCatsQuery = locale === 'de'
    ? `*[_type == "cat" && defined(locationDe) && count(*[_type == "application" && cat._ref == ^._id && status == "adopted"]) == 0] | order(_createdAt desc) {
        name,
        "slug": slug.current
      }`
    : `*[_type == "cat" && defined(locationEn) && count(*[_type == "application" && cat._ref == ^._id && status == "adopted"]) == 0] | order(_createdAt desc) {
        name,
        "slug": slug.current
      }`;

  const allCats = await client.fetch(allCatsQuery, {}, { cache: 'no-store' });

  // Find current cat index and get prev/next
  const currentIndex = allCats.findIndex(c => c.slug === slug);
  const prevCat = currentIndex > 0 ? allCats[currentIndex - 1] : null;
  const nextCat = currentIndex < allCats.length - 1 ? allCats[currentIndex + 1] : null;

  // Build hrefs for swipe navigation
  const prevHref = prevCat ? (locale === 'de' ? `/de/adopt/${prevCat.slug}` : `/adopt/${prevCat.slug}`) : null;
  const nextHref = nextCat ? (locale === 'de' ? `/de/adopt/${nextCat.slug}` : `/adopt/${nextCat.slug}`) : null;

  const exactAge = formatAge(cat.ageMonths, adoptContent);
  const ageDisplay = exactAge || adoptContent.ageGroups?.[cat.age] || cat.age;
  const goodWithList = getGoodWithList(cat.goodWith, adoptContent.labels);

  const homeHref = locale === 'de' ? '/de' : '/';
  const adoptHref = locale === 'de' ? '/de/adopt' : '/adopt';
  const breadcrumbItems = [
    { href: homeHref, label: adoptContent.breadcrumb.home },
    { href: adoptHref, label: adoptContent.breadcrumb.adopt },
    { label: cat.name },
  ];

  return (
    <SwipeWrapper prevHref={prevHref} nextHref={nextHref}>
      <main className={styles.main}>
        <div className={styles.container}>
          <Breadcrumb items={breadcrumbItems} />

          <div className={styles.content}>
            <div className={styles.gallery}>
              <ImageGallery
                images={prepareImages(cat.photos)}
                catName={cat.name}
              />
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
                    <span className={styles.infoLabel}>{adoptContent.labels.location}</span>
                    <span className={styles.infoValue}>{cat.location}</span>
                  </div>
                )}

                {cat.healthStatus?.vaccinated && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{adoptContent.labels.vaccinated}</span>
                    <span className={styles.infoValue}>✓</span>
                  </div>
                )}

                {goodWithList.length > 0 && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{adoptContent.labels.goodWith}</span>
                    <span className={styles.infoValue}>{goodWithList.join(', ')}</span>
                  </div>
                )}
              </div>

              <AdoptButton cat={cat} content={adoptContent} />
            </div>
          </div>

          <CatNavigation prevCat={prevCat} nextCat={nextCat} locale={locale} />

          <Breadcrumb items={breadcrumbItems} />
        </div>
      </main>
    </SwipeWrapper>
  );
}
