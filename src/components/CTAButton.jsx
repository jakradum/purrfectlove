// src/components/CTAButton.jsx
import styles from './CTAButton.module.css';
import Link from 'next/link';

export default function CTAButton({ href, children }) {
  return (
    <Link href={href} className={styles.cta}>
      {children}
    </Link>
  );
}