import TeamMemberPage from '@/components/About/TeamMemberPage';
import { client } from '@/sanity/lib/client';

export async function generateMetadata({ params }) {
  const { slug } = await params;

  const member = await client.fetch(
    `*[_type == "teamMember" && slug.current == $slug && showOnWebsite == true][0] {
      name,
      "role": role.en
    }`,
    { slug }
  );

  if (!member) {
    return {
      title: 'Team Member Not Found - Purrfect Love',
    };
  }

  return {
    title: `${member.name} - Purrfect Love`,
    description: member.role ? `${member.name} - ${member.role} at Purrfect Love` : `Meet ${member.name} from the Purrfect Love team`,
  };
}

export async function generateStaticParams() {
  const members = await client.fetch(
    `*[_type == "teamMember" && showOnWebsite == true && defined(slug.current)] {
      "slug": slug.current
    }`
  );

  return members.map((member) => ({
    slug: member.slug,
  }));
}

export default async function TeamMember({ params }) {
  const { slug } = await params;
  return <TeamMemberPage slug={slug} locale="en" />;
}
