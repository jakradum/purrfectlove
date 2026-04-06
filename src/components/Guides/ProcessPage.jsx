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
    s1intro: 'We actively support the sterilization of community cats. In many cases, we guide and educate people so they can safely and responsibly help cats in their own neighborhoods. For selected colonies where it is feasible and safe, our team directly steps in to carry out the work.',
    s1lead: 'Sterilization is one of the most effective ways to:',
    s1bullets: [
      'reduce unwanted litters',
      'improve the health and quality of life of community cats',
      'create a sustainable and humane solution for cat populations',
    ],
    s1closing: 'We believe in working with people, not just for them.',
    s2heading: '2. Cat Rehoming & Adoption',
    s2intro: 'Another important part of our work is finding new, loving homes for cats that can no longer stay with their current owners for various reasons.',
    s2lead: 'In these cases, the cat comes to us first before being adopted out. This is important for two reasons:',
    s2a_heading: 'Behavior & Adjustment',
    s2a_intro: 'Some cats need a bit of help before they are ready for a new home. By taking them in, we can:',
    s2a_bullets: [
      'assess their behavior',
      'help correct or improve any issues',
      'give them a fresh start in the best possible condition',
    ],
    s2b_heading: 'Structured Adoption Process',
    s2b_intro: 'Adoption is not a single step, but a process designed to ensure the best match for both the cat and the adopter. This includes:',
    s2b_bullets: [
      'time to get to know the cat',
      'careful matching with the right person or family',
      'a few steps to build trust and understanding',
    ],
    s3heading: 'Important: Surrender Agreement',
    s3intro: 'When a cat is given up by its owner, a surrender declaration must be signed.',
    s3lead: 'This is important to:',
    s3bullets: [
      'clarify ownership transfer',
      'avoid misunderstandings later',
      'ensure that all parties are protected',
    ],
    s3closing: 'It also allows us to take full responsibility for the cat\'s future and welfare.',
    s4heading: 'Why We Do Not Conduct Home Visits at the Current Owners\' Location',
    s4p1: 'Our adoption process is carefully designed and absolutely necessary to ensure the best match between cat and adopter. However, carrying out this process at the current owner\'s home is not practical.',
    s4p2: 'Each time a "meet & greet" takes place, it would require traveling to the owner\'s location, which is time-consuming and difficult to organize consistently. This approach is not sustainable and can delay the entire adoption process.',
    s4lead: 'Instead, we bring the cat into our care, where we can:',
    s4bullets: [
      'conduct the adoption process in a structured and professional way',
      'support every step with the Purrfect Love team',
      'ensure safety, consistency, and proper guidance',
    ],
    s4closing: 'This allows us to focus fully on the needs of the cat and the future adopter, without logistical limitations.',
    closing: 'Our goal is simple: healthy cats, happy people, and the right match every time.',
  },
  de: {
    heading: 'Was wir tun',
    intro: 'Unsere Organisation konzentriert sich auf die Verbesserung des Lebens von Katzen in zwei Hauptbereichen.',
    s1heading: '1. Kastration von Straßenkatzen (TNR-Unterstützung)',
    s1intro: 'Wir unterstützen aktiv die Kastration von sogenannten Community Cats. In vielen Fällen beraten und begleiten wir Menschen dabei, Katzen in ihrer Umgebung sicher und verantwortungsvoll zu helfen. Für ausgewählte, geeignete Kolonien übernimmt unser Team die Umsetzung direkt vor Ort.',
    s1lead: 'Die Kastration ist eine der wichtigsten Maßnahmen, um:',
    s1bullets: [
      'ungewollten Nachwuchs zu verhindern',
      'die Gesundheit der Katzen zu verbessern',
      'eine nachhaltige und tierfreundliche Lösung zu schaffen',
    ],
    s1closing: 'Wir arbeiten mit den Menschen – nicht nur für die Katzen.',
    s2heading: '2. Vermittlung & Adoption von Katzen',
    s2intro: 'Ein weiterer wichtiger Teil unserer Arbeit ist die Vermittlung von Katzen, die aus verschiedenen Gründen nicht bei ihren bisherigen Besitzern bleiben können.',
    s2lead: 'In solchen Fällen kommt die Katze zunächst zu uns. Das hat zwei wichtige Gründe:',
    s2a_heading: 'Verhalten & Entwicklung',
    s2a_intro: 'Manche Katzen brauchen Unterstützung, bevor sie bereit für ein neues Zuhause sind. Bei uns können wir:',
    s2a_bullets: [
      'das Verhalten beobachten',
      'mögliche Probleme erkennen und verbessern',
      'die Katze optimal auf die Vermittlung vorbereiten',
    ],
    s2b_heading: 'Strukturierter Adoptionsprozess',
    s2b_intro: 'Eine Adoption ist kein einzelner Schritt, sondern ein Prozess, damit Mensch und Katze wirklich zueinander passen. Dazu gehören:',
    s2b_bullets: [
      'Kennenlernen zwischen Interessent und Katze',
      'sorgfältige Auswahl der passenden Familie',
      'ein paar Schritte, um Vertrauen aufzubauen',
    ],
    s3heading: 'Wichtig: Surrender-Deklaration',
    s3intro: 'Wenn eine Katze abgegeben wird, muss eine Surrender-Erklärung unterschrieben werden.',
    s3lead: 'Dies ist notwendig, um:',
    s3bullets: [
      'die rechtliche Übergabe der Katze klar zu regeln',
      'Missverständnisse zu vermeiden',
      'alle Beteiligten abzusichern',
    ],
    s3closing: 'So stellen wir sicher, dass wir die volle Verantwortung für das Tier übernehmen können.',
    s4heading: 'Warum wir keine Treffen beim aktuellen Besitzer durchführen',
    s4p1: 'Unser Adoptionsprozess ist sorgfältig aufgebaut und notwendig, um die bestmögliche Vermittlung zwischen Katze und Adoptant zu gewährleisten. Es ist jedoch nicht praktikabel, diesen Prozess beim aktuellen Besitzer durchzuführen.',
    s4p2: 'Bei jedem „Meet & Greet" müsste man zum jeweiligen Wohnort fahren, was sehr zeitaufwendig ist und organisatorisch schwierig umzusetzen ist. Diese Vorgehensweise ist auf Dauer nicht effizient und könnte den gesamten Vermittlungsprozess unnötig verlangsamen.',
    s4lead: 'Deshalb nehmen wir die Katze zunächst bei uns auf. So können wir:',
    s4bullets: [
      'den Adoptionsprozess strukturiert und professionell durchführen',
      'jeden Schritt gemeinsam mit dem Purrfect Love Team begleiten',
      'Sicherheit, Kontinuität und Unterstützung gewährleisten',
    ],
    s4closing: 'Dadurch können wir uns voll und ganz auf das Wohl der Katze und die zukünftigen Adoptanten konzentrieren, ohne logistische Einschränkungen.',
    closing: 'Unser Ziel ist einfach: gesunde Katzen, glückliche Menschen und die richtige Vermittlung für jedes Tier.',
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
          <p className={styles.proseText}>{t.intro}</p>

          <h3 className={styles.proseSubheading}>{t.s1heading}</h3>
          <p className={styles.proseText}>{t.s1intro}</p>
          <p className={styles.proseLead}>{t.s1lead}</p>
          <ul className={styles.proseList}>
            {t.s1bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
          <p className={styles.proseText}><em>{t.s1closing}</em></p>

          <h3 className={styles.proseSubheading}>{t.s2heading}</h3>
          <p className={styles.proseText}>{t.s2intro}</p>
          <p className={styles.proseLead}>{t.s2lead}</p>

          <h4 className={styles.proseLabel}>{t.s2a_heading}</h4>
          <p className={styles.proseText}>{t.s2a_intro}</p>
          <ul className={styles.proseList}>
            {t.s2a_bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>

          <h4 className={styles.proseLabel}>{t.s2b_heading}</h4>
          <p className={styles.proseText}>{t.s2b_intro}</p>
          <ul className={styles.proseList}>
            {t.s2b_bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>

          <h3 className={styles.proseSubheading}>{t.s3heading}</h3>
          <p className={styles.proseText}>{t.s3intro}</p>
          <p className={styles.proseLead}>{t.s3lead}</p>
          <ul className={styles.proseList}>
            {t.s3bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
          <p className={styles.proseText}>{t.s3closing}</p>

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
