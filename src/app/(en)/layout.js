import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';

export default function EnLayout({ children }) {
  return (
    <>
      <Navbar locale="en" />
      {children}
      <Footer locale="en" />
    </>
  );
}