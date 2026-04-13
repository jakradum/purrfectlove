'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import styles from './Care.module.css';

export default function LoginForm({ locale = 'en', loginRedirect }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionReason = searchParams?.get('reason'); // 'expired' | 'session' | null
  // After login, go to the deep-link destination if safe, otherwise fall back to prop/default.
  const rawRedirect = searchParams?.get('redirect') || '';
  const redirect = (rawRedirect.startsWith('/') ? rawRedirect : null)
    ?? loginRedirect
    ?? (locale === 'de' ? '/de/care' : '/');

  const [step, setStep] = useState('identifier');
  const [resendCountdown, setResendCountdown] = useState(0);
  const countdownTimerRef = useRef(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailNotFound, setEmailNotFound] = useState(false);

  // ipapi.co — kept for potential future locale/country use
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .catch(() => {})
  }, []);

  // Resend countdown
  function startResendCountdown() {
    setResendCountdown(60);
    clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setResendCountdown(n => {
        if (n <= 1) { clearInterval(countdownTimerRef.current); return 0; }
        return n - 1;
      });
    }, 1000);
  }

  useEffect(() => () => clearInterval(countdownTimerRef.current), []);

  const identifier = email.trim().toLowerCase();

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError(locale === 'de' ? 'Bitte E-Mail-Adresse eingeben.' : 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/care/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, type: 'email' }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || 'Failed to send code.';
        setError(errMsg);
        if (errMsg === 'ACCOUNT_NOT_FOUND') setEmailNotFound(true);
        return;
      }
      setStep('code');
      startResendCountdown();
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
        body: JSON.stringify({ identifier, type: 'email', code }),
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
    if (resendCountdown > 0) return;
    setError('');
    setCode('');
    setLoading(true);
    try {
      const res = await fetch('/api/care/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, type: 'email' }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Failed to resend. Please try again.');
      else startResendCountdown();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const joinHref = locale === 'de' ? '/de/care/join' : '/care/join';

  const renderError = (msg) => {
    if (!msg) return null;
    if (msg === 'ACCOUNT_NOT_FOUND') {
      return (
        <div className={styles.error}>
          {locale === 'de' ? (
            <>
              Kein Konto mit dieser E-Mail-Adresse gefunden.{' '}
              <a href={joinHref} style={{ color: 'inherit', textDecoration: 'underline' }}>
                Mitgliedschaft beantragen
              </a>
              {' '}und wir melden uns bei dir.
            </>
          ) : (
            <>
              No account found with this email.{' '}
              <a href={joinHref} style={{ color: 'inherit', textDecoration: 'underline' }}>
                Submit a membership request
              </a>
              {' '}and we&apos;ll get back to you.
            </>
          )}
        </div>
      );
    }
    return <div className={styles.error}>{msg}</div>;
  };

  return (
    <div className={styles.loginPageWrap}>
      <div className={styles.loginFormInner}>
        <Image src="/logo.svg" alt="Purrfect Love" width={120} height={40} className={styles.loginLogo} />
        <h1 className={styles.loginTitle}>
          {locale === 'de' ? 'Mitgliederbereich' : 'Member Login'}
        </h1>

        {sessionReason && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#92400e' }}>
            {sessionReason === 'expired'
              ? 'Your session has expired. Please log in again.'
              : 'Please log in to continue.'}
          </div>
        )}

        {step === 'identifier' ? (
          <form onSubmit={handleSendCode}>
            <p className={styles.loginSubtitle}>
              {locale === 'de' ? 'Melde dich mit deiner E-Mail-Adresse an.' : 'Sign in with your email address.'}
            </p>

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

            {renderError(error)}

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading
                ? (locale === 'de' ? 'Wird gesendet…' : 'Sending…')
                : (locale === 'de' ? 'Code senden' : 'Send code')}
            </button>

            <p className={styles.loginPrivacy}>
              {locale === 'de' ? (
                <>Mit dem Fortfahren stimmst du unserer{' '}
                  <a href="/de/care/privacy" className={styles.loginPrivacyLink}>Datenschutzerklärung</a>{' '}zu.</>
              ) : (
                <>By continuing, you agree to our{' '}
                  <a href="/care/privacy" className={styles.loginPrivacyLink}>Privacy Policy</a>.</>
              )}
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className={styles.codeSentBox}>
              <p className={styles.codeSentTitle}>
                {locale === 'de' ? 'Code gesendet' : 'Code sent'}
              </p>
              <p className={styles.codeSentSubtitle}>
                {locale === 'de' ? 'Wir haben einen Code per E-Mail an' : 'We sent a code via email to'}{' '}
                <span className={styles.emailHighlight}>{email.trim()}</span>
                {locale === 'de' ? ' gesendet.' : '.'}
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

            {renderError(error)}

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading
                ? (locale === 'de' ? 'Wird geprüft…' : 'Verifying…')
                : (locale === 'de' ? 'Bestätigen' : 'Verify')}
            </button>

            <div className={styles.resendRow}>
              <button
                type="button"
                className={styles.resendBtn}
                onClick={handleResend}
                disabled={loading || resendCountdown > 0}
                style={resendCountdown > 0 ? { opacity: 0.45, cursor: 'default' } : {}}
              >
                {resendCountdown > 0
                  ? (locale === 'de' ? `Erneut senden (${resendCountdown}s)` : `Resend code (${resendCountdown}s)`)
                  : (locale === 'de' ? 'Code erneut senden' : 'Resend code')}
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
