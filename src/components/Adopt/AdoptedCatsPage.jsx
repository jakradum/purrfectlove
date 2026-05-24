import styles from './AdoptedCatsPage.module.css';
import { client } from '@/sanity/lib/client';
import imageUrlBuilder from '@sanity/image-url';
import Breadcrumb from '@/components/Breadcrumb';
import contentEN from '@/data/pageContent.en.json';
import contentDE from '@/data/pageContent.de.json';

const builder = imageUrlBuilder(client);

export default async function AdoptedCatsPage({ locale = 'en' }) {
  const content = locale === 'de' ? contentDE : contentEN;
  const c = content.adopt.adopted;

  const query = locale === 'de'
    ? `*[_type == "cat" && defined(locationDe) && (adoptedOverride == true || count(*[_type == "application" && cat._ref == ^._id && status == "adopted"]) > 0)] | order(_createdAt desc) {
        _id, name, "slug": slug.current,
        "photoUrl": photos[0].asset->url,
        "location": locationDe,
        ageMonths, age
      }`
    : `*[_type == "cat" && defined(locationEn) && (adoptedOverride == true || count(*[_type == "application" && cat._ref == ^._id && status == "adopted"]) > 0)] | order(_createdAt desc) {
        _id, name, "slug": slug.current,
        "photoUrl": photos[0].asset->url,
        "location": locationEn,
        ageMonths, age
      }`;

  const cats = await client.fetch(query);

  const homeHref = locale === 'de' ? '/de' : '/';
  const adoptHref = locale === 'de' ? '/de/adopt' : '/adopt';
  const breadcrumbItems = [
    { href: homeHref, label: content.adopt.breadcrumb.home },
    { href: adoptHref, label: content.adopt.breadcrumb.adopt },
    { label: c.breadcrumb },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Breadcrumb items={breadcrumbItems} />

        <header className={styles.header}>
          <h1 className={styles.heading}>{c.heading}</h1>
          <p className={styles.subheading}>{c.subheading}</p>
        </header>

        {cats.length === 0 ? (
          <p className={styles.empty}>{c.empty}</p>
        ) : (
          <div className={styles.grid}>
            {cats.map(cat => (
              <div key={cat._id} className={styles.card}>
                <div className={styles.photoWrapper}>
                  {cat.photoUrl ? (
                    <img
                      src={`${cat.photoUrl}?w=400&h=400&fit=crop`}
                      alt={cat.name}
                      className={styles.photo}
                    />
                  ) : (
                    <div className={styles.photoPlaceholder} />
                  )}
                  <span className={styles.badge}>{c.badge}</span>
                </div>
                <div className={styles.info}>
                  <span className={styles.catName}>{cat.name}</span>
                  {cat.location && <span className={styles.location}>{cat.location}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.backLink}>
          <a href={adoptHref}>← {content.adopt.breadcrumb.adopt}</a>
        </div>
      </div>
    </main>
  );
}
