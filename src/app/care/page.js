import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@sanity/client';
import { verifyToken } from '@/lib/careAuth';
import { isProfileComplete } from '@/lib/profileComplete';
import Marketplace from '@/components/Care/Marketplace';
import IncompleteProfileGate from '@/components/Care/IncompleteProfileGate';

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
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = await verifyToken(token);
  if (!payload) {
    redirect('/login');
  }

  let profile = null;
  try {
    profile = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ _id, name, email, canSit, needsSitting, location { lat, lng, name } }`,
      { id: payload.sitterId }
    );
  } catch (err) {
    console.error('Failed to fetch profile for marketplace:', err);
  }

  if (!isProfileComplete(profile)) {
    return <IncompleteProfileGate />;
  }

  return (
    <Marketplace
      initialCanSit={profile?.canSit ?? false}
      initialNeedsSitting={profile?.needsSitting ?? false}
      userName={payload.name || profile?.name || ''}
      userLocation={profile?.location ?? null}
    />
  );
}
