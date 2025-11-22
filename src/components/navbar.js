'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import styles from './Navbar.module.css'

export default function Navbar({ locale = 'en' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollThreshold = window.innerHeight / 10

      if (currentScrollY < scrollThreshold) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false) // Scrolling down
      } else {
        setIsVisible(true) // Scrolling up
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/adoption', label: 'Adoption' },
    { href: '/process', label: 'Process' },
    { href: '/first-days', label: 'First Days' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <nav className={`${styles.navbar} ${isVisible ? styles.visible : styles.hidden}`}>
      <div className={styles.container}>
        <div className={styles.navContent}>
          <Link href="/" className={styles.logo}>
            <Image 
              src="/logo.svg" 
              alt="Purrfect Love" 
              width={180} 
              height={60}
              className={styles.logoImage}
            />
          </Link>

          {/* Desktop Nav */}
          <div className={styles.navRight}>
            <div className={styles.navLinks}>
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.navLink}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            <div className={styles.langSwitcher}>
              <Link href="/" className={`${styles.langLink} ${styles.active}`}>EN</Link>
              <span className={styles.langDivider}>|</span>
              <Link href="/de" className={styles.langLink}>DE</Link>
            </div>

            <Link href="/apply" className={styles.cta}>
              Apply to Adopt
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={styles.menuButton}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileMenuContent}>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={styles.mobileNavLink}
              >
                {link.label}
              </Link>
            ))}
            
            <div className={styles.mobileLangSwitcher}>
              <Link href="/" onClick={() => setIsOpen(false)} className={styles.mobileLangLink}>
                English
              </Link>
              <span>|</span>
              <Link href="/de" onClick={() => setIsOpen(false)} className={styles.mobileLangLink}>
                Deutsch
              </Link>
            </div>

            <Link
              href="/apply"
              onClick={() => setIsOpen(false)}
              className={styles.mobileCta}
            >
              Apply to Adopt
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}