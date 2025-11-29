import AdoptPage from '@/components/Adopt/AdoptPage';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Adopt a Cat - Purrfect Love',
  description: 'Meet our cats available for adoption. All cats are neutered, vaccinated, and ready for their forever homes.',
  alternates: {
    canonical: 'https://purrfectlove.org/adopt',
    languages: {
      'en': 'https://purrfectlove.org/adopt',
      'de': 'https://purrfectlove.org/de/adopt',
    },
  },
};

export default function Adopt() {
  return (
    <>
      <BreadcrumbSchema
        locale="en"
        items={[
          { name: 'Home', path: '/' },
          { name: 'Adopt', path: '/adopt' },
        ]}
      />
      <AdoptPage locale="en" />
    </>
  );
}
