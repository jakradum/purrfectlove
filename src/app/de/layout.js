import Navbar from '../../components/navbar';
import Footer from '@/components/Footer';
import LocaleSuggestion from '@/components/LocaleSuggestion';

export const metadata = {
  title: "Purrfect Love | Katzen Adoption & Rettung in Stuttgart, Deutschland",
  description: "Adoptiere eine Katze in Stuttgart! Purrfect Love ist ein Katzen-Adoptions- und Rettungskollektiv, das Katzen hilft, liebevolle Zuhause in Deutschland zu finden. Entdecke adoptierbare Katzen.",
  keywords: ['katzen adoption stuttgart', 'katzen rettung stuttgart', 'katzen adoptieren deutschland', 'stuttgart katzenhilfe', 'purrfect love deutschland', 'haustier adoption stuttgart', 'tierheim stuttgart', 'katzen adoption deutschland'],
  openGraph: {
    title: 'Purrfect Love Deutschland | Katzen Adoption Stuttgart',
    description: 'Adoptiere eine Katze in Stuttgart! Finde deinen perfekten Begleiter.',
    locale: 'de_DE',
    url: 'https://purrfectlove.org/de',
  },
  alternates: {
    canonical: 'https://purrfectlove.org/de',
    languages: {
      'en': 'https://purrfectlove.org',
      'de': 'https://purrfectlove.org/de',
    },
  },
  other: {
    'geo.region': 'DE-BW',
    'geo.placename': 'Stuttgart',
    'geo.position': '48.7758;9.1829',
  },
};

export default function DeLayout({ children }) {
  return (
    <>
      <Navbar locale="de" />
      <LocaleSuggestion currentLocale="de" />
      <div style={{ minHeight: '100vh' }}>{children}</div>
      <Footer locale="de" />
    </>
  );
}