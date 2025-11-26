import BlogPostPage from '@/components/BlogPostPage';

export default async function BlogPostRoute({ params }) {
  const { slug } = await params;
  return <BlogPostPage slug={slug} locale="de" />;
}
