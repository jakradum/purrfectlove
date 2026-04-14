import BlogPostPage from '@/components/Blog/BlogPostPage';
import { client } from '@/sanity/lib/client';

const BASE_URL = 'https://www.purrfectlove.org';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await client.fetch(
    `*[_type == "blogPost" && (slugDe.current == $slug || slug.current == $slug)][0]{
      "slugEn": slug.current,
      "slugDe": coalesce(slugDe.current, slug.current)
    }`,
    { slug }
  );
  const enSlug = post?.slugEn;
  const deSlug = post?.slugDe;
  return {
    alternates: {
      languages: {
        'de': `${BASE_URL}/de/guides/blog/${deSlug || slug}`,
        ...(enSlug ? { 'en': `${BASE_URL}/guides/blog/${enSlug}` } : {}),
      },
    },
  };
}

export default async function BlogPostRoute({ params }) {
  const { slug } = await params;
  return <BlogPostPage slug={slug} locale="de" />;
}
