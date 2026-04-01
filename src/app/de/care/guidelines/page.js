export const metadata = {
  title: 'Community-Richtlinien | Purrfect Love',
};

export default function GuidelinesPageDE() {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem', fontFamily: 'Georgia, serif' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2C5F4F', marginBottom: '0.5rem', fontFamily: 'var(--font-outfit, sans-serif)' }}>
        Community-Richtlinien
      </h1>
      <p style={{ fontSize: '0.9rem', color: '#6B6B6B', marginBottom: '2rem' }}>
        Zuletzt aktualisiert: März 2025
      </p>

      <Section title="1. Respekt">
        <p>Behandle jedes Mitglied freundlich und respektvoll – ob im internen Posteingang, auf WhatsApp, per E-Mail oder persönlich. Belästigung, Diskriminierung oder respektloses Verhalten führt zum sofortigen Ausschluss aus der Community.</p>
      </Section>

      <Section title="2. Zweck">
        <p>Diese Community dient ausschließlich dazu, Katzeneltern, die eine Betreuung benötigen, mit hilfsbereiten Mitgliedern zu verbinden. Nutze sie nicht für gewerbliche Tierbetreuung, Werbung oder Spam.</p>
      </Section>

      <Section title="3. Ehrlichkeit">
        <p>Halte dein Profil aktuell. Dein Standort (Plus Code), deine Verfügbarkeit und Angaben zu deinen Katzen sollten der Realität entsprechen. Ungenaue Informationen verschwenden Zeit und beschädigen das Vertrauen.</p>
      </Section>

      <Section title="4. Datenschutz">
        <p>Teile keine Kontaktdaten anderer Mitglieder (Telefon, E-Mail, Adresse) mit Personen außerhalb der Community. Respektiere die Datenschutzeinstellungen eines Mitglieds – wenn es seine Kontaktdaten verborgen hat, nutze bitte den internen Posteingang.</p>
      </Section>

      <Section title="5. Melden">
        <p>Wenn du unangemessene Nachrichten erhältst oder verdächtige Aktivitäten bemerkst, melde dies bitte über den Melden-Button im Posteingang oder per E-Mail an <a href="mailto:support@purrfectlove.org" style={{ color: '#2C5F4F' }}>support@purrfectlove.org</a>.</p>
      </Section>

      <Section title="6. Freiwilligen-Etikette">
        <p>Sitter sind Freiwillige, die ihre Zeit unentgeltlich schenken. Bitte sei rücksichtsvoll: Gib ausreichend Vorankündigung, kommuniziere klar und zeige deine Dankbarkeit. Wenn ein Sitter nicht helfen kann, akzeptiere das ohne Druck.</p>
      </Section>

      <Section title="7. Keine Bezahlung">
        <p>Purrfect Love ist eine kostenlose Community. Sitter sollten über diese Plattform keine Vergütung verlangen. Dankbarkeitsgeschenke sind immer willkommen, aber nie erwartet.</p>
      </Section>

      <Section title="8. Notfälle">
        <p>Wenn während einer Katzenbetreuung etwas schiefläuft, kontaktiere den Sitter oder Katzenelternteil sofort. Für plattformbezogene Anliegen schreibe an <a href="mailto:support@purrfectlove.org" style={{ color: '#2C5F4F' }}>support@purrfectlove.org</a>.</p>
      </Section>

      <Section title="9. Durchsetzung">
        <p>Verstöße können je nach Schwere zu einer Verwarnung, Sperrung oder dauerhaften Entfernung aus der Community führen.</p>
      </Section>

      <p style={{ fontSize: '0.875rem', color: '#888', marginTop: '2.5rem', lineHeight: 1.7, borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
        Fragen? <a href="mailto:support@purrfectlove.org" style={{ color: '#2C5F4F' }}>support@purrfectlove.org</a>
      </p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#2C5F4F', marginBottom: '0.5rem', fontFamily: 'var(--font-outfit, sans-serif)' }}>
        {title}
      </h2>
      <div style={{ fontSize: '0.9rem', color: '#4A4A4A', lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}
