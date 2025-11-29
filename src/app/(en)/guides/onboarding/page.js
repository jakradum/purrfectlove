import OnboardingPage from '@/components/Guides/OnboardingPage';

export const metadata = {
  title: 'The First Days with Your New Cat - Purrfect Love',
  description: 'A complete guide to helping your new cat settle into their forever home. Learn what to expect in the first 3 weeks after adoption.',
};

export default function OnboardingRoute() {
  return <OnboardingPage locale="en" />;
}
