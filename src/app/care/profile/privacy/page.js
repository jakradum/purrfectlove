import PrivacyPage from '@/components/Privacy/PrivacyPage';

export const metadata = {
  title: 'How We Protect Your Data | Purrfect Love Community',
  description: 'In plain language: how your data is stored, shared, and protected on the Purrfect Love Community portal.',
  robots: { index: false, follow: false },
};

export default function PrivacyRoute() {
  return <PrivacyPage />;
}
