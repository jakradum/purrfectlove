import AdoptAnyCatPage from '@/components/Adopt/AdoptAnyCatPage';

export const metadata = {
  title: 'Adopt Any Cat - Purrfect Love',
  description: 'Not sure which cat to adopt? Fill out our form and we\'ll match you with a cat that suits your lifestyle.',
  alternates: {
    canonical: 'https://purrfectlove.org/adopt/any-cat',
    languages: {
      'en': 'https://purrfectlove.org/adopt/any-cat',
      'de': 'https://purrfectlove.org/de/adopt/any-cat',
    },
  },
};

export default function AdoptAnyCatRoute() {
  return <AdoptAnyCatPage locale="en" />;
}
