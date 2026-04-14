'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import menuItemsEN from '@/data/menuItems.en.json';
import menuItemsDE from '@/data/menuItems.de.json';

export default function Navbar({ locale = 'en', siteUrl = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileExpandedMenu, setMobileExpandedMenu] = useState(null);
  const [alternates, setAlternates] = useState({});
  const pathname = usePathname();

  // Read hreflang alternate links injected by page-level generateMetadata
  useEffect(() => {
    const links = document.querySelectorAll('link[rel="alternate"][hreflang]');
    const found = {};
    links.forEach((el) => {
      const lang = el.getAttribute('hreflang');
      const href = el.getAttribute('href');
      if (lang && href) found[lang] = href;
    });
    setAlternates(found);
  }, [pathname]);

  const menuItems = locale === 'de' ? menuItemsDE : menuItemsEN;
  const { navLinks, cta } = menuItems;

  // Close dropdown on route change (handles touch devices)
  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

  // Get language switcher hrefs that preserve current page
  const getLanguageHref = (targetLocale) => {
    // On care subdomain (siteUrl set), language switch goes to main site
    if (siteUrl) {
      return targetLocale === 'de' ? `${siteUrl}/de` : siteUrl || '/';
    }
    // Use hreflang alternate if the page provided one (e.g. blog posts with different slugs per locale)
    if (alternates[targetLocale]) {
      try {
        const url = new URL(alternates[targetLocale]);
        return url.pathname;
      } catch {
        return alternates[targetLocale];
      }
    }
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

  // Resolve a nav link href: external links pass through, others get siteUrl prefix
  const resolveHref = (href, external) => {
    if (external || href.startsWith('http')) return href;
    return siteUrl + href;
  };

  // Detect user's likely region based on timezone
  const detectUserRegion = () => {
    if (typeof window === 'undefined') return 'en';

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const germanTimezones = ['Europe/Berlin', 'Europe/Zurich', 'Europe/Vienna'];

    return germanTimezones.includes(timezone) ? 'de' : 'en';
  };

  const userRegion = detectUserRegion();

  // Reorder languages based on user's detected region
  const baseLanguages = [
    { code: 'en', label: 'India', fullLabel: 'India', href: getLanguageHref('en') },
    { code: 'de', label: 'Deutschland', fullLabel: 'Deutschland', href: getLanguageHref('de') }
  ];

  const languages = userRegion === 'de'
    ? [baseLanguages[1], baseLanguages[0]] // Deutschland first
    : baseLanguages; // India first

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = window.innerHeight / 5;

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

  return (
    <nav className={`${styles.navbar} ${isVisible ? styles.visible : styles.hidden}`}>
      <div className={styles.container}>
        <div className={styles.navContent}>
          <Link href={resolveHref(locale === 'de' ? '/de' : '/')} className={styles.logo}>
            <Image src="/logo.svg" alt="Purrfect Love" width={180} height={60} className={styles.logoImage} />
          </Link>

          {/* Desktop Nav */}
          <div className={styles.navRight}>
            <div className={styles.navLinks}>
              {navLinks.map((link, index) => (
                link.children ? (
                  <div
                    key={link.label}
                    className={styles.dropdown}
                    onMouseEnter={() => setOpenDropdown(index)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button className={styles.navLink}>
                      {link.label}
                      <span className={styles.dropdownArrow}>▾</span>
                    </button>
                    {openDropdown === index && (
                      <div className={styles.dropdownMenu}>
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={resolveHref(child.href, child.external)}
                            className={styles.dropdownItem}
                            onClick={() => setOpenDropdown(null)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link key={link.href} href={resolveHref(link.href, link.external)} className={styles.navLink}>
                    {link.label}
                  </Link>
                )
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

            <Link href={resolveHref(cta.href)} className={styles.cta}>
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
              link.children ? (
                <div key={link.label} style={{ animationDelay: `${index * 0.05}s` }} className={styles.mobileDropdown}>
                  <button
                    className={styles.mobileNavLink}
                    onClick={() => setMobileExpandedMenu(mobileExpandedMenu === index ? null : index)}
                  >
                    {link.label}
                    <span className={`${styles.mobileDropdownArrow} ${mobileExpandedMenu === index ? styles.expanded : ''}`}>▾</span>
                  </button>
                  {mobileExpandedMenu === index && (
                    <div className={styles.mobileSubmenu}>
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={resolveHref(child.href, child.external)}
                          onClick={handleClose}
                          className={styles.mobileSubmenuLink}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={resolveHref(link.href, link.external)}
                  onClick={handleClose}
                  className={styles.mobileNavLink}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {link.label}
                </Link>
              )
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
              href={resolveHref(cta.href)}
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