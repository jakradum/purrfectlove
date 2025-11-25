import Navbar from '../../components/navbar';
import Footer from '@/components/Footer';

export default function DeLayout({ children }) {
  return (
    <>
      <Navbar locale="de" />
      <div style={{ minHeight: '100vh' }}>{children}</div>
      <Footer locale="de" />
    </>
  );
}