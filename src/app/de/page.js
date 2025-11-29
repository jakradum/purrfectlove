import HomePage from '@/components/Home/HomePage';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Purrfect Love',
  url: 'https://purrfectlove.org',
  logo: 'https://purrfectlove.org/logo-hero.png',
  description: 'Ein Katzenadoptions- und Rehabilitationskollektiv in Bangalore und Stuttgart. Wir retten, rehabilitieren und vermitteln Katzen in liebevolle Zuhause.',
  sameAs: [
    'https://www.instagram.com/purrfectlove.bangalore/',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'contact@purrfectlove.org',
    contactType: 'customer service',
  },
  areaServed: [
    {
      '@type': 'City',
      name: 'Bangalore',
      containedInPlace: {
        '@type': 'Country',
        name: 'India',
      },
    },
    {
      '@type': 'City',
      name: 'Stuttgart',
      containedInPlace: {
        '@type': 'Country',
        name: 'Germany',
      },
    },
  ],
};

export const metadata = {
  title: 'Purrfect Love | Katzenadoption in Bangalore & Stuttgart',
  description: 'Adoptieren Sie eine Katze von Purrfect Love. Wir retten, rehabilitieren und vermitteln Katzen in Bangalore und Stuttgart.',
  openGraph: {
    title: 'Purrfect Love | Katzenadoption in Bangalore & Stuttgart',
    description: 'Adoptieren Sie eine Katze von Purrfect Love. Wir retten, rehabilitieren und vermitteln Katzen.',
    url: 'https://purrfectlove.org/de',
    siteName: 'Purrfect Love',
    images: [
      {
        url: 'https://purrfectlove.org/logo-hero.png',
        width: 1200,
        height: 630,
        alt: 'Purrfect Love - Katzenadoption',
      },
    ],
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Purrfect Love | Katzenadoption in Bangalore & Stuttgart',
    description: 'Adoptieren Sie eine Katze von Purrfect Love.',
    images: ['https://purrfectlove.org/logo-hero.png'],
  },
  alternates: {
    canonical: 'https://purrfectlove.org/de',
    languages: {
      'en': 'https://purrfectlove.org',
      'de': 'https://purrfectlove.org/de',
    },
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <HomePage locale="de" />
    </>
  );
}
