// src/components/Guides/OnboardingPage.jsx
import styles from './OnboardingPage.module.css';
import Breadcrumb from '@/components/Breadcrumb';
import contentEN from '@/data/pageContent.en.json';
import contentDE from '@/data/pageContent.de.json';

export default function OnboardingPage({ locale = 'en' }) {
  const content = locale === 'de' ? contentDE : contentEN;
  const onboardingContent = content.onboarding;

  const homeHref = locale === 'de' ? '/de' : '/';
  const breadcrumbItems = [
    { href: homeHref, label: onboardingContent.breadcrumb.home },
    { label: onboardingContent.breadcrumb.onboarding },
  ];

  // HowTo Schema for SEO
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: onboardingContent.heading,
    description: onboardingContent.subheading,
    totalTime: 'P21D',
    step: onboardingContent.timeline.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: `${step.day}: ${step.title}`,
      text: step.content.join(' '),
    })),
  };

  return (
    <main className={styles.main}>
      {/* HowTo Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <div className={styles.container}>
        <Breadcrumb items={breadcrumbItems} />

        <header className={styles.header}>
          <h1 className={styles.heading}>{onboardingContent.heading}</h1>
          {onboardingContent.subheading && (
            <p className={styles.subheading}>{onboardingContent.subheading}</p>
          )}
        </header>

        <article className={styles.article}>
          {/* Introduction */}
          <div className={styles.intro}>
            {onboardingContent.intro.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {/* Timeline */}
          <div className={styles.timeline}>
            {onboardingContent.timeline.map((step, index) => (
              <section key={index} className={styles.timelineItem}>
                <h2 className={styles.timelineHeading}>
                  <span className={styles.dayMarker}>{step.day}</span>
                  {step.title}
                </h2>

                <div className={styles.timelineContent}>
                  {step.content.map((paragraph, pIndex) => (
                    <p key={pIndex}>{paragraph}</p>
                  ))}

                  {step.tip && (
                    <aside className={styles.tip}>
                      <strong>{locale === 'de' ? 'Tipp:' : 'Tip:'}</strong> {step.tip}
                    </aside>
                  )}
                </div>
              </section>
            ))}
          </div>

          {/* Closing */}
          <div className={styles.closing}>
            <p>{onboardingContent.closing.line1}</p>
            <p className={styles.closingBold}>{onboardingContent.closing.line2}</p>
          </div>
        </article>

        <Breadcrumb items={breadcrumbItems} />
      </div>
    </main>
  );
}
