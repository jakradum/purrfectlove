import CareNavbar from '@/components/Care/CareNavbar';

export const metadata = {
  title: 'Katzensitting Netzwerk | Purrfect Love',
  description: 'Finde zuverlässige Katzensitter oder biete Sitting für andere Mitglieder an.',
  robots: { index: false, follow: false },
};

export default function DeCareLayout({ children }) {
  return (
    <>
      <CareNavbar locale="de" />
      <div style={{ minHeight: '100vh', backgroundColor: '#B4D3D9' }}>{children}</div>
    </>
  );
}
