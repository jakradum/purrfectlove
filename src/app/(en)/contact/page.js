import ContactPage from '@/components/Contact/ContactPage';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';

export const metadata = {
  title: 'Contact Us - Purrfect Love',
  description: 'Get in touch with Purrfect Love. We\'d love to hear from you about cat adoption, volunteering, or any questions you may have.',
  alternates: {
    canonical: 'https://purrfectlove.org/contact',
    languages: {
      'en': 'https://purrfectlove.org/contact',
      'de': 'https://purrfectlove.org/de/contact',
    },
  },
};

export default function ContactRoute() {
  return (
    <>
      <BreadcrumbSchema
        locale="en"
        items={[
          { name: 'Home', path: '/' },
          { name: 'Contact', path: '/contact' },
        ]}
      />
      <ContactPage locale="en" />
    </>
  );
}
