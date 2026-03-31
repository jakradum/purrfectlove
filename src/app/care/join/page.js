'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Turnstile } from '@marsidev/react-turnstile';
import styles from '@/components/Care/Care.module.css';

const COUNTRY_CODES = [
  { label: '🇮🇳 +91', value: '+91', country: 'IN', placeholder: '98765 43210' },
  { label: '🇩🇪 +49', value: '+49', country: 'DE', placeholder: '151 23456789' },
];

export default function JoinPage() {
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const turnstileRef = useRef();

  const fullPhone = phoneNumber ? `${countryCode}${phoneNumber.replace(/\D/g, '')}` : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!phoneNumber.trim() && !email.trim()) {
      setError('Please provide at least a phone number or email.');
      return;
    }
    if (!turnstileToken) {
      setError('Please complete the human verification.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/care/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: fullPhone || undefined,
          email: email.trim() || undefined,
          message: message.trim() || undefined,
          turnstileToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        if (turnstileRef.current) turnstileRef.current.reset();
        setTurnstileToken('');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Network error. Please try again.');
      if (turnstileRef.current) turnstileRef.current.reset();
      setTurnstileToken('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageNarrow}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <Image src="/logo.svg" alt="Purrfect Love" width={140} height={46} className={styles.logo} />
          <h1 className={styles.loginTitle}>Request Membership</h1>
          <p className={styles.loginSubtitle}>
            Fill in the form below and we&apos;ll get back to you soon.
          </p>
        </div>

        <p style={{ marginTop: 0, marginBottom: '1.5rem' }}>
          <a href="/care/login" style={{ color: 'var(--hunter-green)', fontSize: '0.875rem', textDecoration: 'none' }}>
            ← Back to login
          </a>
        </p>

        {submitted ? (
          <div style={{
            background: 'var(--whisker-cream)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center',
            color: 'var(--hunter-green)',
            fontWeight: 600,
            lineHeight: 1.6,
          }}>
            Your request has been submitted! We&apos;ll be in touch soon.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="name">Name *</label>
              <input
                id="name"
                type="text"
                className={styles.input}
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoComplete="name"
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="phone">Phone number</label>
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
                  <span
                    title="Purrfect Love Care is currently available in India and Germany only"
                    style={{ cursor: 'help', fontSize: '0.85rem', color: 'var(--text-light)', marginLeft: '0.25rem' }}
                  >
                    ⓘ
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
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="message">
                Why do you want to join?
              </label>
              <textarea
                id="message"
                className={styles.input}
                placeholder="Tell us a bit about yourself and why you'd like to join…"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                disabled={loading}
                rows={4}
                style={{ resize: 'vertical', fontFamily: 'var(--font-lora)' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'right', marginTop: '0.25rem' }}>
                {message.length} / 500
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div style={{ marginBottom: '1rem' }}>
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setError('Verification failed. Please refresh and try again.')}
                onExpire={() => setTurnstileToken('')}
              />
            </div>

            <button type="submit" className={styles.btn} disabled={loading || !turnstileToken}>
              {loading ? 'Submitting…' : 'Submit request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
