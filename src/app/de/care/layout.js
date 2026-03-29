import Navbar from '@/components/navbar';
import Sidebar from '@/components/Care/Sidebar';

export const metadata = {
  title: 'Katzensitting Netzwerk | Purrfect Love',
  description: 'Finde zuverlässige Katzensitter oder biete Sitting für andere Mitglieder an.',
  robots: { index: false, follow: false },
};

export default function DeCareLayout({ children }) {
  return (
    <>
      <Navbar locale="de" />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', backgroundColor: '#B4D3D9' }}>
        <Sidebar locale="de" basePath="/de/care" />
        <main style={{ flex: 1, minWidth: 0, paddingBottom: '80px' }}>
          {children}
        </main>
      </div>
    </>
  );
}
