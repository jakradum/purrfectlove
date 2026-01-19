import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import LocaleSuggestion from '@/components/LocaleSuggestion';

export const metadata = {
  title: "Purrfect Love | Cat Adoption & Rescue in Bangalore, India",
  description: "Adopt a cat in Bangalore! Purrfect Love is a cat adoption and rescue collective helping cats find loving homes in India. Browse adoptable cats and learn about our adoption process.",
  keywords: ['cat adoption bangalore', 'cat rescue bangalore', 'adopt cats india', 'bangalore cat shelter', 'purrfect love india', 'pet adoption bangalore', 'rescue cats bangalore', 'cat adoption india'],
  openGraph: {
    title: 'Purrfect Love India | Cat Adoption Bangalore',
    description: 'Adopt a cat in Bangalore! Find your purrfect companion.',
    locale: 'en_IN',
    url: 'https://purrfectlove.org',
  },
  alternates: {
    canonical: 'https://purrfectlove.org',
    languages: {
      'en': 'https://purrfectlove.org',
      'de': 'https://purrfectlove.org/de',
    },
  },
  other: {
    'geo.region': 'IN-KA',
    'geo.placename': 'Bangalore',
    'geo.position': '12.9716;77.5946',
  },
};

export default function EnLayout({ children }) {
  return (
    <>
      <Navbar locale="en" />
      <LocaleSuggestion currentLocale="en" />
      <div style={{ minHeight: '100vh' }}>{children}</div>
      <Footer locale="en" />
    </>
  );
}