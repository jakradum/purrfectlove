import CatDetailPage from '@/components/Apply/CatDetailPage';

export const dynamic = 'force-dynamic';

export default async function CatDetailRoute({ params }) {
  const { slug } = await params;
  return <CatDetailPage slug={slug} locale="de" />;
}
