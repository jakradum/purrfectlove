import Link from 'next/link';
import styles from './AdoptAnyCatButton.module.css';

export default function AdoptAnyCatButton({ content, locale = 'en' }) {
  const href = locale === 'de' ? '/de/adopt/any-cat' : '/adopt/any-cat';

  return (
    <div className={styles.wrapper}>
      <p className={styles.prompt}>{content.adoptAnyCat.prompt}</p>
      <Link href={href} className={styles.button}>
        {content.adoptAnyCat.button}
      </Link>
    </div>
  );
}
