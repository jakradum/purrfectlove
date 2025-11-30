// src/components/About/AboutPage.jsx
import styles from './AboutPage.module.css';
import { client } from '@/sanity/lib/client';
import imageUrlBuilder from '@sanity/image-url';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';
import contentEN from '@/data/pageContent.en.json';
import contentDE from '@/data/pageContent.de.json';

const builder = imageUrlBuilder(client);

function urlFor(source) {
  return builder.image(source);
}

export default async function AboutPage({ locale = 'en' }) {
  const content = locale === 'de' ? contentDE : contentEN;
  const aboutContent = content.about;

  const teamMembers = await client.fetch(
    `*[_type == "teamMember" && showOnWebsite == true] | order(order asc) {
      _id,
      name,
      "slug": slug.current,
      "role": role.${locale},
      image {
        asset-> {
          _id,
          url
        }
      }
    }`,
    {},
    { next: { revalidate: 60 } }
  );

  const homeHref = locale === 'de' ? '/de' : '/';
  const breadcrumbItems = [
    { href: homeHref, label: aboutContent.breadcrumb.home },
    { label: aboutContent.breadcrumb.about },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Breadcrumb items={breadcrumbItems} />

        <header className={styles.header}>
          <h1 className={styles.heading}>{aboutContent.heading}</h1>
          {aboutContent.subheading && (
            <p className={styles.subheading}>{aboutContent.subheading}</p>
          )}
        </header>

        <section className={styles.teamSection}>
          <div className={styles.grid}>
            {teamMembers.map((member) => {
              const memberHref = member.slug
                ? (locale === 'de' ? `/de/about/${member.slug}` : `/about/${member.slug}`)
                : null;

              const cardContent = (
                <>
                  {member.image?.asset ? (
                    <img
                      src={urlFor(member.image).width(400).height(400).url()}
                      alt={member.name}
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.imagePlaceholder}>No image</div>
                  )}
                  <div className={styles.info}>
                    <h3 className={styles.name}>{member.name}</h3>
                    {member.role && (
                      <p className={styles.role}>{member.role}</p>
                    )}
                    {memberHref && (
                      <span className={styles.readMore}>
                        {locale === 'de' ? 'Mehr erfahren →' : 'Read more →'}
                      </span>
                    )}
                  </div>
                </>
              );

              return memberHref ? (
                <Link key={member._id} href={memberHref} className={styles.card}>
                  {cardContent}
                </Link>
              ) : (
                <div key={member._id} className={styles.card}>
                  {cardContent}
                </div>
              );
            })}
          </div>
        </section>

        {aboutContent.mission && (
          <section className={styles.missionSection}>
            <h2 className={styles.missionHeading}>{aboutContent.mission.heading}</h2>
            <p className={styles.missionBody}>{aboutContent.mission.body}</p>
          </section>
        )}

        <Breadcrumb items={breadcrumbItems} />
      </div>
    </main>
  );
}
