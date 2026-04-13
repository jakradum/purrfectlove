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
      title: sitter?.name ? `${sitter.name} | Purrfect Love Community` : 'Member Profile | Purrfect Love Community',
    };
  } catch {
    return { title: 'Member Profile | Purrfect Love Community' };
  }
}

export default async function MemberProfilePage({ params }) {
  const { memberId } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const sitterId = user.user_metadata?.sitterId;

  let sitter = null;
  let feedbacks = [];
  try {
    [sitter, feedbacks] = await Promise.all([
      serverClient.fetch(
        `*[_type == "catSitter" && _id == $id && memberVerified == true][0]{
          _id, _createdAt, name, username, location, bio, email, phone,
          cats, feedingTypes, behavioralTraits,
          availabilityDefault, unavailableDatesV2,
          hideEmail, hideWhatsApp,
          avatarColour, identityVerified, trustedSitter, siteAdmin,
          canDoHomeVisit, canHostCats, maxCatsPerDay,
          "photoUrl": photo.asset->url,
          "coverImageUrl": coverImage.asset->url
        }`,
        { id: memberId }
      ),
      serverClient.fetch(
        `*[_type == "sittingFeedback" && reviewee._ref == $id] | order(createdAt desc) {
          rating, fulfilled, comment, createdAt
        }`,
        { id: memberId }
      ),
    ]);
  } catch (err) {
    console.error('Failed to fetch sitter profile:', err);
  }

  if (!sitter) notFound();

  const isOwnProfile = sitterId === memberId;

  return (
    <>
      <SitterProfile
        sitter={sitter}
        isOwnProfile={isOwnProfile}
        feedbacks={feedbacks}
      />
    </>
  );
}
