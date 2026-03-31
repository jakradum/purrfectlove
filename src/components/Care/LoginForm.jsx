'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './Care.module.css';

const COUNTRY_CODES = [
  { label: '🇮🇳 +91', value: '+91', country: 'IN', placeholder: '98765 43210' },
  { label: '🇩🇪 +49', value: '+49', country: 'DE', placeholder: '151 23456789' },
];

export default function LoginForm({ locale = 'en', loginRedirect }) {
  const redirect = loginRedirect || (locale === 'de' ? '/de/care' : '/');
  const router = useRouter();

  const [step, setStep] = useState('identifier');
  const [showTooltip, setShowTooltip] = useState(false);
  const [mode, setMode] = useState(null); // null = detecting, 'phone' | 'email'
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-detect location on mount
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        if (data.country_code === 'IN') {
          setMode('phone');
          setCountryCode('+91');
        } else {
          setMode('email');
          const match = COUNTRY_CODES.find(c => c.country === data.country_code);
          if (match) setCountryCode(match.value);
        }
      })
      .catch(() => setMode('phone')); // fallback to phone if geo fails
  }, []);

  const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
  const identifier = mode === 'phone' ? fullPhone : email.trim().toLowerCase();
  const sentTo = mode === 'phone' ? fullPhone : email.trim();

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'phone' && !phoneNumber) {
      setError(locale === 'de' ? 'Bitte Handynummer eingeben.' : 'Please enter your phone number.');
      return;
    }
    if (mode === 'email' && !email.trim()) {
      setError(locale === 'de' ? 'Bitte E-Mail-Adresse eingeben.' : 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/care/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, type: mode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send code.'); return; }
      setStep('code');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (!code || code.length < 6) {
      setError(locale === 'de' ? 'Bitte den 6-stelligen Code eingeben.' : 'Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/care/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, type: mode, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid code.'); return; }
      router.push(redirect);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setCode('');
    setLoading(true);
    try {
      const res = await fetch('/api/care/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, type: mode }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Failed to resend. Please try again.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(m => m === 'phone' ? 'email' : 'phone');
    setError('');
    setPhoneNumber('');
    setEmail('');
  };

  const subtitle = mode === 'phone'
    ? (locale === 'de' ? 'Melde dich mit deiner Handynummer an.' : 'Sign in with your phone number.')
    : (locale === 'de' ? 'Melde dich mit deiner E-Mail-Adresse an.' : 'Sign in with your email address.');

  const sentVia = mode === 'phone'
    ? (locale === 'de' ? 'per SMS' : 'via SMS')
    : (locale === 'de' ? 'per E-Mail' : 'via email');

  return (
    <div className={styles.pageNarrow}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <Image src="/logo.svg" alt="Purrfect Love" width={140} height={46} className={styles.logo} />
          <h1 className={styles.loginTitle}>
            {locale === 'de' ? 'Mitgliederbereich' : 'Member Login'}
          </h1>
          {mode !== null && (
            <p className={styles.loginSubtitle}>{subtitle}</p>
          )}
        </div>

        {mode === null ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#888' }}>
            {locale === 'de' ? 'Wird geladen…' : 'Loading…'}
          </div>
        ) : step === 'identifier' ? (
          <form onSubmit={handleSendCode}>
            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => { setMode('phone'); setError(''); setEmail(''); }}
                disabled={loading}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1.5px solid',
                  cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'inherit',
                  borderColor: mode === 'phone' ? 'var(--hunter-green)' : '#ddd',
                  background: mode === 'phone' ? 'var(--hunter-green)' : 'transparent',
                  color: mode === 'phone' ? '#fff' : '#666',
                }}
              >
                {locale === 'de' ? 'Telefon' : 'Phone'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('email'); setError(''); setPhoneNumber(''); }}
                disabled={loading}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1.5px solid',
                  cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'inherit',
                  borderColor: mode === 'email' ? 'var(--hunter-green)' : '#ddd',
                  background: mode === 'email' ? 'var(--hunter-green)' : 'transparent',
                  color: mode === 'email' ? '#fff' : '#666',
                }}
              >
                {locale === 'de' ? 'E-Mail' : 'Email'}
              </button>
            </div>

            {mode === 'phone' ? (
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="phone">
                  {locale === 'de' ? 'Handynummer' : 'Phone number'}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className={styles.input}
                      style={{ width: '110px' }}
                      disabled={loading}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                      <span
                        onClick={() => setShowTooltip(v => !v)}
                        style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-light)', marginLeft: '0.25rem', userSelect: 'none' }}
                      >
                        ⓘ
                      </span>
                      {showTooltip && (
                        <span
                          onClick={() => setShowTooltip(false)}
                          style={{
                            position: 'absolute', bottom: '130%', left: '50%', transform: 'translateX(-50%)',
                            background: '#333', color: '#fff', fontSize: '0.75rem', borderRadius: '6px',
                            padding: '0.4rem 0.6rem', whiteSpace: 'nowrap', zIndex: 10,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          }}
                        >
                          Purrfect Love Care is available in India and Germany only
                        </span>
                      )}
                    </span>
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    className={styles.input}
                    placeholder={COUNTRY_CODES.find(c => c.value === countryCode)?.placeholder || ''}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    disabled={loading}
                    autoComplete="tel-national"
                    autoFocus
                    inputMode="numeric"
                  />
                </div>
              </div>
            ) : (
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="email">
                  {locale === 'de' ? 'E-Mail-Adresse' : 'Email address'}
                </label>
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading
                ? (locale === 'de' ? 'Wird gesendet…' : 'Sending…')
                : (locale === 'de' ? 'Code senden' : 'Send code')}
            </button>

            {locale === 'de' ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'center', marginTop: '0.75rem', lineHeight: 1.5 }}>
                Mit dem Fortfahren stimmst du unserer{' '}
                <a href="/de/care/privacy" style={{ color: 'var(--hunter-green)', textDecoration: 'underline' }}>
                  Datenschutzerklärung
                </a>{' '}
                zu.
              </p>
            ) : (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'center', marginTop: '0.75rem', lineHeight: 1.5 }}>
                By continuing, you agree to our{' '}
                <a href="/care/privacy" style={{ color: 'var(--hunter-green)', textDecoration: 'underline' }}>
                  Privacy Policy
                </a>
              </p>
            )}

          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className={styles.codeSentBox}>
              <p className={styles.codeSentTitle}>
                {locale === 'de' ? 'Code gesendet' : 'Code sent'}
              </p>
              <p className={styles.codeSentSubtitle}>
                {locale === 'de' ? 'Wir haben einen Code an' : 'We sent a code to'}{' '}
                <span className={styles.emailHighlight}>{sentTo}</span>{' '}
                {sentVia}{locale === 'de' ? ' gesendet.' : '.'}
              </p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="code">
                {locale === 'de' ? '6-stelliger Code' : '6-digit code'}
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className={`${styles.input} ${styles.inputLarge}`}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={loading}
                autoComplete="one-time-code"
                autoFocus
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading
                ? (locale === 'de' ? 'Wird geprüft…' : 'Verifying…')
                : (locale === 'de' ? 'Bestätigen' : 'Verify')}
            </button>

            <div className={styles.resendRow}>
              <button type="button" className={styles.resendBtn} onClick={handleResend} disabled={loading}>
                {locale === 'de' ? 'Code erneut senden' : 'Resend code'}
              </button>
              <button
                type="button"
                className={styles.resendBtn}
                onClick={() => { setStep('identifier'); setError(''); setCode(''); }}
                disabled={loading}
              >
                {mode === 'phone'
                  ? (locale === 'de' ? 'Nummer ändern' : 'Change number')
                  : (locale === 'de' ? 'E-Mail ändern' : 'Change email')}
              </button>
            </div>
          </form>
        )}

        <p className={styles.notMember}>
          {locale === 'de' ? 'Noch kein Mitglied?' : 'Not a member?'}{' '}
          <a href={locale === 'de' ? '/de/care/join' : '/care/join'} className={styles.supportLink}>
            {locale === 'de' ? 'Mitgliedschaft beantragen' : 'Request membership'}
          </a>
        </p>
      </div>
    </div>
  );
}
