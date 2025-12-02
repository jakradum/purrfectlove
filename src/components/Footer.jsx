'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Instagram } from 'lucide-react';
import styles from './Footer.module.css';
import footerContentEN from '@/data/footerContent.en.json';
import footerContentDE from '@/data/footerContent.de.json';

export default function Footer({ locale = 'en' }) {
  const pathname = usePathname();
  const content = locale === 'de' ? footerContentDE : footerContentEN;
  const currentYear = new Date().getFullYear();
  const copyright = content.copyright.replace('{year}', currentYear);

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !emailRegex.test(email)) {
      setError(locale === 'de' ? 'Bitte gib eine gültige E-Mail ein' : 'Please enter a valid email');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubscribed(true);
        setEmail('');
      } else {
        const data = await response.json();
        setError(data.error || (locale === 'de' ? 'Fehler beim Abonnieren' : 'Failed to subscribe'));
      }
    } catch {
      setError(locale === 'de' ? 'Fehler beim Abonnieren' : 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  // Get language switcher hrefs that preserve current page
  const getLanguageHref = (targetLocale) => {
    if (targetLocale === 'de') {
      if (pathname.startsWith('/de')) return pathname;
      return `/de${pathname === '/' ? '' : pathname}`;
    } else {
      if (pathname.startsWith('/de')) {
        const withoutDe = pathname.replace(/^\/de/, '');
        return withoutDe || '/';
      }
      return pathname;
    }
  };

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

        {/* Newsletter */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{content.newsletter.title}</h3>
          <p className={styles.newsletterDescription}>{content.newsletter.description}</p>
          {subscribed ? (
            <p className={styles.subscribeSuccess}>
              {locale === 'de' ? 'Danke! Du bist angemeldet.' : 'Thanks! You\'re subscribed.'}
            </p>
          ) : (
            <form onSubmit={handleSubscribe} className={styles.newsletterForm}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={content.newsletter.placeholder}
                className={styles.newsletterInput}
                disabled={loading}
                required
              />
              <button
                type="submit"
                className={styles.newsletterButton}
                disabled={loading}
              >
                {loading
                  ? (locale === 'de' ? '...' : '...')
                  : content.newsletter.button}
              </button>
            </form>
          )}
          {error && <p className={styles.subscribeError}>{error}</p>}
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
              href={getLanguageHref('en')}
              className={locale === 'en' ? styles.activeLanguage : styles.inactiveLanguage}
            >
              EN
            </Link>
            <span className={styles.separator}>|</span>
            <Link
              href={getLanguageHref('de')}
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