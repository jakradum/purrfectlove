import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@sanity/client';
import { verifyToken } from '@/lib/careAuth';
import Marketplace from '@/components/Care/Marketplace';

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

export const metadata = {
  title: 'Cat Sitting Network | Purrfect Love',
};

export default async function CarePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/care/login');
  }

  const payload = await verifyToken(token);
  if (!payload) {
    redirect('/care/login');
  }

  // Fetch current user's profile (just the toggles needed for initial state)
  let profile = null;
  try {
    profile = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ _id, name, canSit, needsSitting, location }`,
      { id: payload.sitterId }
    );
  } catch (err) {
    console.error('Failed to fetch profile for marketplace:', err);
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
