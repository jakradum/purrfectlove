import CatDetailPage from '@/components/Adopt/CatDetailPage';
import { client } from '@/sanity/lib/client';

export const revalidate = 60;

const BASE_URL = 'https://www.purrfectlove.org';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cat = await client.fetch(
    `*[_type == "cat" && slug.current == $slug][0]{
      name, description, traits,
      "photoUrl": photos[0].asset->url,
      "slugDe": slug.current
    }`,
    { slug }
  );
  if (!cat) return {};
  const title = `${cat.name} – Adopt a Cat | Purrfect Love`;
  const description = cat.traits
    ? `${cat.traits} — ${cat.description || ''}`.trim().replace(/—\s*$/, '')
    : cat.description || `Meet ${cat.name}, a cat looking for a forever home.`;
  const imageUrl = cat.photoUrl ? `${cat.photoUrl}?w=1200&h=630&fit=crop` : null;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/adopt/${slug}`,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: cat.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `${BASE_URL}/adopt/${slug}`,
      languages: {
        en: `${BASE_URL}/adopt/${slug}`,
        de: `${BASE_URL}/de/adopt/${slug}`,
      },
    },
  };
}

export default async function CatDetailRoute({ params }) {
  const { slug } = await params;
  return <CatDetailPage slug={slug} locale="en" />;
}
