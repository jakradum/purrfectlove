'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar({ locale = 'en' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isClosing, setIsClosing] = useState(false)
  console.log('isOpen:', isOpen);

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

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/adoption', label: 'Adoption' },
    { href: '/process', label: 'Process' },
    { href: '/first-days', label: 'First Days' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 350);
  }

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
              <Link href="/" className={`${styles.langLink} ${styles.active}`}>
                EN
              </Link>
              <span className={styles.langDivider}>|</span>
              <Link href="/de" className={styles.langLink}>
                DE
              </Link>
            </div>

            <Link href="/apply" className={styles.cta}>
              Apply to Adopt
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => (isOpen ? handleClose() : setIsOpen(true))}
            className={styles.menuButton}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X size={28} color="#C85C3F" />
            ) : (
              <>
                <div className={styles.scratchLine}></div>
                <div className={styles.scratchLine}></div>
                <div className={styles.scratchLine}></div>
              </>
            )}
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
              <Link href="/" onClick={handleClose} className={styles.mobileLangLink}>
                English
              </Link>
              <span>|</span>
              <Link href="/de" onClick={handleClose} className={styles.mobileLangLink}>
                Deutsch
              </Link>
            </div>

            <Link
              href="/apply"
              onClick={handleClose}
              className={styles.mobileCta}
              style={{ animationDelay: `${(navLinks.length + 1) * 0.05}s` }}
            >
              Apply to Adopt
            </Link>
          </div>
        </div>
      )}
    </nav>
  );}