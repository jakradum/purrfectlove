import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Cat Sitting Network | Purrfect Love',
  description: 'Find trusted cat sitters or offer to sit for fellow Purrfect Love members.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CareLayout({ children }) {
  return (
    <>
      <Navbar locale="en" />
      <div style={{ minHeight: '100vh' }}>{children}</div>
      <Footer locale="en" />
    </>
  );
}
