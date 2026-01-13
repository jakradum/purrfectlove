import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import LocaleSuggestion from '@/components/LocaleSuggestion';

export default function EnLayout({ children }) {
  return (
    <>
      <Navbar locale="en" />
      <LocaleSuggestion currentLocale="en" />
      <div style={{ minHeight: '100vh' }}>{children}</div>
      <Footer locale="en" />
    </>
  );
}