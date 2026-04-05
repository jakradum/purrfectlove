import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@sanity/client';
import { createServerClient } from '@supabase/ssr';
import { isProfileComplete } from '@/lib/profileComplete';
import Marketplace from '@/components/Care/Marketplace';
import IncompleteProfileGate from '@/components/Care/IncompleteProfileGate';
import GuidelinesGate from '@/components/Care/GuidelinesGate';

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Purrfect Love Community | Purrfect Love',
};

export default async function CarePage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const sitterId = user.user_metadata?.sitterId;

  let profile = null;
  try {
    profile = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ _id, name, email, location { lat, lng, name }, guidelinesAccepted }`,
      { id: sitterId }
    );
  } catch (err) {
    console.error('Failed to fetch profile for marketplace:', err);
  }

  if (!isProfileComplete(profile)) {
    return <IncompleteProfileGate />;
  }

  // Show guidelines gate on first entry (before accessing the community)
  if (!profile?.guidelinesAccepted) {
    return <GuidelinesGate locale="en" />;
  }

  return (
    <Marketplace
      userLocation={profile?.location ?? null}
      sitterId={sitterId}
    />
  );
}
