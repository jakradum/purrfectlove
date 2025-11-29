import CatDetailPage from '@/components/Adopt/CatDetailPage';

export const dynamic = 'force-dynamic';

export default async function CatDetailRoute({ params }) {
  const { slug } = await params;
  return <CatDetailPage slug={slug} locale="en" />;
}
