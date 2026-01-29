import OnboardingPage from '@/components/Guides/OnboardingPage';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';

export const metadata = {
  title: 'Die ersten Tage mit Ihrer neuen Katze - Purrfect Love',
  description: 'Ein vollständiger Leitfaden, um Ihrer neuen Katze zu helfen, sich in ihrem neuen Zuhause einzuleben. Erfahren Sie, was Sie in den ersten 3 Wochen erwarten können.',
  alternates: {
    canonical: 'https://www.purrfectlove.org/de/guides/onboarding',
    languages: {
      'en': 'https://www.purrfectlove.org/guides/onboarding',
      'de': 'https://www.purrfectlove.org/de/guides/onboarding',
    },
  },
};

export default function OnboardingRoute() {
  return (
    <>
      <BreadcrumbSchema
        locale="de"
        items={[
          { name: 'Startseite', path: '/' },
          { name: 'Die ersten Tage', path: '/guides/onboarding' },
        ]}
      />
      <OnboardingPage locale="de" />
    </>
  );
}
