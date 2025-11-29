import Link from 'next/link';
import { Instagram } from 'lucide-react';
import styles from './Footer.module.css';
import footerContentEN from '@/data/footerContent.en.json';
import footerContentDE from '@/data/footerContent.de.json';

export default function Footer({ locale = 'en' }) {
  const content = locale === 'de' ? footerContentDE : footerContentEN;
  const currentYear = new Date().getFullYear();
  const copyright = content.copyright.replace('{year}', currentYear);

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* About Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{content.about.title}</h3>
          <p className={styles.aboutText}>{content.about.description}</p>
          <p className={styles.location}>{content.location}</p>
        </div>

        {/* Quick Links */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{content.quickLinks.title}</h3>
          <ul className={styles.linkList}>
            {content.quickLinks.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.link}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Social */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{content.social.title}</h3>
          <div className={styles.socialLinks}>
            <a
              href={content.social.instagram.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Instagram"
            >
              <Instagram size={20} />
              <span>{content.social.instagram.label}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomContainer}>
          <p className={styles.copyright}>{copyright}</p>
          <div className={styles.madeWithWrapper}>
            <p className={styles.madeWith}>{content.madeWith}</p>
            <p className={styles.credit}>
              {content.credit.text}{' '}
              <a
                href={content.credit.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.creditLink}
              >
                {content.credit.name}
              </a>
            </p>
          </div>
          <div className={styles.languageSwitcher}>
            <Link 
              href="/" 
              className={locale === 'en' ? styles.activeLanguage : styles.inactiveLanguage}
            >
              EN
            </Link>
            <span className={styles.separator}>|</span>
            <Link 
              href="/de" 
              className={locale === 'de' ? styles.activeLanguage : styles.inactiveLanguage}
            >
              DE
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}