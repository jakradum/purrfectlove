export const metadata = {
  title: 'Datenschutzerklärung | Purrfect Love',
  description: 'Wie Purrfect Love deine persönlichen Daten erhebt, verwendet und schützt.',
};

export default function DatenschutzPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <a
        href="/de/care"
        style={{ display: 'inline-block', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--hunter-green)', textDecoration: 'none', fontWeight: 600 }}
      >
        ← Zurück
      </a>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--hunter-green)', marginBottom: '0.5rem' }}>
          Datenschutzerklärung
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
          Zuletzt aktualisiert: März 2026
        </p>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, marginBottom: 0 }}>
          Purrfect Love ist eine geschlossene Gemeinschaft für Katzensitting. Der Schutz deiner
          Privatsphäre ist uns wichtig – wir erheben nur die Daten, die wir für den Betrieb der
          Gemeinschaft benötigen.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--hunter-green)', marginBottom: '1rem' }}>
          Was wir erheben
        </h2>
        <ul style={{ color: 'var(--text-light)', lineHeight: 1.8, paddingLeft: '1.25rem', margin: 0 }}>
          <li>Dein Name</li>
          <li>E-Mail-Adresse</li>
          <li>Handynummer</li>
          <li>Ungefährer Standort (Plus Code – ein geografischer Kurzcode, keine genaue Adresse)</li>
          <li>Verfügbarkeitsdaten, die du angibst</li>
          <li>Informationen über deine Katzen, die du freiwillig in deinem Profil einträgst</li>
        </ul>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--hunter-green)', marginBottom: '1rem' }}>
          Warum wir diese Daten erheben
        </h2>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, margin: 0 }}>
          Wir verwenden deine Daten ausschließlich für den Betrieb der Purrfect Love Gemeinschaft:
          zur Erstellung und Verwaltung deines Mitgliederprofils, zur Vermittlung zwischen
          Katzenbesitzern und Sitterinnen in deiner Nähe sowie für den Versand von
          Einmal-Login-Codes (OTPs) für die passwortlose Anmeldung.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--hunter-green)', marginBottom: '1rem' }}>
          Wie wir Login-Codes versenden
        </h2>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, margin: 0 }}>
          OTP-Codes werden per SMS über <strong>Twilio</strong> und per E-Mail über <strong>Resend</strong> versendet.
          Diese Drittanbieter erhalten ausschließlich deine Handynummer bzw. E-Mail-Adresse –
          und nur zum Zweck der Zustellung des Login-Codes. Keine weiteren Daten werden weitergegeben.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--hunter-green)', marginBottom: '1rem' }}>
          Standortdaten
        </h2>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, margin: 0 }}>
          Dein Standort wird als Plus Code gespeichert – ein ungefährer geografischer Code, der einen
          kleinen Bereich beschreibt, keine genaue Adresse. Dieser wird ausschließlich genutzt, um
          dich mit Mitgliedern in deiner Nähe zusammenzubringen. Deine genaue Adresse wird weder
          gespeichert noch weitergegeben.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--hunter-green)', marginBottom: '1rem' }}>
          Wie lange wir deine Daten aufbewahren
        </h2>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, margin: 0 }}>
          Wir speichern deine Daten so lange, wie dein Konto aktiv ist. Wenn du dein Konto löschst,
          werden alle deine personenbezogenen Daten innerhalb von 30 Tagen dauerhaft und unwiderruflich
          aus unseren Systemen entfernt.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--hunter-green)', marginBottom: '1rem' }}>
          Deine Rechte
        </h2>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, marginBottom: '0.75rem' }}>
          Du hast das Recht, Auskunft über deine gespeicherten Daten zu erhalten, diese zu
          berichtigen oder löschen zu lassen. Dies gilt für alle Mitglieder, insbesondere für
          Personen in der EU (gemäß DSGVO) sowie in Indien.
        </p>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, margin: 0 }}>
          Um Auskunft anzufordern, eine Korrektur zu verlangen oder dein Konto löschen zu lassen,
          schreibe uns an{' '}
          <a
            href="mailto:privacy@purrfectlove.org"
            style={{ color: 'var(--hunter-green)', textDecoration: 'underline' }}
          >
            privacy@purrfectlove.org
          </a>
          . Du kannst dein Konto auch direkt über deine Profilseite löschen.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--hunter-green)', marginBottom: '1rem' }}>
          Was wir nicht tun
        </h2>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, margin: 0 }}>
          Wir verkaufen deine Daten nicht. Wir geben deine Daten nicht an Werbetreibende weiter.
          Wir nutzen deine Daten ausschließlich für den Betrieb der Purrfect Love Gemeinschaft.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--hunter-green)', marginBottom: '1rem' }}>
          Fragen?
        </h2>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, margin: 0 }}>
          Bei Fragen zu dieser Datenschutzerklärung erreichst du uns unter{' '}
          <a
            href="mailto:privacy@purrfectlove.org"
            style={{ color: 'var(--hunter-green)', textDecoration: 'underline' }}
          >
            privacy@purrfectlove.org
          </a>
          .
        </p>
      </div>
    </div>
  );
}
