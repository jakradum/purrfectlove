import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@sanity/client';
import { createServerClient } from '@supabase/ssr';
import { createSupabaseDbClient } from '@/lib/supabaseServer';
import ProfileEditor from '@/components/Care/ProfileEditor';

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Profile | Purrfect Love Community',
};

export default async function ProfilePage() {
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
  let availRow = null;
  try {
    [{ data: profile = null }, { data: availRow }] = await Promise.all([
      serverClient.fetch(
        `*[_type == "catSitter" && _id == $id][0]{ ..., "photoUrl": photo.asset->url, "coverImageUrl": coverImage.asset->url, "cats": cats[] { ..., "vaccinationRecord": vaccinationRecord { "fileUrl": file.asset->url, "fileName": file.asset->originalFilename, date } } }`,
        { id: sitterId }
      ).then(data => ({ data })),
      createSupabaseDbClient().from('sitter_availability').select('*').eq('sitter_id', sitterId).maybeSingle(),
    ]);
  } catch (err) {
    console.error('Failed to fetch profile:', err);
  }

  if (!profile) redirect('/login');

  // Merge Supabase availability into profile — these fields live in sitter_availability,
  // not in Sanity, since the April 2026 migration.
  const mergedProfile = {
    ...profile,
    availabilityDefault: availRow?.availability_default ?? profile.availabilityDefault ?? 'available',
    unavailableDatesV2:  availRow?.unavailable_dates    ?? profile.unavailableDatesV2  ?? [],
    blockedByBooking:    availRow?.blocked_by_booking   ?? profile.blockedByBooking    ?? [],
  };

  const locale = cookieStore.get('pl_portal_locale')?.value === 'de' ? 'de' : 'en';

  return <ProfileEditor initialData={mergedProfile} locale={locale} />;
}
