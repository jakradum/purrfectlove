import styles from './HomePage.module.css';
import contentEN from '@/data/pageContent.en.json';
import contentDE from '@/data/pageContent.de.json';

export default function HomePage({ locale = 'en' }) {
  const content = locale === 'de' ? contentDE : contentEN;
  
  const rightWords = content.home.hero.rightText.split(' ');

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          {/* Left Text - Behind Logo */}
          <h1 className={`${styles.heroText} ${styles.leftText} ${styles.behindLogo}`}>
            {content.home.hero.leftText}
          </h1>

          {/* Center Logo - BIG */}
          <div className={styles.logoContainer}>
            <img
              src="/logo.svg"
              alt="Purrfect Love"
              className={styles.logo}
            />
          </div>

          {/* Right Text - Overlapping logo, shadow only on first letters */}
          <h1 className={`${styles.heroText} ${styles.rightText} ${styles.frontLogo}`}>
            {rightWords.map((word, index) => (
              <span key={index}>
                <span className={styles.shadowLetter}>{word.charAt(0)}</span>
                {word.slice(1)}
                {index < rightWords.length - 1 ? ' ' : ''}
              </span>
            ))}
          </h1>
        </div>

        {/* Subtext */}
        <p className={styles.subtext}>{content.home.hero.subtext}</p>
      </section>

      {/* Rest of content */}
      <section className={styles.content}>
        <h2>{content.home.heading}</h2>
        <p>{content.home.body}</p>
      </section>
    </div>
  );
}