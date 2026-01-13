'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import menuItemsEN from '@/data/menuItems.en.json';
import menuItemsDE from '@/data/menuItems.de.json';

export default function Navbar({ locale = 'en' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileExpandedMenu, setMobileExpandedMenu] = useState(null);
  const pathname = usePathname();

  const menuItems = locale === 'de' ? menuItemsDE : menuItemsEN;
  const { navLinks, cta } = menuItems;

  // Close dropdown on route change (handles touch devices)
  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

  // Get language switcher hrefs that preserve current page
  const getLanguageHref = (targetLocale) => {
    if (targetLocale === 'de') {
      // Switch to German: add /de prefix if not already there
      if (pathname.startsWith('/de')) return pathname;
      return `/de${pathname === '/' ? '' : pathname}`;
    } else {
      // Switch to English: remove /de prefix
      if (pathname.startsWith('/de')) {
        const withoutDe = pathname.replace(/^\/de/, '');
        return withoutDe || '/';
      }
      return pathname;
    }
  };

  const languages = [
    { code: 'en', label: 'India', fullLabel: 'India', href: getLanguageHref('en') },
    { code: 'de', label: 'Deutschland', fullLabel: 'Deutschland', href: getLanguageHref('de') }
  ];

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
          <Link href={locale === 'de' ? '/de' : '/'} className={styles.logo}>
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
                            href={child.href}
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
                  <Link key={link.href} href={link.href} className={styles.navLink}>
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
                          href={child.href}
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
                  href={link.href}
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