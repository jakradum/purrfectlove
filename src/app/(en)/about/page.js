import AboutPage from '@/components/About/AboutPage';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';

export const metadata = {
  title: 'About Us - Purrfect Love',
  description: 'Meet the passionate team behind Purrfect Love. We rescue, rehabilitate, and rehome cats in Bangalore and Stuttgart.',
  alternates: {
    canonical: 'https://www.purrfectlove.org/about',
    languages: {
      'en': 'https://www.purrfectlove.org/about',
      'de': 'https://www.purrfectlove.org/de/about',
    },
  },
};

export default function About() {
  return (
    <>
      <BreadcrumbSchema
        locale="en"
        items={[
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ]}
      />
      <AboutPage locale="en" />
    </>
  );
}
