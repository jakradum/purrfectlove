import ContactPage from '@/components/Contact/ContactPage';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';

export const metadata = {
  title: 'Kontakt - Purrfect Love',
  description: 'Nehmen Sie Kontakt mit Purrfect Love auf. Wir freuen uns, von Ihnen zu hören - über Katzenadoption, Freiwilligenarbeit oder Fragen.',
  alternates: {
    canonical: 'https://www.purrfectlove.org/de/contact',
    languages: {
      'en': 'https://www.purrfectlove.org/contact',
      'de': 'https://www.purrfectlove.org/de/contact',
    },
  },
};

export default function ContactRoute() {
  return (
    <>
      <BreadcrumbSchema
        locale="de"
        items={[
          { name: 'Startseite', path: '/' },
          { name: 'Kontakt', path: '/contact' },
        ]}
      />
      <ContactPage locale="de" />
    </>
  );
}
