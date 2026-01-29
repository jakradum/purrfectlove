import { Outfit, Lora } from 'next/font/google';
import { headers } from 'next/headers';
import "./globals.css";

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-outfit'
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-lora'
});

export const metadata = {
  metadataBase: new URL('https://www.purrfectlove.org'),
  title: {
    default: "Purrfect Love | Cat Adoption & Rescue in Bangalore & Stuttgart",
    template: "%s | Purrfect Love"
  },
  description: "Find your purrfect companion! Cat adoption and rescue collective based in Bangalore, India and Stuttgart, Germany. Adopt cats, learn about cat care, and support our mission.",
  keywords: ['cat adoption', 'cat rescue', 'adopt cats', 'bangalore cat adoption', 'stuttgart cat adoption', 'katzen adoption', 'purrfect love', 'cat shelter', 'pet adoption india', 'pet adoption germany'],
  authors: [{ name: 'Purrfect Love Team' }],
  creator: 'Purrfect Love',
  publisher: 'Purrfect Love',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    alternateLocale: ['de_DE'],
    url: 'https://www.purrfectlove.org',
    title: 'Purrfect Love | Cat Adoption & Rescue',
    description: 'Find your purrfect companion! Cat adoption and rescue in Bangalore & Stuttgart.',
    siteName: 'Purrfect Love',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Purrfect Love | Cat Adoption & Rescue',
    description: 'Find your purrfect companion! Cat adoption in Bangalore & Stuttgart.',
  },
  alternates: {
    canonical: 'https://www.purrfectlove.org',
    languages: {
      'en': 'https://www.purrfectlove.org',
      'de': 'https://www.purrfectlove.org/de',
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' }
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  other: {
    'geo.region': 'IN-KA;DE-BW',
    'geo.placename': 'Bangalore;Stuttgart',
  },
};

export default async function RootLayout({ children }) {
  // Detect locale from the URL path via x-pathname header (set by middleware)
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const locale = pathname.startsWith('/de') ? 'de' : 'en';

  return (
    <html lang={locale}>
      <body className={`${outfit.variable} ${lora.variable}`}>
        {children}
      </body>
    </html>
  );
}