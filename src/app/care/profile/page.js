import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@sanity/client';
import { verifyToken } from '@/lib/careAuth';
import ProfileEditor from '@/components/Care/ProfileEditor';

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

export const metadata = {
  title: 'My Profile | Cat Sitting Network',
};

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) redirect('/login');

  const payload = await verifyToken(token);
  if (!payload) redirect('/login');

  let profile = null;
  try {
    profile = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]`,
      { id: payload.sitterId }
    );
  } catch (err) {
    console.error('Failed to fetch profile:', err);
  }

  if (!profile) redirect('/login');

  return <ProfileEditor initialData={profile} />;
}
