import FAQsPage from '@/components/Guides/FAQsPage';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';

export const metadata = {
  title: 'FAQs - Purrfect Love',
  description: 'Frequently asked questions about adopting a cat from Purrfect Love. Learn about requirements, fees, process, and more.',
  alternates: {
    canonical: 'https://purrfectlove.org/guides/faqs',
    languages: {
      'en': 'https://purrfectlove.org/guides/faqs',
      'de': 'https://purrfectlove.org/de/guides/faqs',
    },
  },
};

export default function FAQsRoute() {
  return (
    <>
      <BreadcrumbSchema
        locale="en"
        items={[
          { name: 'Home', path: '/' },
          { name: 'FAQs', path: '/guides/faqs' },
        ]}
      />
      <FAQsPage locale="en" />
    </>
  );
}
