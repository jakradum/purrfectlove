import AdoptedCatsPage from '@/components/Adopt/AdoptedCatsPage';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';
import contentEN from '@/data/pageContent.en.json';

export const revalidate = 3600;

export const metadata = {
  title: contentEN.adopt.adopted.archiveMetaTitle,
  description: contentEN.adopt.adopted.archiveMetaDescription,
  alternates: {
    canonical: 'https://www.purrfectlove.org/adopt/adopted',
    languages: {
      en: 'https://www.purrfectlove.org/adopt/adopted',
      de: 'https://www.purrfectlove.org/de/adopt/adopted',
    },
  },
};

export default function AdoptedRoute() {
  return (
    <>
      <BreadcrumbSchema
        locale="en"
        items={[
          { name: 'Home', path: '/' },
          { name: 'Adopt', path: '/adopt' },
          { name: 'Adopted Cats', path: '/adopt/adopted' },
        ]}
      />
      <AdoptedCatsPage locale="en" />
    </>
  );
}
