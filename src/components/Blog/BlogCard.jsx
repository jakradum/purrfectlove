// src/components/BlogCard.jsx
import Link from 'next/link';
import styles from './BlogCard.module.css';

export default function BlogCard({ post, locale, readMoreText }) {
  const fullTitle = post.title?.[locale] || post.title?.en || '';
  const title = fullTitle.length > 55 ? fullTitle.slice(0, 55) + '...' : fullTitle;
  const fullExcerpt = post.excerpt?.[locale] || post.excerpt?.en || '';
  const excerpt = fullExcerpt.length > 30 ? fullExcerpt.slice(0, 30) + '...' : fullExcerpt;
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
    <Link href={href} className={styles.card}>
      <div className={styles.content}>
        <time className={styles.date}>{formattedDate}</time>
        <h2 className={styles.title}>{title}</h2>
        {excerpt && <p className={styles.excerpt}>{excerpt}</p>}
        <span className={styles.readMore}>
          {readMoreText}
        </span>
      </div>
    </Link>
  );
}
