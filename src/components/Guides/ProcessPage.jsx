// src/components/Guides/ProcessPage.jsx
import styles from './ProcessPage.module.css';
import { client } from '@/sanity/lib/client';
import Breadcrumb from '@/components/Breadcrumb';
import contentEN from '@/data/pageContent.en.json';
import contentDE from '@/data/pageContent.de.json';

const copy = {
  en: {
    heading: 'What We Do',
    intro: 'At our organization, we focus on improving the lives of cats through two main areas of work.',

    s1heading: '1. Community Cat Sterilization (TNR Support)',
    s1p1: 'We actively support the sterilization of community cats. In many cases, we guide and educate people so they can safely and responsibly help cats in their own neighborhoods. For selected colonies where it is feasible and safe, our team directly steps in to carry out the work.',
    s1lead: 'Sterilization is one of the most effective ways to:',
    s1bullets: [
      'reduce unwanted litters',
      'improve the health and quality of life of community cats',
      'create a sustainable and humane solution for cat populations',
    ],
    s1closing: 'We believe in working with people, not just for them.',

    s2heading: '2. Cat Rehoming & Adoption',
    s2p1: 'Another important part of our work is finding new, loving homes for cats that can no longer stay with their current owners for various reasons.',
    s2p2: 'In these cases, the cat comes to us first before being adopted out. This is important for two reasons:',

    s2sub1heading: 'Behavior & Adjustment',
    s2sub1p: 'Some cats need a bit of help before they are ready for a new home. By taking them in, we can:',
    s2sub1bullets: [
      'assess their behavior',
      'help correct or improve any issues',
      'give them a fresh start in the best possible condition',
    ],

    s2sub2heading: 'Structured Adoption Process',
    s2sub2p: 'Adoption is not a single step, but a process designed to ensure the best match for both the cat and the adopter. This includes:',
    s2sub2bullets: [
      'time to get to know the cat',
      'careful matching with the right person or family',
      'a few steps to build trust and understanding',
    ],

    s3heading: 'Important: Surrender Agreement',
    s3p1: 'When a cat is given up by its owner, a surrender declaration must be signed.',
    s3lead: 'This is important to:',
    s3bullets: [
      'clarify ownership transfer',
      'avoid misunderstandings later',
      'ensure that all parties are protected',
    ],
    s3closing: 'It also allows us to take full responsibility for the cat\'s future and welfare.',

    s4heading: 'Why we do not conduct meetings at the current owner\'s home',
    s4p1: 'Our goal is to find a truly suitable and long-term home for every cat. For this, it is important that all cats can be met under comparable and calm conditions.',
    s4p2: 'Meetings at the current owner\'s home are therefore not part of our process, as the environment varies greatly from one household to another and can influence the cat\'s behavior. This makes it difficult to obtain a realistic and comparable impression for all interested parties.',
    s4lead: 'By first taking the cat into our care, we ensure that:',
    s4bullets: [
      'the cat is in a calm and safe environment',
      'all interested parties meet the cat under the same conditions',
      'the adoption process is fair and transparent',
      'the cat\'s behavior can be assessed realistically',
    ],
    s4closing: 'This allows us to make the best possible decision for both the cat and its future family.',
    closing: 'Our focus is always on the well-being of the cat and a harmonious, long-term adoption.',
  },
  de: {
    heading: 'Was wir tun',
    intro: 'Unsere Organisation konzentriert sich auf die Verbesserung des Lebens von Katzen in zwei Hauptbereichen.',

    s1heading: '1. Kastration von Straßenkatzen (TNR-Unterstützung)',
    s1p1: 'Wir unterstützen aktiv die Kastration von sogenannten Community Cats. In vielen Fällen beraten und begleiten wir Menschen dabei, Katzen in ihrer Umgebung sicher und verantwortungsvoll zu helfen. Für ausgewählte, geeignete Kolonien übernimmt unser Team die Umsetzung direkt vor Ort.',
    s1lead: 'Die Kastration ist eine der wichtigsten Maßnahmen, um:',
    s1bullets: [
      'ungewollten Nachwuchs zu verhindern',
      'die Gesundheit der Katzen zu verbessern',
      'eine nachhaltige und tierfreundliche Lösung zu schaffen',
    ],
    s1closing: 'Wir arbeiten mit den Menschen – nicht nur für sie.',

    s2heading: '2. Vermittlung & Adoption von Katzen',
    s2p1: 'Ein weiterer wichtiger Teil unserer Arbeit ist die Vermittlung von Katzen, die aus verschiedenen Gründen nicht bei ihren bisherigen Besitzern bleiben können.',
    s2p2: 'In solchen Fällen kommt die Katze zunächst zu uns. Das hat zwei wichtige Gründe:',

    s2sub1heading: 'Verhalten & Entwicklung',
    s2sub1p: 'Manche Katzen brauchen Unterstützung, bevor sie bereit für ein neues Zuhause sind. Bei uns können wir:',
    s2sub1bullets: [
      'das Verhalten beobachten',
      'mögliche Probleme erkennen und verbessern',
      'die Katze optimal auf die Vermittlung vorbereiten',
    ],

    s2sub2heading: 'Strukturierter Adoptionsprozess',
    s2sub2p: 'Eine Adoption ist kein einzelner Schritt, sondern ein Prozess, damit Mensch und Katze wirklich zueinander passen. Dazu gehören:',
    s2sub2bullets: [
      'Kennenlernen zwischen Interessent und Katze',
      'sorgfältige Auswahl der passenden Familie',
      'ein paar Schritte, um Vertrauen aufzubauen',
    ],

    s3heading: 'Wichtig: Abgabeerklärung',
    s3p1: 'Wenn eine Katze abgegeben wird, muss eine Abgabeerklärung unterschrieben werden.',
    s3lead: 'Dies ist notwendig, um:',
    s3bullets: [
      'die rechtliche Übergabe der Katze klar zu regeln',
      'Missverständnisse zu vermeiden',
      'alle Beteiligten abzusichern',
    ],
    s3closing: 'So stellen wir sicher, dass wir die volle Verantwortung für das Tier übernehmen können.',

    s4heading: 'Warum wir keine Treffen beim aktuellen Besitzer durchführen',
    s4p1: 'Unser Ziel ist es, für jede Katze ein wirklich passendes und langfristiges Zuhause zu finden. Dafür ist es wichtig, dass alle Katzen unter möglichst stressfreien und ruhigen Bedingungen kennengelernt werden können.',
    s4p2: 'Treffen beim aktuellen Besitzer sind daher nicht Teil unseres Prozesses, da die Umgebung je nach Haushalt sehr unterschiedlich ist und das Verhalten der Katze stark beeinflussen kann. Dies erschwert es, ein realistisches und aussagekräftiges Bild für alle Interessenten zu erhalten.',
    s4lead: 'Indem wir die Katze zunächst bei uns aufnehmen, stellen wir sicher, dass:',
    s4bullets: [
      'die Katze in einer neutralen, ruhigen und sicheren Umgebung ist',
      'alle Interessenten die Katze unter denselben Bedingungen kennenlernen können',
      'ein möglichst erfolgversprechender und transparenter Vermittlungsprozess gewährleistet ist',
      'das Verhalten der Katze realistisch eingeschätzt werden kann',
    ],
    s4closing: 'So können wir die bestmögliche Entscheidung für die Katze und ihre zukünftige Familie treffen.',
    closing: 'Im Mittelpunkt steht dabei immer das Wohl der Katze und eine harmonische, nachhaltige Vermittlung.',
    finalTagline: 'Unser Ziel ist einfach: gesunde Katzen, glückliche Menschen und die richtige Vermittlung für jedes Tier.',
  },
}

export default async function ProcessPage({ locale = 'en' }) {
  const content = locale === 'de' ? contentDE : contentEN;
  const processContent = content.process;
  const t = copy[locale];

  const tagField = locale === 'de' ? 'tagsDe' : 'tags';
  const [steps, adoptionPosts] = await Promise.all([client.fetch(
    `*[_type == "processStep"] | order(stepNumber asc) {
      _id,
      stepNumber,
      "title": title.${locale},
      "description": description.${locale},
      icon
    }`,
    {},
    { next: { revalidate: 60 } }
  ), client.fetch(
    `*[_type == "blogPost" && 'adoption' in ${tagField} && (language == $locale || language == "both" || !defined(language))] | order(publishedAt desc) {
      _id,
      "title": coalesce(title.${locale}, title.en, title),
      slug,
      slugDe,
      "excerpt": coalesce(excerpt.${locale}, excerpt.en, excerpt),
      publishedAt
    }`,
    { locale },
    { next: { revalidate: 60 } }
  )]);

  const homeHref = locale === 'de' ? '/de' : '/';
  const breadcrumbItems = [
    { href: homeHref, label: processContent.breadcrumb.home },
    { label: processContent.breadcrumb.process },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Breadcrumb items={breadcrumbItems} />

        <header className={styles.header}>
          <h1 className={styles.heading}>{processContent.heading}</h1>
          {processContent.subheading && (
            <p className={styles.subheading}>{processContent.subheading}</p>
          )}
        </header>

        {/* Section 1: Process Steps with Squiggly Arrows */}
        <section className={styles.stepsSection}>
          <div className={styles.stepsGrid}>
            {steps.map((step, index) => (
              <div key={step._id} className={styles.stepWrapper}>
                <div className={styles.stepCard}>
                  <span className={styles.stepNumber}>{step.stepNumber}</span>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                </div>
                {index < steps.length - 1 && (
                  <div className={styles.arrowWrapper}>
                    <div className={styles.squigglyArrow} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Detailed Steps Timeline */}
        <section className={styles.timelineSection}>
          <div className={styles.timeline}>
            {steps.map((step, index) => (
              <div key={step._id} className={styles.timelineItem}>
                <div className={styles.timelineMarker}>
                  <span className={styles.timelineNumber}>{step.stepNumber}</span>
                  {index < steps.length - 1 && (
                    <div className={styles.timelineLine} />
                  )}
                </div>
                <div className={styles.timelineContent}>
                  <h3 className={styles.timelineTitle}>{step.title}</h3>
                  {step.description && (
                    <p className={styles.timelineDescription}>{step.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Separator */}
        <div className={styles.separator} />

        {/* Section 3: What We Do — long-form prose */}
        <section className={styles.proseSection}>
          <h2 className={styles.proseHeading}>{t.heading}</h2>
          <p className={styles.proseText}>{t.intro}</p>

          {/* 1. TNR */}
          <h3 className={styles.proseSubheading}>{t.s1heading}</h3>
          <p className={styles.proseText}>{t.s1p1}</p>
          <p className={styles.proseLead}>{t.s1lead}</p>
          <ul className={styles.proseList}>
            {t.s1bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
          <p className={styles.proseText}>{t.s1closing}</p>

          {/* 2. Rehoming */}
          <h3 className={styles.proseSubheading}>{t.s2heading}</h3>
          <p className={styles.proseText}>{t.s2p1}</p>
          <p className={styles.proseText}>{t.s2p2}</p>

          <h4 className={styles.proseSubSubheading}>{t.s2sub1heading}</h4>
          <p className={styles.proseLead}>{t.s2sub1p}</p>
          <ul className={styles.proseList}>
            {t.s2sub1bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>

          <h4 className={styles.proseSubSubheading}>{t.s2sub2heading}</h4>
          <p className={styles.proseLead}>{t.s2sub2p}</p>
          <ul className={styles.proseList}>
            {t.s2sub2bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>

          {/* Surrender agreement */}
          <h3 className={styles.proseSubheading}>{t.s3heading}</h3>
          <p className={styles.proseText}>{t.s3p1}</p>
          <p className={styles.proseLead}>{t.s3lead}</p>
          <ul className={styles.proseList}>
            {t.s3bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
          <p className={styles.proseText}>{t.s3closing}</p>

          {/* No home visits */}
          <h3 className={styles.proseSubheading}>{t.s4heading}</h3>
          <p className={styles.proseText}>{t.s4p1}</p>
          <p className={styles.proseText}>{t.s4p2}</p>
          <p className={styles.proseLead}>{t.s4lead}</p>
          <ul className={styles.proseList}>
            {t.s4bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
          <p className={styles.proseText}>{t.s4closing}</p>

          <p className={styles.proseClosing}>{t.closing}</p>
          {t.finalTagline && <p className={styles.proseClosing}>{t.finalTagline}</p>}
        </section>

        <Breadcrumb items={breadcrumbItems} />

        {/* Related articles tagged 'adoption' */}
        {adoptionPosts.length > 0 && (
          <section className={styles.relatedArticles}>
            <h2 className={styles.relatedHeading}>
              {locale === 'de' ? 'Artikel zum Thema Adoption' : 'Articles on Adoption'}
            </h2>
            <div className={styles.relatedGrid}>
              {adoptionPosts.map(post => {
                const slug = locale === 'de' && post.slugDe ? post.slugDe.current : post.slug?.current;
                const href = locale === 'de' ? `/de/blog/${slug}` : `/blog/${slug}`;
                const date = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
                return (
                  <a key={post._id} href={href} className={styles.relatedCard}>
                    {date && <span className={styles.relatedDate}>{date}</span>}
                    <h3 className={styles.relatedTitle}>{post.title}</h3>
                    {post.excerpt && <p className={styles.relatedExcerpt}>{post.excerpt}</p>}
                    <span className={styles.relatedReadMore}>{locale === 'de' ? 'Weiterlesen →' : 'Read more →'}</span>
                  </a>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
