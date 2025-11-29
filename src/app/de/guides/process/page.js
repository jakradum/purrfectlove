import ProcessPage from '@/components/Guides/ProcessPage';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';

export const metadata = {
  title: 'Adoptionsprozess - Purrfect Love',
  description: 'Erfahren Sie, wie unser Adoptionsprozess funktioniert. Von der Bewerbung bis zur Abholung Ihrer neuen Katze.',
  alternates: {
    canonical: 'https://purrfectlove.org/de/guides/process',
    languages: {
      'en': 'https://purrfectlove.org/guides/process',
      'de': 'https://purrfectlove.org/de/guides/process',
    },
  },
};

export default function ProcessRoute() {
  return (
    <>
      <BreadcrumbSchema
        locale="de"
        items={[
          { name: 'Startseite', path: '/' },
          { name: 'Prozess', path: '/guides/process' },
        ]}
      />
      <ProcessPage locale="de" />
    </>
  );
}
