import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@sanity/client';
import { createServerClient } from '@supabase/ssr';
import SitterProfile from '@/components/Care/SitterProfile';

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

export async function generateMetadata({ params }) {
  const { memberId } = await params;
  try {
    const sitter = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id && memberVerified == true][0]{ name }`,
      { id: memberId }
    );
    return {
      title: sitter?.name ? `${sitter.name} | Purrfect Love Community` : 'Mitgliedsprofil | Purrfect Love Community',
    };
  } catch {
    return { title: 'Mitgliedsprofil | Purrfect Love Community' };
  }
}

export default async function DeMemberProfilePage({ params }) {
  const { memberId } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/de/care/login');

  let sitter = null;
  try {
    sitter = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id && memberVerified == true][0]{
        _id, name, location, bio, email, phone, contactPreference,
        bedrooms, householdSize, cats, maxHomesPerDay, feedingTypes, behavioralTraits,
        canSit, needsSitting, alwaysAvailable, availableDates
      }`,
      { id: memberId }
    );
  } catch (err) {
    console.error('Failed to fetch sitter profile:', err);
  }

  if (!sitter) notFound();

  return <SitterProfile locale="de" sitter={sitter} />;
}
