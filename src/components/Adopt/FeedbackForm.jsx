'use client'
import { useState } from 'react'
import styles from './FeedbackForm.module.css'

// ---- i18n strings ----
const i18n = {
  en: {
    headerLabel: 'Adoption feedback',
    title: 'How has life with your cat been?',
    subtitle: 'It only takes a few minutes. Your feedback helps us improve and support more cats and families.',
    sections: {
      general: 'General',
      overall: 'Overall experience',
      communication: 'Communication',
      matching: 'Matching and preparation',
      postAdoption: 'Post-adoption',
      openFeedback: 'Open feedback',
    },
    fields: {
      adoptionTimeframe: 'When did you adopt your cat?',
      overallSatisfaction: 'Overall satisfaction with the adoption experience',
      processClarity: 'Clarity of the adoption process',
      teamSupport: 'How supported you felt by the team',
      commBeforeAdoption: 'Communication before adoption',
      commAfterAdoption: 'Communication after adoption',
      responseTime: 'Response time to questions',
      catMatch: 'Satisfaction with the cat match',
      catInfoAccuracy: 'Accuracy of information provided about the cat',
      preparedForArrival: "How prepared you felt for the cat's arrival",
      settlingIn: 'How easy it was to settle the cat in',
      postAdoptionSupport: 'Helpfulness of post-adoption support',
      appreciated: 'What did you appreciate most?',
      improvements: 'What could we improve?',
      wouldRecommend: 'Would you recommend Purrfect Love?',
      additionalComments: 'Additional comments (optional)',
    },
    timeframeOptions: [
      { value: 'lt1month', label: 'Less than 1 month ago' },
      { value: '1to3', label: '1–3 months ago' },
      { value: '3to6', label: '3–6 months ago' },
      { value: 'gt6months', label: 'More than 6 months ago' },
    ],
    recommendOptions: [
      { value: 'yes', label: 'Yes' },
      { value: 'notsure', label: 'Not sure' },
      { value: 'no', label: 'No' },
    ],
    ratingHintLow: 'Not at all',
    ratingHintHigh: 'Very much',
    submitLabel: 'Submit feedback',
    submitting: 'Submitting…',
    alreadySubmittedTitle: 'Thank you.',
    alreadySubmittedBody: (dateStr) =>
      `You submitted your feedback on ${dateStr}. Got more feedback? Email us at `,
    alreadySubmittedEmail: 'support@purrfectlove.org',
    errorGeneric: 'Something went wrong. Please try again.',
  },
  de: {
    headerLabel: 'Adoptions-Feedback',
    title: 'Wie läuft es mit Ihrer Katze?',
    subtitle:
      'Es dauert nur wenige Minuten. Ihr Feedback hilft uns, noch mehr Katzen und Familien zu unterstützen.',
    sections: {
      general: 'Allgemein',
      overall: 'Gesamterfahrung',
      communication: 'Kommunikation',
      matching: 'Vermittlung und Vorbereitung',
      postAdoption: 'Nach der Adoption',
      openFeedback: 'Offenes Feedback',
    },
    fields: {
      adoptionTimeframe: 'Wann haben Sie Ihre Katze adoptiert?',
      overallSatisfaction: 'Gesamtzufriedenheit mit dem Adoptionsprozess',
      processClarity: 'Klarheit des Adoptionsprozesses',
      teamSupport: 'Wie unterstützt Sie sich durch das Team gefühlt haben',
      commBeforeAdoption: 'Kommunikation vor der Adoption',
      commAfterAdoption: 'Kommunikation nach der Adoption',
      responseTime: 'Reaktionszeit auf Fragen',
      catMatch: 'Zufriedenheit mit der Katzenvermittlung',
      catInfoAccuracy: 'Genauigkeit der Informationen über die Katze',
      preparedForArrival: 'Wie gut Sie auf die Ankunft der Katze vorbereitet waren',
      settlingIn: 'Wie leicht es war, die Katze einzugewöhnen',
      postAdoptionSupport: 'Hilfsbereitschaft der Unterstützung nach der Adoption',
      appreciated: 'Was hat Ihnen am meisten gefallen?',
      improvements: 'Was könnten wir verbessern?',
      wouldRecommend: 'Würden Sie Purrfect Love weiterempfehlen?',
      additionalComments: 'Weitere Anmerkungen (optional)',
    },
    timeframeOptions: [
      { value: 'lt1month', label: 'Vor weniger als 1 Monat' },
      { value: '1to3', label: 'Vor 1–3 Monaten' },
      { value: '3to6', label: 'Vor 3–6 Monaten' },
      { value: 'gt6months', label: 'Vor mehr als 6 Monaten' },
    ],
    recommendOptions: [
      { value: 'yes', label: 'Ja' },
      { value: 'notsure', label: 'Nicht sicher' },
      { value: 'no', label: 'Nein' },
    ],
    ratingHintLow: 'Gar nicht',
    ratingHintHigh: 'Sehr',
    submitLabel: 'Feedback absenden',
    submitting: 'Wird gesendet…',
    alreadySubmittedTitle: 'Vielen Dank.',
    alreadySubmittedBody: (dateStr) =>
      `Sie haben Ihr Feedback am ${dateStr} eingereicht. Noch mehr Feedback? Schreiben Sie uns an `,
    alreadySubmittedEmail: 'support@purrfectlove.org',
    errorGeneric: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
  },
}

function formatDate(isoString, locale) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ---- Rating component ----
function RatingField({ label, name, value, onChange, t }) {
  return (
    <div className={styles.ratingRow}>
      <label className={styles.label}>{label}</label>
      <div className={styles.ratingScale}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`${styles.ratingButton} ${value === n ? styles.ratingButtonSelected : ''}`}
            onClick={() => onChange(name, n)}
            aria-label={`${n}`}
            aria-pressed={value === n}
          >
            {n}
          </button>
        ))}
      </div>
      <div className={styles.ratingHint}>
        <span>{t.ratingHintLow}</span>
        <span>{t.ratingHintHigh}</span>
      </div>
    </div>
  )
}

// ---- Main component ----
export default function FeedbackForm({ token, applicationId, feedbackSubmittedAt, locale }) {
  const t = i18n[locale] === undefined ? i18n.en : i18n[locale]

  const [submittedAt, setSubmittedAt] = useState(feedbackSubmittedAt)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [responses, setResponses] = useState({
    adoptionTimeframe: '',
    overallSatisfaction: null,
    processClarity: null,
    teamSupport: null,
    commBeforeAdoption: null,
    commAfterAdoption: null,
    responseTime: null,
    catMatch: null,
    catInfoAccuracy: null,
    preparedForArrival: null,
    settlingIn: null,
    postAdoptionSupport: null,
    appreciated: '',
    improvements: '',
    wouldRecommend: '',
    additionalComments: '',
  })

  function handleRadio(e) {
    const { name, value } = e.target
    setResponses((prev) => ({ ...prev, [name]: value }))
  }

  function handleText(e) {
    const { name, value } = e.target
    setResponses((prev) => ({ ...prev, [name]: value }))
  }

  function handleRating(name, value) {
    setResponses((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, responses }),
      })

      if (res.status === 409) {
        // Already submitted by someone else in the meantime
        setSubmittedAt(new Date().toISOString())
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || t.errorGeneric)
        return
      }

      setSubmittedAt(new Date().toISOString())
    } catch {
      setError(t.errorGeneric)
    } finally {
      setSubmitting(false)
    }
  }

  // ---- Already-submitted state ----
  if (submittedAt) {
    const dateStr = formatDate(submittedAt, locale)
    return (
      <div className={styles.page}>
        <div className={styles.submittedWrap}>
          <h1 className={styles.submittedTitle}>{t.alreadySubmittedTitle}</h1>
          <p className={styles.submittedBody}>
            {t.alreadySubmittedBody(dateStr)}
            <a href={`mailto:${t.alreadySubmittedEmail}`}>{t.alreadySubmittedEmail}</a>
          </p>
        </div>
      </div>
    )
  }

  // ---- Form state ----
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.headerLabel}>{t.headerLabel}</p>
          <h1 className={styles.title}>{t.title}</h1>
          <p className={styles.subtitle}>{t.subtitle}</p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>

          {/* Section 1 — General */}
          <section className={styles.section}>
            <p className={styles.sectionTitle}>{t.sections.general}</p>
            <div className={styles.fieldGroup}>
              <div>
                <label className={styles.label}>{t.fields.adoptionTimeframe}</label>
                <div className={styles.radioGroup}>
                  {t.timeframeOptions.map((opt) => (
                    <label key={opt.value} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="adoptionTimeframe"
                        value={opt.value}
                        checked={responses.adoptionTimeframe === opt.value}
                        onChange={handleRadio}
                        required
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 — Overall experience */}
          <section className={styles.section}>
            <p className={styles.sectionTitle}>{t.sections.overall}</p>
            <div className={styles.fieldGroup}>
              <RatingField label={t.fields.overallSatisfaction} name="overallSatisfaction" value={responses.overallSatisfaction} onChange={handleRating} t={t} />
              <RatingField label={t.fields.processClarity} name="processClarity" value={responses.processClarity} onChange={handleRating} t={t} />
              <RatingField label={t.fields.teamSupport} name="teamSupport" value={responses.teamSupport} onChange={handleRating} t={t} />
            </div>
          </section>

          {/* Section 3 — Communication */}
          <section className={styles.section}>
            <p className={styles.sectionTitle}>{t.sections.communication}</p>
            <div className={styles.fieldGroup}>
              <RatingField label={t.fields.commBeforeAdoption} name="commBeforeAdoption" value={responses.commBeforeAdoption} onChange={handleRating} t={t} />
              <RatingField label={t.fields.commAfterAdoption} name="commAfterAdoption" value={responses.commAfterAdoption} onChange={handleRating} t={t} />
              <RatingField label={t.fields.responseTime} name="responseTime" value={responses.responseTime} onChange={handleRating} t={t} />
            </div>
          </section>

          {/* Section 4 — Matching and preparation */}
          <section className={styles.section}>
            <p className={styles.sectionTitle}>{t.sections.matching}</p>
            <div className={styles.fieldGroup}>
              <RatingField label={t.fields.catMatch} name="catMatch" value={responses.catMatch} onChange={handleRating} t={t} />
              <RatingField label={t.fields.catInfoAccuracy} name="catInfoAccuracy" value={responses.catInfoAccuracy} onChange={handleRating} t={t} />
              <RatingField label={t.fields.preparedForArrival} name="preparedForArrival" value={responses.preparedForArrival} onChange={handleRating} t={t} />
            </div>
          </section>

          {/* Section 5 — Post-adoption */}
          <section className={styles.section}>
            <p className={styles.sectionTitle}>{t.sections.postAdoption}</p>
            <div className={styles.fieldGroup}>
              <RatingField label={t.fields.settlingIn} name="settlingIn" value={responses.settlingIn} onChange={handleRating} t={t} />
              <RatingField label={t.fields.postAdoptionSupport} name="postAdoptionSupport" value={responses.postAdoptionSupport} onChange={handleRating} t={t} />
            </div>
          </section>

          {/* Section 6 — Open feedback */}
          <section className={styles.section}>
            <p className={styles.sectionTitle}>{t.sections.openFeedback}</p>
            <div className={styles.fieldGroup}>
              <div>
                <label className={styles.label} htmlFor="appreciated">{t.fields.appreciated}</label>
                <textarea
                  id="appreciated"
                  name="appreciated"
                  className={styles.textarea}
                  value={responses.appreciated}
                  onChange={handleText}
                />
              </div>
              <div>
                <label className={styles.label} htmlFor="improvements">{t.fields.improvements}</label>
                <textarea
                  id="improvements"
                  name="improvements"
                  className={styles.textarea}
                  value={responses.improvements}
                  onChange={handleText}
                />
              </div>
              <div>
                <label className={styles.label}>{t.fields.wouldRecommend}</label>
                <div className={styles.radioGroup}>
                  {t.recommendOptions.map((opt) => (
                    <label key={opt.value} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="wouldRecommend"
                        value={opt.value}
                        checked={responses.wouldRecommend === opt.value}
                        onChange={handleRadio}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={styles.label} htmlFor="additionalComments">{t.fields.additionalComments}</label>
                <textarea
                  id="additionalComments"
                  name="additionalComments"
                  className={styles.textarea}
                  value={responses.additionalComments}
                  onChange={handleText}
                />
              </div>
            </div>
          </section>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitButton} disabled={submitting}>
            {submitting ? t.submitting : t.submitLabel}
          </button>

        </form>
      </div>
    </div>
  )
}
