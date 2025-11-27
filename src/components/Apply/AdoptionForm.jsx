'use client';
import { useState, useRef, useEffect } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import styles from './AdoptionForm.module.css';

export default function AdoptionForm({ cat, content, onClose }) {
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
  const modalRef = useRef();

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  // Close modal when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

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
      setError(content.form.errors.verification);
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/submit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          catId: cat._id,
          turnstileToken
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || content.form.errors.failed);
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
      <div className={styles.overlay} ref={modalRef} onClick={handleBackdropClick}>
        <div className={styles.modal}>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            &times;
          </button>
          <div className={styles.success}>
            <div className={styles.successIcon}>&#10003;</div>
            <h2 className={styles.successTitle}>{content.form.success.title}</h2>
            <p className={styles.successMessage}>
              {content.form.success.message.replace('{catName}', cat.name)}
            </p>
            <button className={styles.successButton} onClick={onClose}>
              {content.form.success.button}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} ref={modalRef} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          &times;
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>
            {content.form.title.replace('{catName}', cat.name)}
          </h2>
          <p className={styles.subtitle}>{content.form.subtitle}</p>
        </div>

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {content.form.fields.name} *
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
                {content.form.fields.email} *
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
                {content.form.fields.phone} *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder={content.form.fields.phonePlaceholder}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              {content.form.fields.address}
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
              {content.form.fields.housingType}
            </label>
            <select
              name="housingType"
              value={formData.housingType}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">{content.form.fields.selectOption}</option>
              <option value="own">{content.form.fields.housingOptions.own}</option>
              <option value="rent">{content.form.fields.housingOptions.rent}</option>
              <option value="other">{content.form.fields.housingOptions.other}</option>
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
              <span>{content.form.fields.hasOtherPets}</span>
            </label>
          </div>

          {formData.hasOtherPets && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                {content.form.fields.otherPetsDetails}
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
              {content.form.fields.whyAdopt} *
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
              {formData.whyAdopt.length}/50 {content.form.fields.characters}
            </span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              {content.form.fields.experience}
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
              onError={() => setError(content.form.errors.verificationFailed)}
              onExpire={() => setTurnstileToken('')}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !turnstileToken}
            className={styles.submitButton}
          >
            {submitting ? content.form.submitting : content.form.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
