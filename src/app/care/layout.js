import Navbar from '@/components/navbar';
import Sidebar from '@/components/Care/Sidebar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Cat Sitting Network | Purrfect Love',
  description: 'Find trusted cat sitters or offer to sit for fellow Purrfect Love members.',
  robots: { index: false, follow: false },
};

export default function CareLayout({ children }) {
  return (
    <>
      <Navbar locale="en" siteUrl="https://purrfectlove.org" />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', backgroundColor: '#B4D3D9' }}>
        <Sidebar locale="en" basePath="" />
        <main style={{ flex: 1, minWidth: 0, paddingBottom: '80px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {children}
          <div style={{ marginTop: 'auto' }}>
            <Footer locale="en" siteUrl="https://purrfectlove.org" />
          </div>
        </main>
      </div>
    </>
  );
}
