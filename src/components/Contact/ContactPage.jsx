'use client';
import { useState, useRef } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import styles from './ContactPage.module.css';
import Breadcrumb from '@/components/Breadcrumb';
import contentEN from '@/data/pageContent.en.json';
import contentDE from '@/data/pageContent.de.json';

export default function ContactPage({ locale = 'en' }) {
  const content = locale === 'de' ? contentDE : contentEN;
  const contactContent = content.contact;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    website: '' // Honeypot
  });

  const [turnstileToken, setTurnstileToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const turnstileRef = useRef();

  const homeHref = locale === 'de' ? '/de' : '/';
  const breadcrumbItems = [
    { href: homeHref, label: contactContent.breadcrumb.home },
    { label: contactContent.breadcrumb.contact },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!turnstileToken) {
      setError(contactContent.form.errors.verification);
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          turnstileToken
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || contactContent.form.errors.failed);
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
      turnstileRef.current?.reset();
      setTurnstileToken('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Breadcrumb items={breadcrumbItems} />

        <header className={styles.header}>
          <h1 className={styles.heading}>{contactContent.heading}</h1>
          <p className={styles.subheading}>{contactContent.subheading}</p>
        </header>

        {submitted ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>&#10003;</div>
            <h2 className={styles.successTitle}>{contactContent.form.success.title}</h2>
            <p className={styles.successMessage}>{contactContent.form.success.message}</p>
          </div>
        ) : (
          <div className={styles.formWrapper}>
            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>{contactContent.form.name} *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{contactContent.form.email} *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{contactContent.form.subject}</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder={contactContent.form.subjectPlaceholder}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{contactContent.form.message} *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  placeholder={contactContent.form.messagePlaceholder}
                  className={styles.textarea}
                />
              </div>

              {/* Honeypot */}
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                style={{ position: 'absolute', left: '-9999px' }}
                tabIndex="-1"
                autoComplete="off"
                aria-hidden="true"
              />

              <div className={styles.turnstileWrapper}>
                <Turnstile
                  ref={turnstileRef}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setError(contactContent.form.errors.failed)}
                  onExpire={() => setTurnstileToken('')}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !turnstileToken}
                className={styles.submitButton}
              >
                {submitting ? contactContent.form.submitting : contactContent.form.submit}
              </button>
            </form>

            <p className={styles.emailNote}>
              {contactContent.emailNote}{' '}
              <a href={`mailto:${contactContent.email}`} className={styles.emailLink}>
                {contactContent.email}
              </a>
            </p>
          </div>
        )}

        <Breadcrumb items={breadcrumbItems} />
      </div>
    </main>
  );
}
