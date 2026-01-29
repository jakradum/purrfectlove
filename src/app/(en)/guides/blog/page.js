import BlogPage from '@/components/Blog/BlogPage';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';

export const metadata = {
  title: 'Blog - Purrfect Love',
  description: 'Guides, tips, and stories about cat care from Purrfect Love. Learn how to care for your feline friend.',
  alternates: {
    canonical: 'https://www.purrfectlove.org/guides/blog',
    languages: {
      'en': 'https://www.purrfectlove.org/guides/blog',
      'de': 'https://www.purrfectlove.org/de/guides/blog',
    },
  },
};

export default function BlogRoute() {
  return (
    <>
      <BreadcrumbSchema
        locale="en"
        items={[
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/guides/blog' },
        ]}
      />
      <BlogPage locale="en" />
    </>
  );
}
