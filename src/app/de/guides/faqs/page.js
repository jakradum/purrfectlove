import FAQsPage from '@/components/Guides/FAQsPage';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';

export const metadata = {
  title: 'FAQ - Purrfect Love',
  description: 'Häufig gestellte Fragen zur Adoption einer Katze von Purrfect Love. Erfahren Sie mehr über Voraussetzungen, Gebühren und den Prozess.',
  alternates: {
    canonical: 'https://www.purrfectlove.org/de/guides/faqs',
    languages: {
      'en': 'https://www.purrfectlove.org/guides/faqs',
      'de': 'https://www.purrfectlove.org/de/guides/faqs',
    },
  },
};

export default function FAQsRoute() {
  return (
    <>
      <BreadcrumbSchema
        locale="de"
        items={[
          { name: 'Startseite', path: '/' },
          { name: 'FAQ', path: '/guides/faqs' },
        ]}
      />
      <FAQsPage locale="de" />
    </>
  );
}
