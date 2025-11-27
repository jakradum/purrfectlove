import styles from './not-found.module.css';
import Link from 'next/link';

export default function CatNotFound() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.headline}>Pspspsps!</h1>
        <p className={styles.subhead}>
          Katze nicht gefunden! Das sind wahrscheinlich gute Nachrichten, denn die Katze, die du suchst, wurde entweder adoptiert oder es gibt (noch) keine Katze mit diesem Namen.
        </p>
        <Link href="/de/apply" className={styles.link}>
          Alle verfügbaren Katzen ansehen
        </Link>
      </div>
    </main>
  );
}
