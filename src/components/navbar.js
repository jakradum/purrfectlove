'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Navbar.module.css';
import menuItems from '@/data/menuItems.json';

export default function Navbar({ locale = 'en' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = window.innerHeight / 10;

      if (currentScrollY < scrollThreshold) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 250);
  };

  const { navLinks, cta, languages } = menuItems;

  return (
    <nav className={`${styles.navbar} ${isVisible ? styles.visible : styles.hidden}`}>
      <div className={styles.container}>
        <div className={styles.navContent}>
          <Link href="/" className={styles.logo}>
            <Image src="/logo.svg" alt="Purrfect Love" width={180} height={60} className={styles.logoImage} />
          </Link>

          {/* Desktop Nav */}
          <div className={styles.navRight}>
            <div className={styles.navLinks}>
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={styles.navLink}>
                  {link.label}
                </Link>
              ))}
            </div>

            <div className={styles.langSwitcher}>
              {languages.map((lang, index) => (
                <Fragment key={lang.code}>
                  <Link href={lang.href} className={`${styles.langLink} ${locale === lang.code ? styles.active : ''}`}>
                    {lang.label}
                  </Link>
                  {index < languages.length - 1 && <span className={styles.langDivider}>|</span>}
                </Fragment>
              ))}
            </div>

            <Link href={cta.href} className={styles.cta}>
              {cta.label}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => (isOpen ? handleClose() : setIsOpen(true))}
            className={`${styles.menuButton} ${isOpen && !isClosing ? styles.open : ''}`}
            aria-label="Toggle menu"
          >
            <div className={styles.scratchLine}></div>
            <div className={styles.scratchLine}></div>
            <div className={styles.scratchLine}></div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className={`${styles.mobileMenu} ${isClosing ? styles.closing : ''}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <div className={styles.mobileMenuContent}>
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleClose}
                className={styles.mobileNavLink}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {link.label}
              </Link>
            ))}

            <div className={styles.mobileLangSwitcher} style={{ animationDelay: `${navLinks.length * 0.05}s` }}>
              {languages.map((lang, index) => (
                <Fragment key={lang.code}>
                  <Link href={lang.href} onClick={handleClose} className={styles.mobileLangLink}>
                    {lang.fullLabel}
                  </Link>
                  {index < languages.length - 1 && <span>|</span>}
                </Fragment>
              ))}
            </div>

            <Link
              href={cta.href}
              onClick={handleClose}
              className={styles.mobileCta}
              style={{ animationDelay: `${(navLinks.length + 1) * 0.05}s` }}
            >
              {cta.mobileLabel}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}