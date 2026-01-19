// src/components/Home/FeaturedBlogCard.jsx
import Link from 'next/link';
import styles from './FeaturedBlogCard.module.css';

export default function FeaturedBlogCard({ post, locale, readMoreText, variant = 'home' }) {
  const title = post.title?.[locale] || post.title?.en || '';
  const excerpt = post.excerpt?.[locale] || post.excerpt?.en || '';
  const slug = locale === 'de'
    ? (post.slugDe?.current || post.slug?.current || '')
    : (post.slug?.current || '');
  const href = locale === 'de' ? `/de/guides/blog/${slug}` : `/guides/blog/${slug}`;

  const formattedDate = new Date(post.publishedAt).toLocaleDateString(
    locale === 'de' ? 'de-DE' : 'en-US',
    {
      year: 'numeric',
      month: 'short',
    }
  );

  // Use blog variant for blog listing page (no circles, left-aligned)
  const cardClassName = variant === 'blog'
    ? `${styles.card} ${styles.blogVariant}`
    : styles.card;

  return (
    <article className={cardClassName}>
      <div className={styles.content}>
        <time className={styles.date}>{formattedDate}</time>
        <Link href={href} className={styles.titleLink}>
          <h3 className={styles.title}>{title}</h3>
        </Link>
        {excerpt && <p className={styles.excerpt}>{excerpt}</p>}
        <Link href={href} className={styles.readMore}>
          {readMoreText}
        </Link>
      </div>
    </article>
  );
}
