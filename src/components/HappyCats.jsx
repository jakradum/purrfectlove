// src/components/HappyCats.jsx
import styles from './HappyCats.module.css';
import { client } from '@/sanity/lib/client';
import imageUrlBuilder from '@sanity/image-url';
import CTAButton from './CTAButton';

const builder = imageUrlBuilder(client);

function urlFor(source) {
  return builder.image(source);
}

export default async function HappyCats({ content, locale }) {
const stories = await client.fetch(
  `*[_type == "successStory" && (language == $locale || language == "both" || !defined(language))] | order(adoptionDate desc)[0...6] {
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
  { locale }
);

  console.log('Stories:', JSON.stringify(stories, null, 2));

  const isOdd = stories.length % 2 !== 0;

  return (
    <section className={styles.happyCats}>
      <h2 className={styles.heading}>{content.heading}</h2>
      <div className={styles.grid}>
        {stories.map((story) => (
          <div key={story._id} className={styles.card}>
            {story.image?.asset ? (
              <img
                src={urlFor(story.image).width(400).height(400).url()}
                alt={story.catName}
                className={styles.image}
              />
            ) : (
              <div className={styles.imagePlaceholder}>No image</div>
            )}
            <div className={styles.info}>
              <h3>{story.catName}</h3>
              <p className={styles.adopter}>by {story.adopterName}</p>
              <p className={styles.date}>in{' '}
                {new Date(story.adoptionDate).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              {story.quote?.[locale] && <p className={styles.quote}>"{story.quote[locale]}"</p>}
            </div>
          </div>
        ))}
        <div className={`${styles.ctaCard} ${isOdd ? styles.ctaCardOdd : styles.ctaCardEven}`}>
          <CTAButton href={`/${locale}/adoption`}>
            {content.seeAllCats || 'See all cats'}
          </CTAButton>
        </div>
      </div>
    </section>
  );
}