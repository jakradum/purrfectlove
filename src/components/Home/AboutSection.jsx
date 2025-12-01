// src/components/AboutSection.jsx
import styles from './AboutSection.module.css';
import CTAButton from '@/components/CTAButton';

export default function AboutSection({ content, locale = 'en' }) {
  const adoptHref = locale === 'de' ? '/de/adopt' : '/adopt';

  return (
    <section className={styles.about}>
      <h2 className={styles.aboutHeading}>
        {content.heading}
      </h2>
      {content.intro && (
        <p className={styles.aboutIntro}>{content.intro}</p>
      )}
      <div className={styles.aboutContent}>
        {content.points.map((point, index) => (
          <div key={index} className={styles.aboutPoint}>
            <h3>{point.title}</h3>
            <p>{point.description}</p>
          </div>
        ))}
      </div>
      <div className={styles.ctaWrapper}>
        <CTAButton href={adoptHref}>
          {content.cta}
        </CTAButton>
      </div>
    </section>
  );
}