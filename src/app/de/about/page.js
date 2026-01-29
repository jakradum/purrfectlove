import AboutPage from '@/components/About/AboutPage';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';

export const metadata = {
  title: 'Über uns - Purrfect Love',
  description: 'Lernen Sie das Team hinter Purrfect Love kennen. Wir retten, rehabilitieren und vermitteln Katzen in Bangalore und Stuttgart.',
  alternates: {
    canonical: 'https://www.purrfectlove.org/de/about',
    languages: {
      'en': 'https://www.purrfectlove.org/about',
      'de': 'https://www.purrfectlove.org/de/about',
    },
  },
};

export default function About() {
  return (
    <>
      <BreadcrumbSchema
        locale="de"
        items={[
          { name: 'Startseite', path: '/' },
          { name: 'Über uns', path: '/about' },
        ]}
      />
      <AboutPage locale="de" />
    </>
  );
}
