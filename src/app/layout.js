import { Outfit, Lora } from 'next/font/google';
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
  title: "Purrfect Love | Cat adoption & Rehab",
  description: "Cat adoption and rescue collective based in Bangalore and Stuttgart",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' }
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${lora.variable}`}>
        {children}
      </body>
    </html>
  );
}