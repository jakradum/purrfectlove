import BlogPage from '@/components/Blog/BlogPage';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';

export const metadata = {
  title: 'Blog - Purrfect Love',
  description: 'Ratgeber, Tipps und Geschichten zur Katzenpflege von Purrfect Love.',
  alternates: {
    canonical: 'https://purrfectlove.org/de/guides/blog',
    languages: {
      'en': 'https://purrfectlove.org/guides/blog',
      'de': 'https://purrfectlove.org/de/guides/blog',
    },
  },
};

export default function BlogRoute() {
  return (
    <>
      <BreadcrumbSchema
        locale="de"
        items={[
          { name: 'Startseite', path: '/' },
          { name: 'Blog', path: '/guides/blog' },
        ]}
      />
      <BlogPage locale="de" />
    </>
  );
}
