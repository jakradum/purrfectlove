import styles from './TeamMemberPage.module.css';
import { client } from '@/sanity/lib/client';
import imageUrlBuilder from '@sanity/image-url';
import Breadcrumb from '@/components/Breadcrumb';
import { PortableText } from '@portabletext/react';
import { notFound } from 'next/navigation';
import contentEN from '@/data/pageContent.en.json';
import contentDE from '@/data/pageContent.de.json';

const builder = imageUrlBuilder(client);

function urlFor(source) {
  return builder.image(source);
}

export default async function TeamMemberPage({ slug, locale = 'en' }) {
  const content = locale === 'de' ? contentDE : contentEN;
  const aboutContent = content.about;

  const member = await client.fetch(
    `*[_type == "teamMember" && slug.current == $slug && showOnWebsite == true][0] {
      _id,
      name,
      "slug": slug.current,
      "role": role.${locale},
      "bio": bio.${locale},
      image {
        asset-> {
          _id,
          url
        }
      }
    }`,
    { slug },
    { next: { revalidate: 60 } }
  );

  if (!member) {
    notFound();
  }

  const homeHref = locale === 'de' ? '/de' : '/';
  const aboutHref = locale === 'de' ? '/de/about' : '/about';
  const breadcrumbItems = [
    { href: homeHref, label: aboutContent.breadcrumb.home },
    { href: aboutHref, label: aboutContent.breadcrumb.about },
    { label: member.name },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Breadcrumb items={breadcrumbItems} />

        <article className={styles.article}>
          <div className={styles.imageWrapper}>
            {member.image?.asset ? (
              <img
                src={urlFor(member.image).width(600).height(600).url()}
                alt={member.name}
                className={styles.image}
              />
            ) : (
              <div className={styles.imagePlaceholder}>No image</div>
            )}
          </div>

          <div className={styles.content}>
            <h1 className={styles.name}>{member.name}</h1>
            {member.role && (
              <p className={styles.role}>{member.role}</p>
            )}
            {member.bio && (
              <div className={styles.bio}>
                <PortableText value={member.bio} />
              </div>
            )}
          </div>
        </article>

        <Breadcrumb items={breadcrumbItems} />
      </div>
    </main>
  );
}
