import styles from './HomePage.module.css';
import AboutSection from '@/components/AboutSection';
import contentEN from '@/data/pageContent.en.json';
import contentDE from '@/data/pageContent.de.json';

// HomePage.jsx
export default function HomePage({ locale = 'en' }) {
  const content = locale === 'de' ? contentDE : contentEN;

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.heroHeading}>
            {content.home.hero.heading}
          </h1>
          <p className={styles.heroSubheading}>
            {content.home.hero.subheading}
          </p>
          <p className={styles.tagline}>
            {content.home.hero.subtext}
          </p>
        </div>
        
        <div className={styles.heroImageWrapper}>
          <img 
            src="/logo-hero.png" 
            alt="Purrfect Love" 
            className={styles.heroLogo}
          />
        </div>

        <div className={styles.heroSideText}>
          <p>{content.home.hero.sideText}</p>
        </div>
      </section>
        <AboutSection content={content.home.about} />
    </div>
  );
}