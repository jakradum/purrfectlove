import CareNavbar from '@/components/Care/CareNavbar';

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
      <CareNavbar locale="en" />
      <div style={{ minHeight: '100vh', backgroundColor: '#B4D3D9' }}>{children}</div>
    </>
  );
}
