// src/components/Guides/ProcessPage.jsx
import styles from './ProcessPage.module.css';
import { client } from '@/sanity/lib/client';
import Breadcrumb from '@/components/Breadcrumb';
import contentEN from '@/data/pageContent.en.json';
import contentDE from '@/data/pageContent.de.json';

const copy = {
  en: {
    heading: 'What We Do',
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
  },
}

export default async function ProcessPage({ locale = 'en' }) {
  const content = locale === 'de' ? contentDE : contentEN;
  const processContent = content.process;
  const t = copy[locale];

  const steps = await client.fetch(
    `*[_type == "processStep"] | order(stepNumber asc) {
      _id,
      stepNumber,
      "title": title.${locale},
      "description": description.${locale},
      icon
    }`,
    {},
    { next: { revalidate: 60 } }
  );

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

          <h3 className={styles.proseSubheading}>{t.s4heading}</h3>
          <p className={styles.proseText}>{t.s4p1}</p>
          <p className={styles.proseText}>{t.s4p2}</p>
          <p className={styles.proseLead}>{t.s4lead}</p>
          <ul className={styles.proseList}>
            {t.s4bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
          <p className={styles.proseText}>{t.s4closing}</p>

          <p className={styles.proseClosing}>{t.closing}</p>
        </section>

        <Breadcrumb items={breadcrumbItems} />
      </div>
    </main>
  );
}
