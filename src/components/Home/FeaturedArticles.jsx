// src/components/Home/FeaturedArticles.jsx
import styles from './FeaturedArticles.module.css';
import { client } from '@/sanity/lib/client';
import FeaturedBlogCard from './FeaturedBlogCard';
import CTAButton from '@/components/CTAButton';

export default async function FeaturedArticles({ content, locale = 'en' }) {
  const blogHref = locale === 'de' ? '/de/guides/blog' : '/guides/blog';

  const posts = await client.fetch(
    `*[_type == "blogPost" && featuredOnHomePage == true && (language == $locale || language == "both" || !defined(language))] | order(publishedAt desc)[0...4] {
      _id,
      title,
      slug,
      slugDe,
      excerpt,
      publishedAt
    }`,
    { locale },
    { next: { revalidate: 60 } }
  );

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{content.heading}</h2>
      <div className={styles.posts}>
        {posts.map((post) => (
          <FeaturedBlogCard
            key={post._id}
            post={post}
            locale={locale}
            readMoreText={content.readMore}
          />
        ))}
      </div>
      <div className={styles.ctaWrapper}>
        <CTAButton href={blogHref}>
          {content.cta}
        </CTAButton>
      </div>
    </section>
  );
}
