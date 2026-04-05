import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@sanity/client';
import { createServerClient } from '@supabase/ssr';
import ProfileEditor from '@/components/Care/ProfileEditor';

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

export const metadata = { title: 'Mein Profil | Purrfect Love Community' };

export default async function DeProfilePage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/de/care/login');

  const sitterId = user.user_metadata?.sitterId;

  let profile = null;
  try {
    profile = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]`,
      { id: sitterId }
    );
  } catch (err) {
    console.error('Failed to fetch profile:', err);
  }

  if (!profile) redirect('/de/care/login');

  return <ProfileEditor locale="de" initialData={profile} />;
}
