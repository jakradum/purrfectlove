import OnboardingPage from '@/components/Guides/OnboardingPage';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';

export const metadata = {
  title: 'The First Days with Your New Cat - Purrfect Love',
  description: 'A complete guide to helping your new cat settle into their forever home. Learn what to expect in the first 3 weeks after adoption.',
  alternates: {
    canonical: 'https://www.purrfectlove.org/guides/onboarding',
    languages: {
      'en': 'https://www.purrfectlove.org/guides/onboarding',
      'de': 'https://www.purrfectlove.org/de/guides/onboarding',
    },
  },
};

export default function OnboardingRoute() {
  return (
    <>
      <BreadcrumbSchema
        locale="en"
        items={[
          { name: 'Home', path: '/' },
          { name: 'The First Days', path: '/guides/onboarding' },
        ]}
      />
      <OnboardingPage locale="en" />
    </>
  );
}
