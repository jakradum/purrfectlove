import { client } from '@/sanity/client';

export default async function sitemap() {
  const baseUrl = 'https://purrfectlove.org';

  // Static pages for English
  const staticPagesEN = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/adopt`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/process`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/faqs`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/guides/onboarding`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/guides/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];

  // Static pages for German
  const staticPagesDE = [
    { url: `${baseUrl}/de`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/de/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/de/adopt`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/de/process`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/de/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/de/guides/faqs`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/de/guides/onboarding`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/de/guides/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];

  // Fetch blog posts from Sanity
  let blogPosts = [];
  try {
    const posts = await client.fetch(`
      *[_type == "post" && defined(slug.current)] {
        "slug": slug.current,
        _updatedAt
      }
    `);

    blogPosts = posts.flatMap((post) => [
      {
        url: `${baseUrl}/guides/blog/${post.slug}`,
        lastModified: new Date(post._updatedAt),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/de/guides/blog/${post.slug}`,
        lastModified: new Date(post._updatedAt),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
    ]);
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
  }

  // Fetch cats from Sanity
  let catPages = [];
  try {
    const cats = await client.fetch(`
      *[_type == "cat" && defined(slug.current)] {
        "slug": slug.current,
        _updatedAt
      }
    `);

    catPages = cats.flatMap((cat) => [
      {
        url: `${baseUrl}/adopt/${cat.slug}`,
        lastModified: new Date(cat._updatedAt),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/de/adopt/${cat.slug}`,
        lastModified: new Date(cat._updatedAt),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
    ]);
  } catch (error) {
    console.error('Error fetching cats for sitemap:', error);
  }

  return [...staticPagesEN, ...staticPagesDE, ...blogPosts, ...catPages];
}
