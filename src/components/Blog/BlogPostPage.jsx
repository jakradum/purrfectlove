// src/components/BlogPostPage.jsx
import { notFound } from 'next/navigation';
import { PortableText } from '@portabletext/react';
import styles from './BlogPostPage.module.css';
import { client } from '@/sanity/lib/client';
import imageUrlBuilder from '@sanity/image-url';
import Breadcrumb from '@/components/Breadcrumb';
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
      author-> {
        name,
        role,
        bio,
        image {
          asset-> {
            _id,
            url
          }
        }
      },
      authorDe-> {
        name,
        role,
        bio,
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

  const title = post.title?.[locale] || post.title?.en || '';
  const postContent = post.content?.[locale] || post.content?.en || [];
  const author = locale === 'de' ? (post.authorDe || post.author) : post.author;
  const authorBio = author?.bio?.[locale] || author?.bio?.en;
  const authorBioText = truncateText(extractPlainText(authorBio), 50);

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
            {author && (
              <div className={styles.authorByline}>
                {author.image?.asset && (
                  <img
                    src={urlFor(author.image).width(48).height(48).url()}
                    alt={author.name}
                    className={styles.authorImage}
                  />
                )}
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>{author.name}</span>
                  {authorBioText && (
                    <span className={styles.authorBio}>{authorBioText}</span>
                  )}
                </div>
              </div>
            )}
          </header>

          {post.featuredImage?.asset && (
            <div className={styles.imageWrapper}>
              <img
                src={urlFor(post.featuredImage).width(1200).height(675).url()}
                alt={title}
                className={styles.image}
              />
            </div>
          )}

          <div className={styles.content}>
            <PortableText value={postContent} />
          </div>

          <Breadcrumb items={breadcrumbItems} />
        </article>
      </main>
    </>
  );
}
