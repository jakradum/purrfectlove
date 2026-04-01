'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Care.module.css';

const RULES_EN = [
  'Be respectful. Treat every member as you\'d like to be treated — whether in the inbox, on WhatsApp, or face to face.',
  'Only use the community for cat-sitting arrangements. No spam, promotions, or off-topic messages.',
  'Keep your profile honest. Accurate location, availability, and cat info helps everyone.',
  'Report issues. Use the flag/report button or email support@purrfectlove.org if something feels wrong.',
  'Protect privacy. Don\'t share another member\'s contact details with anyone outside the community.',
  'Purrfect Love is not a professional pet-sitting service. Sitters are volunteers — please be understanding and appreciative.',
];

const RULES_DE = [
  'Sei respektvoll. Behandle jedes Mitglied so, wie du selbst behandelt werden möchtest – ob im Posteingang, auf WhatsApp oder persönlich.',
  'Nutze die Community nur für Katzenbetreuungs-Arrangements. Kein Spam, keine Werbung, keine themenfremden Nachrichten.',
  'Halte dein Profil ehrlich. Genaue Standort-, Verfügbarkeits- und Katzeninformationen helfen allen.',
  'Melde Probleme. Nutze den Melde-Button oder schreibe an support@purrfectlove.org, wenn etwas nicht stimmt.',
  'Schütze die Privatsphäre. Teile keine Kontaktdaten anderer Mitglieder mit Personen außerhalb der Community.',
  'Purrfect Love ist kein professioneller Tierbetreuungsservice. Sitter sind Freiwillige – bitte sei verständnisvoll und dankbar.',
];

export default function GuidelinesGate({ locale = 'en' }) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isDE = locale === 'de';
  const rules = isDE ? RULES_DE : RULES_EN;

  const handleAccept = async () => {
    if (!accepted) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/care/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guidelinesAccepted: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save. Please try again.');
        return;
      }
      router.refresh();
    } catch {
      setError(isDE ? 'Netzwerkfehler. Bitte erneut versuchen.' : 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.guidelinesGate}>
      <div className={styles.guidelinesCard}>
        {/* Header */}
        <div className={styles.guidelinesHeader}>
          <span style={{ fontSize: '2rem' }}>🐾</span>
          <h1 className={styles.guidelinesTitle}>
            {isDE ? 'Community-Richtlinien' : 'Community Guidelines'}
          </h1>
          <p className={styles.guidelinesSubtitle}>
            {isDE
              ? 'Bitte lies diese kurzen Regeln, bevor du die Community betrittst.'
              : 'Please read these brief rules before joining the community.'}
          </p>
        </div>

        {/* Rules list */}
        <ol className={styles.guidelinesList}>
          {rules.map((rule, i) => (
            <li key={i} className={styles.guidelinesItem}>{rule}</li>
          ))}
        </ol>

        {/* Full guidelines link */}
        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '1.25rem', textAlign: 'center' }}>
          {isDE ? 'Vollständige Richtlinien: ' : 'Full guidelines: '}
          <a
            href={isDE ? '/de/care/guidelines' : '/care/guidelines'}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--hunter-green)', fontWeight: 600 }}
          >
            {isDE ? 'Richtlinien lesen →' : 'Read guidelines →'}
          </a>
        </p>

        {/* Accept checkbox */}
        <label className={styles.guidelinesCheckRow}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            style={{ width: '18px', height: '18px', flexShrink: 0, accentColor: 'var(--hunter-green)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-dark)', lineHeight: 1.5 }}>
            {isDE
              ? 'Ich habe die Community-Richtlinien gelesen und stimme ihnen zu.'
              : 'I have read and agree to the community guidelines.'}
          </span>
        </label>

        {error && (
          <p style={{ color: '#b91c1c', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>{error}</p>
        )}

        <button
          type="button"
          className={styles.btn}
          disabled={!accepted || saving}
          onClick={handleAccept}
          style={{ marginTop: '1.25rem', opacity: !accepted ? 0.5 : 1 }}
        >
          {saving
            ? (isDE ? 'Wird gespeichert…' : 'Saving…')
            : (isDE ? 'Community betreten' : 'Enter community')}
        </button>
      </div>
    </div>
  );
}
