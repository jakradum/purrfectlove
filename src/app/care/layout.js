import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Navbar from '@/components/navbar';
import Sidebar from '@/components/Care/Sidebar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Purrfect Love Community | Purrfect Love',
  description: 'Find trusted cat sitters or offer to sit for fellow Purrfect Love members.',
  robots: { index: false, follow: false },
};

export default async function CareLayout({ children }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const sitterId = user?.user_metadata?.sitterId || null;
  const isTeamMember = user?.user_metadata?.isTeamMember || false;

  return (
    <>
      <Navbar locale="en" siteUrl="https://purrfectlove.org" />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', backgroundColor: '#B4D3D9' }}>
        <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 64px)' }}>
          <Sidebar locale="en" basePath="" sitterId={sitterId} isTeamMember={isTeamMember} />
          <main style={{ flex: 1, minWidth: 0, paddingBottom: '80px' }}>
            {children}
          </main>
        </div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Footer locale="en" siteUrl="https://purrfectlove.org" />
        </div>
      </div>
    </>
  );
}
