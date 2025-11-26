// src/components/AdoptionProcess.jsx
import styles from './AdoptionProcess.module.css';
import CTAButton from './CTAButton';

export default function AdoptionProcess({ content, locale = 'en' }) {
  const processHref = locale === 'de' ? '/de/guides/process' : '/guides/process';

  return (
    <section className={styles.process}>
      <h2 className={styles.processHeading}>
        {content.heading}
      </h2>
      <div className={styles.processSteps}>
        {content.steps.map((step, index) => (
          <div key={index} className={styles.step}>
            <div className={styles.stepNumber}>{index + 1}</div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>
      <div className={styles.ctaWrapper}>
        <CTAButton href={processHref}>
          {content.cta}
        </CTAButton>
      </div>
    </section>
  );
}