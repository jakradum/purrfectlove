import OnboardingPage from '@/components/Guides/OnboardingPage';

export const metadata = {
  title: 'Die ersten Tage mit Ihrer neuen Katze - Purrfect Love',
  description: 'Ein vollständiger Leitfaden, um Ihrer neuen Katze zu helfen, sich in ihrem neuen Zuhause einzuleben. Erfahren Sie, was Sie in den ersten 3 Wochen nach der Adoption erwarten können.',
};

export default function OnboardingRoute() {
  return <OnboardingPage locale="de" />;
}
