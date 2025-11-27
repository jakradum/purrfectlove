// src/components/AboutSection.jsx
import styles from './AboutSection.module.css';
import CTAButton from '@/components/CTAButton';

export default function AboutSection({ content }) {
  return (
    <section className={styles.about}>
      <h2 className={styles.aboutHeading}>
        {content.heading}
      </h2>
      <div className={styles.aboutContent}>
        {content.points.map((point, index) => (
          <div key={index} className={styles.aboutPoint}>
            <h3>{point.title}</h3>
            <p>{point.description}</p>
          </div>
        ))}
      </div>
      <div className={styles.ctaWrapper}>
        <CTAButton href="/adoption">
          {content.cta}
        </CTAButton>
      </div>
    </section>
  );
}