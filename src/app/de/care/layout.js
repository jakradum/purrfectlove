import Navbar from '@/components/navbar';
import Sidebar from '@/components/Care/Sidebar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Katzensitting Netzwerk | Purrfect Love',
  description: 'Finde zuverlässige Katzensitter oder biete Sitting für andere Mitglieder an.',
  robots: { index: false, follow: false },
};

export default function DeCareLayout({ children }) {
  return (
    <>
      <Navbar locale="de" siteUrl="https://purrfectlove.org" />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', backgroundColor: '#B4D3D9' }}>
        <Sidebar locale="de" basePath="/de/care" />
        <main style={{ flex: 1, minWidth: 0, paddingBottom: '80px' }}>
          {children}
          <Footer locale="de" siteUrl="https://purrfectlove.org" />
        </main>
      </div>
    </>
  );
}
