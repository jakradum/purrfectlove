// src/components/BlogCard.jsx
import Link from 'next/link';
import styles from './BlogCard.module.css';

export default function BlogCard({ post, locale, readMoreText }) {
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

  return (
    <article className={styles.card}>
      <div className={styles.content}>
        <time className={styles.date}>{formattedDate}</time>
        <Link href={href} className={styles.titleLink}>
          <h2 className={styles.title}>{title}</h2>
        </Link>
        {excerpt && <p className={styles.excerpt}>{excerpt}</p>}
        <Link href={href} className={styles.readMore}>
          {readMoreText}
        </Link>
      </div>
    </article>
  );
}
