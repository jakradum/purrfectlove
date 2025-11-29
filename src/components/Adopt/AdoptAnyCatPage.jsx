'use client';
import { useState, useRef, useEffect } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import styles from './AdoptAnyCatPage.module.css';
import Breadcrumb from '@/components/Breadcrumb';
import contentEN from '@/data/pageContent.en.json';
import contentDE from '@/data/pageContent.de.json';

export default function AdoptAnyCatPage({ locale = 'en' }) {
  const content = locale === 'de' ? contentDE : contentEN;
  const adoptContent = content.adopt;

  const [formData, setFormData] = useState({
    applicantName: '',
    email: '',
    phone: '',
    address: '',
    housingType: '',
    hasOtherPets: false,
    otherPetsDetails: '',
    whyAdopt: '',
    experience: '',
    website: '' // Honeypot field
  });

  const [turnstileToken, setTurnstileToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const turnstileRef = useRef();

  const breadcrumbItems = [
    { label: adoptContent.breadcrumb.home, href: locale === 'de' ? '/de' : '/' },
    { label: adoptContent.breadcrumb.adopt, href: locale === 'de' ? '/de/adopt' : '/adopt' },
    { label: adoptContent.adoptAnyCat.title }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!turnstileToken) {
      setError(adoptContent.form.errors.verification);
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/submit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isOpenToAnyCat: true,
          turnstileToken
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || adoptContent.form.errors.failed);
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

  if (submitted) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <Breadcrumb items={breadcrumbItems} />
          <div className={styles.success}>
            <div className={styles.successIcon}>&#10003;</div>
            <h2 className={styles.successTitle}>{adoptContent.form.success.title}</h2>
            <p className={styles.successMessage}>{adoptContent.adoptAnyCat.successMessage}</p>
            <a
              href={locale === 'de' ? '/de/adopt' : '/adopt'}
              className={styles.backButton}
            >
              {locale === 'de' ? 'Zurück zu den Katzen' : 'Back to cats'}
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Breadcrumb items={breadcrumbItems} />

        <header className={styles.header}>
          <h1 className={styles.heading}>{adoptContent.adoptAnyCat.title}</h1>
          {adoptContent.adoptAnyCat.subtitle && (
            <p className={styles.subheading}>{adoptContent.adoptAnyCat.subtitle}</p>
          )}
        </header>

        <div className={styles.formWrapper}>
          {error && (
            <div className={styles.error}>{error}</div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                {adoptContent.form.fields.name} *
              </label>
              <input
                type="text"
                name="applicantName"
                value={formData.applicantName}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  {adoptContent.form.fields.email} *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  {adoptContent.form.fields.phone} *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder={adoptContent.form.fields.phonePlaceholder}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                {adoptContent.form.fields.address}
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="2"
                className={styles.textarea}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                {adoptContent.form.fields.housingType}
              </label>
              <select
                name="housingType"
                value={formData.housingType}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="">{adoptContent.form.fields.selectOption}</option>
                <option value="own">{adoptContent.form.fields.housingOptions.own}</option>
                <option value="rent">{adoptContent.form.fields.housingOptions.rent}</option>
                <option value="other">{adoptContent.form.fields.housingOptions.other}</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="hasOtherPets"
                  checked={formData.hasOtherPets}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
                <span>{adoptContent.form.fields.hasOtherPets}</span>
              </label>
            </div>

            {formData.hasOtherPets && (
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  {adoptContent.form.fields.otherPetsDetails}
                </label>
                <textarea
                  name="otherPetsDetails"
                  value={formData.otherPetsDetails}
                  onChange={handleChange}
                  rows="2"
                  className={styles.textarea}
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>
                {adoptContent.form.fields.whyAdopt} *
              </label>
              <textarea
                name="whyAdopt"
                value={formData.whyAdopt}
                onChange={handleChange}
                required
                minLength="50"
                rows="3"
                className={styles.textarea}
              />
              <span className={styles.charCount}>
                {formData.whyAdopt.length}/50 {adoptContent.form.fields.characters}
              </span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                {adoptContent.form.fields.experience}
              </label>
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                rows="2"
                className={styles.textarea}
              />
            </div>

            {/* Honeypot field - hidden from users */}
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

            {/* Turnstile verification */}
            <div className={styles.turnstileWrapper}>
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setError(adoptContent.form.errors.verificationFailed)}
                onExpire={() => setTurnstileToken('')}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !turnstileToken}
              className={styles.submitButton}
            >
              {submitting ? adoptContent.form.submitting : adoptContent.form.submit}
            </button>
          </form>
        </div>

        <Breadcrumb items={breadcrumbItems} />
      </div>
    </main>
  );
}
