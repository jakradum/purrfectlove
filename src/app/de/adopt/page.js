import AdoptPage from '@/components/Adopt/AdoptPage';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Katze adoptieren - Purrfect Love',
  description: 'Lernen Sie unsere Katzen kennen, die auf ein Zuhause warten. Alle Katzen sind kastriert, geimpft und bereit für ihr neues Zuhause.',
  alternates: {
    canonical: 'https://www.purrfectlove.org/de/adopt',
    languages: {
      'en': 'https://www.purrfectlove.org/adopt',
      'de': 'https://www.purrfectlove.org/de/adopt',
    },
  },
};

export default function Adopt() {
  return (
    <>
      <BreadcrumbSchema
        locale="de"
        items={[
          { name: 'Startseite', path: '/' },
          { name: 'Adoptieren', path: '/adopt' },
        ]}
      />
      <AdoptPage locale="de" />
    </>
  );
}
