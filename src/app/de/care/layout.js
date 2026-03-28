import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Katzensitting Netzwerk | Purrfect Love',
  description: 'Finde zuverlässige Katzensitter oder biete Sitting für andere Mitglieder an.',
  robots: { index: false, follow: false },
};

export default function DeCareLayout({ children }) {
  return (
    <>
      <Navbar locale="de" />
      <div style={{ minHeight: '100vh' }}>{children}</div>
      <Footer locale="de" />
    </>
  );
}
