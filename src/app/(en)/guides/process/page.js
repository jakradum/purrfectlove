import ProcessPage from '@/components/Guides/ProcessPage';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';

export const metadata = {
  title: 'Adoption Process - Purrfect Love',
  description: 'Learn how our cat adoption process works. From application to bringing your new cat home, we guide you every step.',
  alternates: {
    canonical: 'https://purrfectlove.org/guides/process',
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
        locale="en"
        items={[
          { name: 'Home', path: '/' },
          { name: 'Process', path: '/guides/process' },
        ]}
      />
      <ProcessPage locale="en" />
    </>
  );
}
