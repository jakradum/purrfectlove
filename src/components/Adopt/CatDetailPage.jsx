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

  // Only show cats that aren't adopted
  // A cat is adopted if: adoptedOverride is true OR an application has status "adopted"
  const query = locale === 'de'
    ? `*[_type == "cat" && slug.current == $slug && adoptedOverride != true && count(*[_type == "application" && cat._ref == ^._id && status == "adopted"]) == 0][0] {
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
    : `*[_type == "cat" && slug.current == $slug && adoptedOverride != true && count(*[_type == "application" && cat._ref == ^._id && status == "adopted"]) == 0][0] {
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

  const cat = await client.fetch(query, { slug });

  // If not in available pool, check if it exists but is adopted — show adopted view instead of 404
  if (!cat) {
    const adoptedCat = await client.fetch(
      `*[_type == "cat" && slug.current == $slug && (adoptedOverride == true || count(*[_type == "application" && cat._ref == ^._id && status == "adopted"]) > 0)][0]{
        name, "slug": slug.current,
        "photoUrl": photos[0].asset->url
      }`,
      { slug }
    );
    if (adoptedCat) {
      const c = adoptContent.adopted;
      const archiveHref = locale === 'de' ? '/de/adopt/adopted' : '/adopt/adopted';
      const adoptHref = locale === 'de' ? '/de/adopt' : '/adopt';
      return (
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.adoptedCard}>
              {adoptedCat.photoUrl && (
                <img src={`${adoptedCat.photoUrl}?w=320&h=320&fit=crop`} alt={adoptedCat.name} className={styles.adoptedPhoto} />
              )}
              <span className={styles.adoptedBadge}>{c.badge}</span>
              <h1 className={styles.adoptedTitle}>{c.alreadyAdoptedTitle}</h1>
              <p className={styles.adoptedMessage}>{c.alreadyAdoptedMessage.replace('{catName}', adoptedCat.name)}</p>
              <div className={styles.adoptedActions}>
                <a href={adoptHref} className={styles.adoptedCtaBtn}>{c.alreadyAdoptedCta}</a>
                <a href={archiveHref} className={styles.adoptedArchiveLink}>{c.alreadyAdoptedArchiveLink}</a>
              </div>
            </div>
          </div>
        </main>
      );
    }
    notFound();
  }

  // Fetch all available cats for navigation
  const allCatsQuery = locale === 'de'
    ? `*[_type == "cat" && defined(locationDe) && adoptedOverride != true && count(*[_type == "application" && cat._ref == ^._id && status == "adopted"]) == 0] | order(_createdAt desc) {
        name,
        "slug": slug.current
      }`
    : `*[_type == "cat" && defined(locationEn) && adoptedOverride != true && count(*[_type == "application" && cat._ref == ^._id && status == "adopted"]) == 0] | order(_createdAt desc) {
        name,
        "slug": slug.current
      }`;

  const allCats = await client.fetch(allCatsQuery, {});

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

  const catUrl = locale === 'de'
    ? `https://www.purrfectlove.org/de/adopt/${cat.slug.current}`
    : `https://www.purrfectlove.org/adopt/${cat.slug.current}`;
  const shareText = locale === 'de'
    ? `Schau mal – ${cat.name} sucht ein Zuhause! 🐱 ${catUrl}`
    : `Meet ${cat.name} – looking for a forever home! 🐱 ${catUrl}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

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

              <AdoptButton cat={cat} content={adoptContent} locale={locale} />

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappShare}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.whatsappIcon} aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {adoptContent.adopted.shareWhatsApp}
              </a>
            </div>
          </div>

          <CatNavigation prevCat={prevCat} nextCat={nextCat} locale={locale} />

          <Breadcrumb items={breadcrumbItems} />
        </div>
      </main>
    </SwipeWrapper>
  );
}
