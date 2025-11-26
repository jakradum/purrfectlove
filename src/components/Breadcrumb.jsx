// src/components/Breadcrumb.jsx
import Link from 'next/link';
import styles from './Breadcrumb.module.css';

export default function Breadcrumb({ items }) {
  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={item.href || index} className={styles.item}>
          {index < items.length - 1 ? (
            <>
              <Link href={item.href} className={styles.link}>
                {item.label}
              </Link>
              <span className={styles.separator}>·</span>
            </>
          ) : (
            <span className={styles.current}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
