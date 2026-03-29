'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './Care.module.css';

const COUNTRY_CODES = [
  { label: '🇮🇳 +91', value: '+91' },
  { label: '🇩🇪 +49', value: '+49' },
];

export default function LoginForm({ locale = 'en', loginRedirect }) {
  const redirect = loginRedirect || (locale === 'de' ? '/de/care' : '/');
  const router = useRouter();

  const [step, setStep] = useState('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!phoneNumber) { setError('Please enter your phone number.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/care/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
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
    if (!code || code.length < 6) { setError('Please enter the 6-digit code.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/care/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, code }),
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
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Failed to resend. Please try again.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageNarrow}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <Image src="/logo.svg" alt="Purrfect Love" width={140} height={46} className={styles.logo} />
          <h1 className={styles.loginTitle}>
            {locale === 'de' ? 'Mitgliederbereich' : 'Member Login'}
          </h1>
          <p className={styles.loginSubtitle}>
            {locale === 'de' ? 'Melde dich mit deiner Handynummer an.' : 'Sign in with your phone number.'}
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendCode}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="phone">
                {locale === 'de' ? 'Handynummer' : 'Phone number'}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className={styles.input}
                  style={{ width: '110px', flexShrink: 0 }}
                  disabled={loading}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <input
                  id="phone"
                  type="tel"
                  className={styles.input}
                  placeholder="9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  autoComplete="tel-national"
                  autoFocus
                  inputMode="numeric"
                />
              </div>
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? (locale === 'de' ? 'Wird gesendet…' : 'Sending…') : (locale === 'de' ? 'Code senden' : 'Send code')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className={styles.codeSentBox}>
              <p className={styles.codeSentTitle}>
                {locale === 'de' ? 'Code gesendet' : 'Code sent'}
              </p>
              <p className={styles.codeSentSubtitle}>
                {locale === 'de' ? 'Wir haben einen Code an' : 'We sent a code to'}{' '}
                <span className={styles.emailHighlight}>{fullPhone}</span>{' '}
                {locale === 'de' ? 'per SMS gesendet.' : 'via SMS.'}
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
              {loading ? (locale === 'de' ? 'Wird geprüft…' : 'Verifying…') : (locale === 'de' ? 'Bestätigen' : 'Verify')}
            </button>
            <div className={styles.resendRow}>
              <button type="button" className={styles.resendBtn} onClick={handleResend} disabled={loading}>
                {locale === 'de' ? 'Code erneut senden' : 'Resend code'}
              </button>
              <button type="button" className={styles.resendBtn} onClick={() => { setStep('phone'); setError(''); setCode(''); }} disabled={loading}>
                {locale === 'de' ? 'Nummer ändern' : 'Change number'}
              </button>
            </div>
          </form>
        )}

        <p className={styles.notMember}>
          {locale === 'de' ? 'Noch kein Mitglied?' : 'Not a member?'}{' '}
          <a href="mailto:support@purrfectlove.org" className={styles.supportLink}>
            support@purrfectlove.org
          </a>
        </p>
      </div>
    </div>
  );
}
