import BlogPostPage from '@/components/Blog/BlogPostPage';
import { client } from '@/sanity/lib/client';

const BASE_URL = 'https://www.purrfectlove.org';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await client.fetch(
    `*[_type == "blogPost" && slug.current == $slug][0]{ "slugDe": slugDe.current }`,
    { slug }
  );
  const deSlug = post?.slugDe;
  return {
    alternates: {
      languages: {
        'en': `${BASE_URL}/guides/blog/${slug}`,
        ...(deSlug ? { 'de': `${BASE_URL}/de/guides/blog/${deSlug}` } : {}),
      },
    },
  };
}

export default async function BlogPostRoute({ params }) {
  const { slug } = await params;
  return <BlogPostPage slug={slug} locale="en" />;
}
