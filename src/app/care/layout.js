import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSanityClient } from '@sanity/client';
import Navbar from '@/components/navbar';
import Sidebar from '@/components/Care/Sidebar';
import Footer from '@/components/Footer';
import PostHogProvider from '@/components/PostHogProvider';
import PostHogPageView from '@/components/PostHogPageView';

export const metadata = {
  title: 'Purrfect Love Community | Purrfect Love',
  description: 'Find trusted cat sitters or offer to sit for fellow Purrfect Love members.',
  robots: { index: false, follow: false },
};

const sanity = createSanityClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
});

export default async function CareLayout({ children }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const sitterId = user?.user_metadata?.sitterId || null;
  const isTeamMember = user?.user_metadata?.isTeamMember ?? false;

  let memberName = null;
  if (sitterId) {
    try {
      const profile = await sanity.fetch(
        `*[_type == "catSitter" && _id == $id][0]{ name }`,
        { id: sitterId }
      );
      memberName = profile?.name || null;
    } catch { /* non-fatal */ }
  }

  return (
    <PostHogProvider sitterId={sitterId} name={memberName} locale="en" isTeamMember={isTeamMember}>
      <PostHogPageView />
      <Navbar locale="en" siteUrl="https://purrfectlove.org" />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', backgroundColor: '#B4D3D9' }}>
        <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 64px)' }}>
          <Sidebar locale="en" basePath="" sitterId={sitterId} />
          <main style={{ flex: 1, minWidth: 0, paddingBottom: '80px', fontFamily: 'var(--font-outfit)' }}>
            {children}
          </main>
        </div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Footer locale="en" siteUrl="https://purrfectlove.org" />
        </div>
      </div>
    </PostHogProvider>
  );
}
