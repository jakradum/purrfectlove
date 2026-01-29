import BlogPage from '@/components/Blog/BlogPage';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';

export const metadata = {
  title: 'Blog - Purrfect Love',
  description: 'Ratgeber, Tipps und Geschichten zur Katzenpflege von Purrfect Love.',
  alternates: {
    canonical: 'https://www.purrfectlove.org/de/guides/blog',
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
