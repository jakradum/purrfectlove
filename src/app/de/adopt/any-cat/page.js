import AdoptAnyCatPage from '@/components/Adopt/AdoptAnyCatPage';

export const metadata = {
  title: 'Jede Katze adoptieren - Purrfect Love',
  description: 'Nicht sicher, welche Katze Sie adoptieren möchten? Füllen Sie unser Formular aus und wir finden eine Katze, die zu Ihrem Lebensstil passt.',
  alternates: {
    canonical: 'https://www.purrfectlove.org/de/adopt/any-cat',
    languages: {
      'en': 'https://www.purrfectlove.org/adopt/any-cat',
      'de': 'https://www.purrfectlove.org/de/adopt/any-cat',
    },
  },
};

export default function AdoptAnyCatRoute() {
  return <AdoptAnyCatPage locale="de" />;
}
