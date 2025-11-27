import styles from './not-found.module.css';
import Link from 'next/link';

export default function CatNotFound() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.headline}>Pspspsps!</h1>
        <p className={styles.subhead}>
          Cat not found! That's probably good news, because the cat you're looking for is either adopted or there's no cat by that name (yet).
        </p>
        <Link href="/apply" className={styles.link}>
          See all available cats
        </Link>
      </div>
    </main>
  );
}
