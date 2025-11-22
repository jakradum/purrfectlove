import Navbar from '../../components/navbar';
import Footer from '@/components/Footer';

export default function DeLayout({ children }) {
  return (
    <>
      <Navbar locale="de" />
      {children}
<Footer locale='de' />
    </>
  );
}