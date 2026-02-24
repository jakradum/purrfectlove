import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';
import styles from './page.module.css';

export const metadata = {
  title: 'Impressum - Purrfect Love',
  description: 'Impressum und rechtliche Angaben der Purrfect Love e.V.',
  alternates: {
    canonical: 'https://www.purrfectlove.org/de/impressum',
  },
  robots: {
    index: true,
    follow: false,
  },
};

export default function ImpressumRoute() {
  return (
    <>
      <BreadcrumbSchema
        locale="de"
        items={[
          { name: 'Startseite', path: '/' },
          { name: 'Impressum', path: '/impressum' },
        ]}
      />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.heading}>Impressum</h1>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Angaben gemäß § 5 TMG</h2>
            <p className={styles.text}>
              <strong>Purrfect Love e.V.</strong><br />
              Heusteigstraße 99<br />
              70180 Stuttgart<br />
              Deutschland
            </p>
            <p className={styles.note}>(Postadresse – kein Tierheim)</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Vereinsregister</h2>
            <p className={styles.text}>
              Registergericht: Amtsgericht Stuttgart<br />
              Registernummer: VR 727528
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Kontakt</h2>
            <p className={styles.text}>
              Telefon: <a href="tel:+4915253432348" className={styles.link}>+49 (0) 15253432348</a><br />
              E-Mail: <a href="mailto:support@purrfectlove.org" className={styles.link}>support@purrfectlove.org</a><br />
              Website: <a href="https://www.purrfectlove.org/de" className={styles.link}>www.purrfectlove.org</a>
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Vorstand</h2>
            <div className={styles.boardList}>
              <div className={styles.boardMember}>
                <p className={styles.boardRole}>Vorsitzende</p>
                <p className={styles.boardName}>Lucia Flamini</p>
                <p className={styles.boardContact}>
                  <a href="mailto:support@purrfectlove.org" className={styles.link}>support@purrfectlove.org</a>
                </p>
              </div>
              <div className={styles.boardMember}>
                <p className={styles.boardRole}>Stellv. Vorsitzende</p>
                <p className={styles.boardName}>Sabrina Schatz</p>
              </div>
              <div className={styles.boardMember}>
                <p className={styles.boardRole}>Kassenführer</p>
                <p className={styles.boardName}>Erik Slabbinck</p>
                <p className={styles.boardContact}>
                  <a href="mailto:finance@purrfectlove.org" className={styles.link}>finance@purrfectlove.org</a>
                </p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Haftungsausschluss</h2>
            <p className={styles.text}>
              Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte
              externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber
              verantwortlich.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
