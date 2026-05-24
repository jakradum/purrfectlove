import AdoptedCatsPage from '@/components/Adopt/AdoptedCatsPage';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';
import contentDE from '@/data/pageContent.de.json';

export const revalidate = 3600;

export const metadata = {
  title: contentDE.adopt.adopted.archiveMetaTitle,
  description: contentDE.adopt.adopted.archiveMetaDescription,
  alternates: {
    canonical: 'https://www.purrfectlove.org/de/adopt/adopted',
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
        locale="de"
        items={[
          { name: 'Startseite', path: '/' },
          { name: 'Adoptieren', path: '/de/adopt' },
          { name: 'Adoptierte Katzen', path: '/de/adopt/adopted' },
        ]}
      />
      <AdoptedCatsPage locale="de" />
    </>
  );
}
