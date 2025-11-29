import HomePage from '@/components/Home/HomePage';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Purrfect Love',
  url: 'https://purrfectlove.org',
  logo: 'https://purrfectlove.org/logo-hero.png',
  description: 'A cat adoption and rehab collective based in Bangalore and Stuttgart. We rescue, rehabilitate, and rehome cats, connecting them with loving forever homes.',
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
  title: 'Purrfect Love | Cat Adoption in Bangalore & Stuttgart',
  description: 'Adopt a cat from Purrfect Love. We rescue, rehabilitate, and rehome cats in Bangalore and Stuttgart, connecting them with loving forever homes.',
  openGraph: {
    title: 'Purrfect Love | Cat Adoption in Bangalore & Stuttgart',
    description: 'Adopt a cat from Purrfect Love. We rescue, rehabilitate, and rehome cats in Bangalore and Stuttgart.',
    url: 'https://purrfectlove.org',
    siteName: 'Purrfect Love',
    images: [
      {
        url: 'https://purrfectlove.org/logo-hero.png',
        width: 1200,
        height: 630,
        alt: 'Purrfect Love - Cat Adoption',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Purrfect Love | Cat Adoption in Bangalore & Stuttgart',
    description: 'Adopt a cat from Purrfect Love. We rescue, rehabilitate, and rehome cats.',
    images: ['https://purrfectlove.org/logo-hero.png'],
  },
  alternates: {
    canonical: 'https://purrfectlove.org',
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
      <HomePage locale="en" />
    </>
  );
}
