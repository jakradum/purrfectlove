// src/components/Guides/ProcessPage.jsx
import styles from './ProcessPage.module.css';
import { client } from '@/sanity/lib/client';
import Breadcrumb from '@/components/Breadcrumb';
import contentEN from '@/data/pageContent.en.json';
import contentDE from '@/data/pageContent.de.json';

export default async function ProcessPage({ locale = 'en' }) {
  const content = locale === 'de' ? contentDE : contentEN;
  const processContent = content.process;

  const steps = await client.fetch(
    `*[_type == "processStep"] | order(stepNumber asc) {
      _id,
      stepNumber,
      "title": title.${locale},
      "description": description.${locale},
      icon
    }`
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

        <Breadcrumb items={breadcrumbItems} />
      </div>
    </main>
  );
}
