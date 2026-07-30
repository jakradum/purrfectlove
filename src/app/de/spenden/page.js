import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';
import styles from './page.module.css';

export const metadata = {
  title: 'Spenden - Purrfect Love e.V.',
  description: 'Unterstütze Purrfect Love e.V. mit einer Spende. Deine Hilfe ermöglicht medizinische Versorgung, Kastrationen und Futter für Straßenkatzen in Stuttgart und Bangalore.',
  alternates: {
    canonical: 'https://www.purrfectlove.org/de/spenden',
  },
};

export default function SpendenPage() {
  return (
    <>
      <BreadcrumbSchema
        locale="de"
        items={[
          { name: 'Startseite', path: '/' },
          { name: 'Spenden', path: '/spenden' },
        ]}
      />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.heading}>Jetzt spenden</h1>

          <section className={styles.appeal}>
            <p className={styles.appealText}>
              Auch wenn wir sie nicht sehen, ist ihr Leid jeden Tag real.
            </p>
            <p className={styles.appealText}>
              Straßenkatzen leiden still. Während wir hier lesen, kämpfen unzählige Katzen gegen
              Hunger, Krankheit, Schmerzen und Angst. Mit Ihrer Spende schenken Sie ihnen
              medizinische Versorgung, Kastrationen, Futter und die Chance auf ein Leben ohne Leid.
            </p>
            <p className={styles.appealHighlight}>
              Jeder Euro zählt. Jedes gerettete Leben zählt.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Bankverbindung</h2>
            <div className={styles.ibanBlock}>
              <div className={styles.ibanRow}>
                <span className={styles.ibanLabel}>Empfänger</span>
                <span className={styles.ibanValue}>Purrfect Love e.V.</span>
              </div>
              <div className={styles.ibanRow}>
                <span className={styles.ibanLabel}>IBAN</span>
                <span className={`${styles.ibanValue} ${styles.ibanHighlight}`}>DE32 6007 0214 0091 8896 00</span>
              </div>
              <div className={styles.ibanRow}>
                <span className={styles.ibanLabel}>Verwendungszweck</span>
                <span className={styles.ibanValue}>Spende Tierschutz</span>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Steuerliche Absetzbarkeit</h2>
            <p className={styles.text}>
              Purrfect Love e.V. ist vom Finanzamt Stuttgart-Körperschaften gemäß § 60a Abs. 1 AO
              als steuerbegünstigte Körperschaft anerkannt. Spenden sind steuerlich absetzbar.
            </p>
            <p className={styles.text} style={{ marginTop: '0.75rem' }}>
              Steuer-Nr.: 99059/35271 · Registernummer: VR 727528
            </p>
            <p className={styles.note}>
              Für Spenden bis 300 € genügt der Kontoauszug als Nachweis. Für höhere Beträge
              stellen wir gerne eine Zuwendungsbestätigung aus —{' '}
              <a href="/de/contact" className={styles.link}>kontaktiere uns</a>.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Wofür deine Spende eingesetzt wird</h2>
            <ul className={styles.list}>
              <li>Tierärztliche Versorgung und Notfallbehandlungen</li>
              <li>Kastrations- und Sterilisationsprogramme</li>
              <li>Futter und Pflege für Straßenkatzen und Pflegetiere</li>
              <li>Unterbringung und Transport</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Fragen?</h2>
            <p className={styles.text}>
              Schreib uns an{' '}
              <a href="mailto:support@purrfectlove.org" className={styles.link}>
                support@purrfectlove.org
              </a>{' '}
              oder besuche unsere{' '}
              <a href="/de/contact" className={styles.link}>Kontaktseite</a>.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
