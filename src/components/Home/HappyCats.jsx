// src/components/Home/HappyCats.jsx
import styles from './HappyCats.module.css';
import { client } from '@/sanity/lib/client';
import imageUrlBuilder from '@sanity/image-url';
import SuccessStoriesGrid from './SuccessStoriesGrid';

const builder = imageUrlBuilder(client);

export default async function HappyCats({ content, locale }) {
  const stories = await client.fetch(
    `*[_type == "successStory"] | order(adoptionDate desc)[0...8] {
      _id,
      catName,
      adopterName,
      adoptionDate,
      quote,
      image {
        asset-> {
          _id,
          url
        }
      }
    }`,
    {},
    { next: { revalidate: 60 } }
  );

  if (!stories || stories.length === 0) return null;

  const processed = stories.map((s) => ({
    _id: s._id,
    catName: s.catName,
    adopterName: s.adopterName,
    adoptionDate: s.adoptionDate,
    quote: s.quote?.[locale] || s.quote?.en || s.quote?.de || null,
    imageUrl: s.image?.asset ? builder.image(s.image).width(800).url() : null,
  }));

  return (
    <section className={styles.happyCats}>
      <h2 className={styles.heading}>{content.heading}</h2>
      {content.subheading && (
        <p className={styles.subheading}>{content.subheading}</p>
      )}
      <SuccessStoriesGrid stories={processed} locale={locale} />
    </section>
  );
}
