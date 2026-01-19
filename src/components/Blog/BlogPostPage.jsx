// src/components/BlogPostPage.jsx
import { notFound } from 'next/navigation';
import { PortableText } from '@portabletext/react';
import styles from './BlogPostPage.module.css';
import { client } from '@/sanity/lib/client';
import imageUrlBuilder from '@sanity/image-url';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';
import contentEN from '@/data/pageContent.en.json';
import contentDE from '@/data/pageContent.de.json';

const builder = imageUrlBuilder(client);

function urlFor(source) {
  return builder.image(source);
}

function extractPlainText(blocks) {
  if (!blocks || !Array.isArray(blocks)) return '';
  return blocks
    .filter(block => block._type === 'block')
    .map(block => block.children?.map(child => child.text).join('') || '')
    .join(' ');
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// Custom components for PortableText rendering
const portableTextComponents = {
  marks: {
    link: ({children, value}) => {
      const { href, openInNewTab } = value;
      return openInNewTab ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      ) : (
        <a href={href}>{children}</a>
      );
    }
  }
};

export default async function BlogPostPage({ slug, locale = 'en' }) {
  const content = locale === 'de' ? contentDE : contentEN;
  const blogContent = content.blog;

  // For German locale, try to find by slugDe first, then fall back to slug
  const query = locale === 'de'
    ? `*[_type == "blogPost" && (slugDe.current == $slug || slug.current == $slug)][0]`
    : `*[_type == "blogPost" && slug.current == $slug][0]`;

  const post = await client.fetch(
    `${query} {
      _id,
      title,
      slug,
      slugDe,
      excerpt,
      content,
      publishedAt,
      featuredImage {
        asset-> {
          _id,
          url
        }
      },
      tags,
      tagsDe,
      author-> {
        name,
        "slug": slug.current,
        image {
          asset-> {
            _id,
            url
          }
        }
      },
      authorDe-> {
        name,
        "slug": slug.current,
        image {
          asset-> {
            _id,
            url
          }
        }
      }
    }`,
    { slug },
    { next: { revalidate: 60 } }
  );

  if (!post) {
    notFound();
  }

  // Get tags for this locale (German posts use tagsDe)
  const postTags = locale === 'de'
    ? (post.tagsDe && post.tagsDe.length > 0 ? post.tagsDe : post.tags)
    : post.tags;

  // Fetch related posts based on shared tags (up to 3)
  let relatedPosts = [];
  if (postTags && postTags.length > 0) {
    const tagsField = locale === 'de' ? 'tagsDe' : 'tags';
    relatedPosts = await client.fetch(
      `*[_type == "blogPost" && _id != $postId && count((${tagsField})[@ in $tags]) > 0] | order(publishedAt desc) [0...3] {
        _id,
        title,
        slug,
        slugDe,
        excerpt,
        publishedAt
      }`,
      { postId: post._id, tags: postTags },
      { next: { revalidate: 60 } }
    );
  }

  const title = post.title?.[locale] || post.title?.en || '';
  const postContent = post.content?.[locale] || post.content?.en || [];
  const author = locale === 'de' ? (post.authorDe || post.author) : post.author;
  const authorHref = author?.slug
    ? (locale === 'de' ? `/de/about/${author.slug}` : `/about/${author.slug}`)
    : null;

  const formattedDate = new Date(post.publishedAt).toLocaleDateString(
    locale === 'de' ? 'de-DE' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  const homeHref = locale === 'de' ? '/de' : '/';
  const blogHref = locale === 'de' ? '/de/guides/blog' : '/guides/blog';
  const breadcrumbItems = [
    { href: homeHref, label: blogContent.breadcrumb.home },
    { href: blogHref, label: blogContent.breadcrumb.blog },
    { label: title },
  ];

  // Generate excerpt for description
  const excerpt = post.excerpt?.[locale] || post.excerpt?.en || truncateText(extractPlainText(postContent), 160);

  // Article schema for SEO
  const baseUrl = 'https://purrfectlove.org';
  const localePath = locale === 'de' ? '/de' : '';
  const postSlug = locale === 'de' ? (post.slugDe?.current || post.slug?.current) : post.slug?.current;
  const articleUrl = `${baseUrl}${localePath}/guides/blog/${postSlug}`;
  const imageUrl = post.featuredImage?.asset?.url || `${baseUrl}/logo-hero.png`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: excerpt,
    image: imageUrl,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      '@type': 'Person',
      name: author?.name || 'Purrfect Love',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Purrfect Love',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo-hero.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: blogContent.breadcrumb.home,
        item: `${baseUrl}${localePath || '/'}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: blogContent.breadcrumb.blog,
        item: `${baseUrl}${localePath}/guides/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: articleUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main className={styles.main}>
        <article className={styles.container}>
          <Breadcrumb items={breadcrumbItems} />

          <header className={styles.header}>
            <time className={styles.date}>{formattedDate}</time>
            <h1 className={styles.title}>{title}</h1>
            <div className={styles.authorByline}>
              {author ? (
                authorHref ? (
                  <Link href={authorHref} className={styles.authorLink}>
                    {author.image?.asset && (
                      <img
                        src={urlFor(author.image).width(48).height(48).url()}
                        alt={author.name}
                        className={styles.authorImage}
                      />
                    )}
                    <span className={styles.authorName}>{author.name}</span>
                  </Link>
                ) : (
                  <>
                    {author.image?.asset && (
                      <img
                        src={urlFor(author.image).width(48).height(48).url()}
                        alt={author.name}
                        className={styles.authorImage}
                      />
                    )}
                    <span className={styles.authorName}>{author.name}</span>
                  </>
                )
              ) : (
                <span className={styles.authorName}>Purrfect Love Team</span>
              )}
            </div>
          </header>

          <div className={styles.content}>
            {post.featuredImage?.asset && (
              <div className={styles.imageWrapper}>
                <img
                  src={urlFor(post.featuredImage).width(1200).fit('max').url()}
                  alt={title}
                  className={styles.image}
                />
              </div>
            )}
            <PortableText value={postContent} components={portableTextComponents} />
          </div>

          {postTags && postTags.length > 0 && (
            <div className={styles.tagsSection}>
              <span className={styles.tagsLabel}>
                {locale === 'de' ? 'Themen:' : 'Topics:'}
              </span>
              <div className={styles.tagsList}>
                {postTags.map((tag) => (
                  <Link
                    key={tag}
                    href={`${blogHref}?tags=${encodeURIComponent(tag)}`}
                    className={styles.tag}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {relatedPosts.length > 0 && (
            <div className={styles.relatedSection}>
              <h2 className={styles.relatedHeading}>
                {locale === 'de' ? 'Ähnliche Beiträge' : 'Related Posts'}
              </h2>
              <div className={styles.relatedPosts}>
                {relatedPosts.map((relatedPost) => {
                  const relatedTitle = relatedPost.title?.[locale] || relatedPost.title?.en || '';
                  const relatedExcerpt = relatedPost.excerpt?.[locale] || relatedPost.excerpt?.en || '';
                  const relatedSlug = locale === 'de'
                    ? (relatedPost.slugDe?.current || relatedPost.slug?.current)
                    : relatedPost.slug?.current;
                  const relatedHref = `${blogHref}/${relatedSlug}`;
                  const relatedDate = new Date(relatedPost.publishedAt).toLocaleDateString(
                    locale === 'de' ? 'de-DE' : 'en-US',
                    { year: 'numeric', month: 'short' }
                  );

                  return (
                    <article key={relatedPost._id} className={styles.relatedCard}>
                      <time className={styles.relatedDate}>{relatedDate}</time>
                      <Link href={relatedHref} className={styles.relatedTitleLink}>
                        <h3 className={styles.relatedTitle}>{relatedTitle}</h3>
                      </Link>
                      {relatedExcerpt && (
                        <p className={styles.relatedExcerpt}>
                          {truncateText(relatedExcerpt, 100)}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          <Breadcrumb items={breadcrumbItems} />
        </article>
      </main>
    </>
  );
}
