import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@sanity/client';
import { verifyToken } from '@/lib/careAuth';
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
  const token = cookieStore.get('auth_token')?.value;

  if (!token) redirect('/de/care/login');

  const payload = await verifyToken(token);
  if (!payload) redirect('/de/care/login');

  let profile = null;
  try {
    profile = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ _id, name, canSit, needsSitting, location { lat, lng, name }, guidelinesAccepted }`,
      { id: payload.sitterId }
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
      userName={payload.name || profile?.name || ''}
      userLocation={profile?.location ?? null}
    />
  );
}
