import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';

export default function EnLayout({ children }) {
  return (
    <>
      <Navbar locale="en" />
      <div style={{ minHeight: '100vh' }}>{children}</div>
      <Footer locale="en" />
    </>
  );
}