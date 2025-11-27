import styles from './not-found.module.css';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.headline}>Page not found!</h1>
        <p className={styles.subhead}>
          The page you're looking for has been torn by one of our kitties.
        </p>
        <Link href="/" className={styles.link}>
          Go back home
        </Link>
      </div>
    </main>
  );
}
