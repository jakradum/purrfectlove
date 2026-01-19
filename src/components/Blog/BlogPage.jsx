// src/components/BlogPage.jsx
import styles from './BlogPage.module.css';
import { client } from '@/sanity/lib/client';
import Breadcrumb from '@/components/Breadcrumb';
import BlogPageClient from './BlogPageClient';
import contentEN from '@/data/pageContent.en.json';
import contentDE from '@/data/pageContent.de.json';

export default async function BlogPage({ locale = 'en' }) {
  const content = locale === 'de' ? contentDE : contentEN;
  const blogContent = content.blog;

  const posts = await client.fetch(
    `*[_type == "blogPost" && (language == $locale || language == "both" || !defined(language))] | order(publishedAt desc) {
      _id,
      title,
      slug,
      slugDe,
      excerpt,
      publishedAt,
      tags,
      featuredImage {
        asset-> {
          _id,
          url
        }
      }
    }`,
    { locale },
    { next: { revalidate: 60 } }
  );

  const homeHref = locale === 'de' ? '/de' : '/';
  const breadcrumbItems = [
    { href: homeHref, label: blogContent.breadcrumb.home },
    { label: blogContent.breadcrumb.blog },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Breadcrumb items={breadcrumbItems} />

        <header className={styles.header}>
          <h1 className={styles.heading}>{blogContent.heading}</h1>
          <p className={styles.subheading}>{blogContent.subheading}</p>
        </header>

        <BlogPageClient
          posts={posts}
          locale={locale}
          blogContent={blogContent}
        />

        <Breadcrumb items={breadcrumbItems} />
      </div>
    </main>
  );
}
