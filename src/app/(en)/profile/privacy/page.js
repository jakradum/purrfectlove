import PrivacyPage from '@/components/Privacy/PrivacyPage';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';

export const metadata = {
  title: 'How We Protect Your Data - Purrfect Love',
  description: 'In plain language: how your data is stored, shared, and protected on the Purrfect Love Community portal.',
  alternates: {
    canonical: 'https://www.purrfectlove.org/profile/privacy',
    languages: {
      'en': 'https://www.purrfectlove.org/profile/privacy',
    },
  },
};

export default function PrivacyRoute() {
  return (
    <>
      <BreadcrumbSchema
        locale="en"
        items={[
          { name: 'Home', path: '/' },
          { name: 'How We Protect Your Data', path: '/profile/privacy' },
        ]}
      />
      <PrivacyPage />
    </>
  );
}
