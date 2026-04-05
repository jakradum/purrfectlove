import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@sanity/client';
import { createServerClient } from '@supabase/ssr';
import Marketplace from '@/components/Care/Marketplace';
import GuidelinesGate from '@/components/Care/GuidelinesGate';

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Purrfect Love Community | Purrfect Love' };

export default async function DeCarePage() {
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
      `*[_type == "catSitter" && _id == $id][0]{ _id, name, canSit, needsSitting, location { lat, lng, name }, guidelinesAccepted }`,
      { id: sitterId }
    );
  } catch (err) {
    console.error('Failed to fetch profile for marketplace:', err);
  }

  if (!profile?.guidelinesAccepted) {
    return <GuidelinesGate locale="de" />;
  }

  return (
    <Marketplace
      locale="de"
      initialCanSit={profile?.canSit ?? false}
      initialNeedsSitting={profile?.needsSitting ?? false}
      userName={profile?.name || ''}
      userLocation={profile?.location ?? null}
      sitterId={sitterId}
    />
  );
}
