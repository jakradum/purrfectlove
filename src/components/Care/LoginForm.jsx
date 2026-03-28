'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './Care.module.css';
import contentEN from '@/data/careContent.en.json';
import contentDE from '@/data/careContent.de.json';

export default function LoginForm({ locale = 'en' }) {
  const t = locale === 'de' ? contentDE.login : contentEN.login;
  const router = useRouter();

  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(t.errors.emailRequired);
      return;
    }
    if (!emailRegex.test(email)) {
      setError(t.errors.invalidEmail);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/care/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errors.invalidCode);
        return;
      }
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
      setError(t.errors.codeRequired);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/care/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errors.invalidCode);
        return;
      }
      router.push('/care');
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
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to resend. Please try again.');
      }
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
          <Image
            src="/logo.svg"
            alt="Purrfect Love"
            width={140}
            height={46}
            className={styles.logo}
          />
          <h1 className={styles.loginTitle}>{t.title}</h1>
          <p className={styles.loginSubtitle}>{t.subtitle}</p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendCode}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">
                {t.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? t.sending : t.sendCode}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className={styles.codeSentBox}>
              <p className={styles.codeSentTitle}>{t.codeSent}</p>
              <p className={styles.codeSentSubtitle}>
                {t.codeSentSubtitle}{' '}
                <span className={styles.emailHighlight}>{email}</span>
              </p>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="code">
                {t.codeLabel}
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className={`${styles.input} ${styles.inputLarge}`}
                placeholder={t.codePlaceholder}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={loading}
                autoComplete="one-time-code"
                autoFocus
              />
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? t.verifying : t.verify}
            </button>
            <div className={styles.resendRow}>
              <button
                type="button"
                className={styles.resendBtn}
                onClick={handleResend}
                disabled={loading}
              >
                {t.resend}
              </button>
            </div>
          </form>
        )}

        <p className={styles.notMember}>
          {t.notMember}{' '}
          <a href="mailto:support@purrfectlove.org" className={styles.supportLink}>
            support@purrfectlove.org
          </a>
        </p>
      </div>
    </div>
  );
}
