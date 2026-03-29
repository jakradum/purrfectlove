import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@sanity/client';
import { verifyToken } from '@/lib/careAuth';
import SitterProfile from '@/components/Care/SitterProfile';
import FeedbackDisplay from '@/components/Care/FeedbackDisplay';

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
      title: sitter?.name ? `${sitter.name} | Cat Sitting Network` : 'Member Profile | Cat Sitting Network',
    };
  } catch {
    return { title: 'Member Profile | Cat Sitting Network' };
  }
}

export default async function MemberProfilePage({ params }) {
  const { memberId } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) redirect('/care/login');

  const payload = await verifyToken(token);
  if (!payload) redirect('/care/login');

  let sitter = null;
  let feedbacks = [];
  try {
    [sitter, feedbacks] = await Promise.all([
      serverClient.fetch(
        `*[_type == "catSitter" && _id == $id && memberVerified == true][0]{
          _id, name, location, bio, email, phone, contactPreference,
          bedrooms, householdSize, cats, maxCats, feedingTypes, behavioralTraits,
          canSit, needsSitting, alwaysAvailable, availableDates,
          hideEmail, hideWhatsApp
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

  const contactHidden = sitter.hideEmail && sitter.hideWhatsApp;

  return (
    <>
      <SitterProfile sitter={sitter} />
      {contactHidden && (
        <div style={{ padding: '0 1.5rem 1rem' }}>
          <a href={`/care/inbox?to=${sitter._id}`} className="sendMsgBtn" style={{
            display: 'inline-block',
            padding: '0.65rem 1.5rem',
            background: 'var(--hunter-green)',
            color: 'var(--whisker-cream)',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}>
            Send Message
          </a>
        </div>
      )}
      <FeedbackDisplay feedbacks={feedbacks} locale="en" />
    </>
  );
}
