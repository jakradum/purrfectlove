import Navbar from '../../components/navbar';
import Footer from '@/components/Footer';
import LocaleSuggestion from '@/components/LocaleSuggestion';

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