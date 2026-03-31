'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OpenLocationCode } from 'open-location-code';
import styles from './Care.module.css';
import contentEN from '@/data/careContent.en.json';
import contentDE from '@/data/careContent.de.json';

const PERSONALITY_OPTIONS = ['shy', 'energetic', 'special needs']; // 'senior' is auto-calculated from age
const DIET_OPTIONS = ['wet', 'dry', 'medication', 'special diet'];
const FEEDING_OPTIONS = ['wet', 'dry', 'medication', 'special diet'];
const BEHAVIORAL_OPTIONS = ['shy', 'energetic', 'senior', 'special needs']; // sitter traits keep senior

const TAG_LABELS = {
  shy: 'Shy', energetic: 'Energetic', senior: 'Senior', 'special needs': 'Special Needs',
  wet: 'Wet food', dry: 'Dry food', medication: 'Medication', 'special diet': 'Special diet',
  email: 'Email', whatsapp: 'WhatsApp',
};

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function computeCompletion(form) {
  const required = [];
  const optional = [];

  if (!form.name?.trim()) required.push('Display name');
  if (!form.location?.lat || !form.location?.lng) required.push('Location (Plus Code)');

  if (form.canSit) {
    if (!form.maxHomesPerDay) required.push('Homes you can visit per day');
    if (!form.feedingTypes?.length) required.push('Feeding types you can handle');
    if (!form.behavioralTraits?.length) required.push('Cat behaviors you\'re comfortable with');
    if (!form.alwaysAvailable && !form.availableDates?.length) required.push('Availability dates');
  }

  if (form.needsSitting) {
    if (!form.cats?.length) required.push('At least one cat profile');
  }

  if (!form.bedrooms) optional.push('Number of bedrooms');
  if (!form.householdSize) optional.push('Household size');

  const totalRequired = 2 + (form.canSit ? 4 : 0) + (form.needsSitting ? 1 : 0);
  const totalOptional = 2;
  const total = totalRequired + totalOptional;
  const completed = (totalRequired - required.length) + (totalOptional - optional.length);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 100;

  return { required, optional, completed, total, percent, isComplete: percent === 100 };
}

function CompletionIndicator({ form, onEdit }) {
  const { required, optional, completed, total, percent, isComplete } = computeCompletion(form);
  if (isComplete) return null;

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(44,95,79,0.12)', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '0', boxShadow: '0 1px 4px rgba(44,95,79,0.06)' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-dark)' }}>
          {completed} of {total} fields complete
        </span>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--hunter-green)' }}>{percent}%</span>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'rgba(44,95,79,0.1)', borderRadius: '6px', height: '7px', marginBottom: '1rem', overflow: 'hidden' }}>
        <div style={{ width: `${percent}%`, height: '100%', background: 'var(--hunter-green)', borderRadius: '6px', transition: 'width 0.4s ease' }} />
      </div>

      {/* Missing fields */}
      {required.length > 0 && (
        <div style={{ marginBottom: optional.length ? '0.75rem' : '1rem' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c0392b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Required</p>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', listStyle: 'disc' }}>
            {required.map((f) => (
              <li key={f} style={{ fontSize: '0.82rem', color: '#c0392b', lineHeight: 1.7 }}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {optional.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Optional to complete</p>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', listStyle: 'disc' }}>
            {optional.map((f) => (
              <li key={f} style={{ fontSize: '0.82rem', color: 'var(--text-light)', lineHeight: 1.7 }}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onEdit}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', background: 'var(--hunter-green)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-outfit)', cursor: 'pointer' }}
      >
        Complete Profile
      </button>
    </div>
  );
}

function ReadField({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className={styles.readField}>
      <span className={styles.readFieldLabel}>{label}</span>
      <span className={styles.readFieldValue}>{value}</span>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <div className={styles.switchRow}>
      <label className={styles.toggle}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={styles.toggleSlider} />
      </label>
      <span className={styles.switchLabel}>{label}</span>
    </div>
  );
}

function CheckboxGroup({ options, value = [], onChange, labelMap }) {
  const toggle = (opt) => {
    const current = value || [];
    onChange(current.includes(opt) ? current.filter((v) => v !== opt) : [...current, opt]);
  };
  return (
    <div className={styles.checkboxGroup}>
      {options.map((opt) => (
        <label key={opt} className={styles.checkboxLabel}>
          <input type="checkbox" checked={(value || []).includes(opt)} onChange={() => toggle(opt)} />
          {labelMap ? labelMap[opt] || opt : opt}
        </label>
      ))}
    </div>
  );
}

function formFromData(data) {
  return {
    name: data.name || '',
    location: data.location || null,
    bio: data.bio || '',
    contactPreference: data.contactPreference || 'email',
    bedrooms: data.bedrooms ?? '',
    householdSize: data.householdSize ?? '',
    cats: data.cats || [],
    alwaysAvailable: data.alwaysAvailable ?? false,
    unavailableDates: data.unavailableDates || [],
    availableDates: data.availableDates || [],
    maxHomesPerDay: data.maxHomesPerDay ?? '',
    feedingTypes: data.feedingTypes || [],
    behavioralTraits: data.behavioralTraits || [],
    canSit: data.canSit ?? false,
    needsSitting: data.needsSitting ?? false,
    hideEmail: data.hideEmail ?? false,
    hideWhatsApp: data.hideWhatsApp ?? false,
  };
}

export default function ProfileEditor({ initialData }) {
  const locale = 'en';
  const t = locale === 'de' ? contentDE.profile : contentEN.profile;
  const tags = t.tags;
  const router = useRouter();

  const tagMap = {
    shy: tags.shy, energetic: tags.energetic, senior: tags.senior,
    'special needs': tags.specialNeeds, wet: tags.wet, dry: tags.dry,
    medication: tags.medication, 'special diet': tags.specialDiet,
  };

  const savedForm = useRef(formFromData(initialData));
  const [form, setForm] = useState(formFromData(initialData));
  const [locationInput, setLocationInput] = useState(initialData.location?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [privacySaving, setPrivacySaving] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [locationError, setLocationError] = useState('');

  const olc = new OpenLocationCode();

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm.current);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveError('');
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleLocationChange = (raw) => {
    setLocationInput(raw);
    setLocationError('');
    const trimmed = raw.trim();
    if (!trimmed) { update('location', null); return; }

    const token = trimmed.split(/\s+/)[0];
    if (!token.includes('+') || !olc.isValid(token)) {
      setLocationError('Enter a valid full Plus Code (e.g. 7J4VVHQ2+FH) from plus.codes/map');
      update('location', null);
      return;
    }

    if (olc.isFull(token)) {
      try {
        const decoded = olc.decode(token);
        update('location', {
          name: trimmed,
          lat: parseFloat(decoded.latitudeCenter.toFixed(6)),
          lng: parseFloat(decoded.longitudeCenter.toFixed(6)),
        });
        return;
      } catch { /* fall through */ }
    }

    // Short code — cannot decode without a reference; ask for full code
    setLocationError('This looks like a short code. Please use the full code from plus.codes/map (e.g. 7J4VVHQ2+FH)');
    update('location', null);
  };

  const handleStatusToggle = (field, value) => {
    // Mutually exclusive — turning one on turns the other off; both can be off
    update('canSit', field === 'canSit' ? value : (value ? false : form.canSit));
    update('needsSitting', field === 'needsSitting' ? value : (value ? false : form.needsSitting));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isDirty) return;
    setSaving(true);
    setSaveError('');

    try {
      const res = await fetch('/api/care/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          bedrooms: form.bedrooms !== '' ? Number(form.bedrooms) : undefined,
          householdSize: form.householdSize !== '' ? Number(form.householdSize) : undefined,
          maxHomesPerDay: form.maxHomesPerDay !== '' ? Number(form.maxHomesPerDay) : undefined,
          cats: form.cats.map((cat) => ({
            ...cat,
            age: cat.age !== '' && cat.age !== undefined ? Number(cat.age) : undefined,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error || t.errors.saveFailed);
        return;
      }

      const updated = await res.json();
      const newForm = formFromData(updated);
      savedForm.current = newForm;
      setForm(newForm);
      setLocationInput(updated.location?.name || '');
      setIsEditing(false);
      router.refresh();
    } catch {
      setSaveError(t.errors.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(savedForm.current);
    setLocationInput(savedForm.current.location?.name || '');
    setSaveError('');
    setIsEditing(false);
  };

  // Auto-save just the privacy toggles without entering edit mode
  const handlePrivacyToggle = async (field, value) => {
    const newForm = { ...form, [field]: value };
    setForm(newForm);
    setPrivacySaving(true);
    try {
      await fetch('/api/care/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      savedForm.current = { ...savedForm.current, [field]: value };
    } catch { /* silent — toggle will revert on next save */ }
    setPrivacySaving(false);
  };

  // Cats helpers
  const addCat = () => update('cats', [...form.cats, { name: '', age: '', personality: [], diet: [] }]);
  const updateCat = (idx, field, value) => {
    const updated = form.cats.map((c, i) => {
      if (i !== idx) return c;
      const next = { ...c, [field]: value };
      // Auto-apply senior tag based on age
      if (field === 'age') {
        const age = Number(value);
        const personality = next.personality || [];
        if (age >= 10 && !personality.includes('senior')) {
          next.personality = [...personality, 'senior'];
        } else if (age < 10 && personality.includes('senior')) {
          next.personality = personality.filter((p) => p !== 'senior');
        }
      }
      return next;
    });
    update('cats', updated);
  };
  const removeCat = (idx) => update('cats', form.cats.filter((_, i) => i !== idx));

  // Date range helpers
  const addDateRange = () => update('availableDates', [...form.availableDates, { start: '', end: '' }]);
  const updateDateRange = (idx, field, value) => update('availableDates', form.availableDates.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  const removeDateRange = (idx) => update('availableDates', form.availableDates.filter((_, i) => i !== idx));

  // ── READ MODE ──────────────────────────────────────────────────────────────
  if (!isEditing) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.profileHeader} style={{ alignItems: 'flex-start' }}>
          <div>
            <Link href="/" className={styles.backLink}>← Back to network</Link>
            <h1 className={styles.pageTitle}>{form.name || 'My Profile'}</h1>
          </div>
        </div>

        <CompletionIndicator form={form} onEdit={() => setIsEditing(true)} />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className={styles.editBtn}
            onClick={() => setIsEditing(true)}
            title="Edit profile"
          >
            <PencilIcon /> Edit
          </button>
        </div>

        {/* About */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.sections.about}</h2>
          <ReadField label="Display name" value={form.name} />
          <ReadField label="Location" value={form.location?.name} />
          {form.location?.lat != null && (
            <ReadField label="Coordinates" value={`${form.location.lat}, ${form.location.lng}`} />
          )}
          <ReadField label="Contact via" value={TAG_LABELS[form.contactPreference] || form.contactPreference} />
          {form.bio && <p className={styles.readBio}>{form.bio}</p>}
        </div>

        {/* Read-only account info */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.sections.account}</h2>
          {initialData.email && (
            <div className={styles.readField}>
              <span className={styles.readFieldLabel}>Email</span>
              <span className={styles.readFieldValue} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{initialData.email}</span>
                <button
                  type="button"
                  title="Copy email"
                  style={{ flexShrink: 0, padding: '0.3rem', background: 'none', border: '1px solid rgba(44,95,79,0.25)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: copiedField === 'email' ? 'var(--hunter-green)' : 'var(--text-light)' }}
                  onClick={() => handleCopy(initialData.email, 'email')}
                >
                  {copiedField === 'email' ? <CheckIcon /> : <CopyIcon />}
                </button>
              </span>
            </div>
          )}
          {initialData.phone && (
            <div className={styles.readField}>
              <span className={styles.readFieldLabel}>Phone</span>
              <span className={styles.readFieldValue} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{initialData.phone}</span>
                <button
                  type="button"
                  title="Copy phone"
                  style={{ flexShrink: 0, padding: '0.3rem', background: 'none', border: '1px solid rgba(44,95,79,0.25)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: copiedField === 'phone' ? 'var(--hunter-green)' : 'var(--text-light)' }}
                  onClick={() => handleCopy(initialData.phone, 'phone')}
                >
                  {copiedField === 'phone' ? <CheckIcon /> : <CopyIcon />}
                </button>
              </span>
            </div>
          )}
          {/* Contact privacy — always-visible toggles with auto-save */}
          <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(44,95,79,0.08)', paddingTop: '0.75rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Contact Visibility {privacySaving && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>Saving…</span>}
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-dark)', cursor: 'pointer', marginBottom: '0.4rem' }}>
              <input
                type="checkbox"
                checked={!form.hideEmail}
                onChange={(e) => handlePrivacyToggle('hideEmail', !e.target.checked)}
              />
              Show email on profile
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-dark)', cursor: 'pointer', marginBottom: '0.4rem' }}>
              <input
                type="checkbox"
                checked={!form.hideWhatsApp}
                onChange={(e) => handlePrivacyToggle('hideWhatsApp', !e.target.checked)}
              />
              Show WhatsApp on profile
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem', lineHeight: 1.5 }}>
              Your contact info is visible by default. If both are hidden, members message you via the inbox.
            </p>
          </div>
        </div>

        {/* Home */}
        {(form.bedrooms || form.householdSize) && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t.sections.home}</h2>
            <ReadField label={t.fields.bedrooms} value={form.bedrooms} />
            <ReadField label={t.fields.householdSize} value={form.householdSize} />
          </div>
        )}

        {/* Cats */}
        {form.cats.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t.sections.myCats}</h2>
            {form.cats.map((cat, i) => (
              <div key={i} className={styles.readCatRow}>
                <strong>{cat.name || `Cat ${i + 1}`}</strong>
                {cat.age ? ` — ${cat.age} yrs` : ''}
                {Number(cat.age) >= 10 && <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: 'var(--text-light)' }}>🐱 Senior</span>}
                {cat.personality?.filter((p) => p !== 'senior').length > 0 && (
                  <div className={styles.tags} style={{ marginTop: '0.3rem' }}>
                    {cat.personality.filter((p) => p !== 'senior').map((p) => <span key={p} className={`${styles.tag} ${styles.tagGreen}`}>{tagMap[p] || p}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Status */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.sections.status}</h2>
          <div className={styles.tags}>
            {form.canSit && <span className={`${styles.tag} ${styles.tagGreen}`}>I can sit</span>}
            {form.needsSitting && <span className={`${styles.tag} ${styles.tagBrown}`}>I need sitting</span>}
            {!form.canSit && !form.needsSitting && <span className={styles.readFieldValue} style={{ color: '#aaa' }}>Not active</span>}
          </div>
        </div>
      </div>
    );
  }

  // ── EDIT MODE ──────────────────────────────────────────────────────────────
  return (
    <form className={styles.profilePage} onSubmit={handleSave}>
      <div className={styles.profileHeader}>
        <h1 className={styles.pageTitle}>{t.title}</h1>
        <button type="button" className={styles.cancelBtn} onClick={handleCancel}>Cancel</button>
      </div>

      {/* About Me */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.sections.about}</h2>
        <div className={styles.formGroup}>
          <label className={styles.profileLabel}>{t.fields.name}</label>
          <input type="text" className={styles.profileInput} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Your display name" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.profileLabel}>{t.fields.bio}</label>
          <textarea className={styles.profileTextarea} value={form.bio} onChange={(e) => update('bio', e.target.value.slice(0, 250))} placeholder="Tell other members about yourself..." rows={4} maxLength={250} />
          <p className={styles.hint}>{form.bio.length}/250 — {t.fields.bioHint}</p>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.profileLabel}>{t.fields.contactPreference}</label>
          <div className={styles.contactFilterGroup}>
            <label className={styles.contactFilterOption}>
              <input type="radio" name="contactPreference" value="email" checked={form.contactPreference === 'email'} onChange={() => update('contactPreference', 'email')} />
              {t.fields.contactEmail}
            </label>
            <label className={styles.contactFilterOption}>
              <input type="radio" name="contactPreference" value="whatsapp" checked={form.contactPreference === 'whatsapp'} onChange={() => update('contactPreference', 'whatsapp')} />
              {t.fields.contactWhatsapp}
            </label>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className={styles.section} style={!form.location?.lat ? { borderColor: 'rgba(239,68,68,0.4)', borderWidth: '1px', borderStyle: 'solid', borderRadius: '12px' } : {}}>
        <h2 className={styles.sectionTitle} style={!form.location?.lat ? { color: '#ef4444' } : {}}>
          Location <span style={{ fontWeight: 400 }}>*</span>
        </h2>
        <div className={styles.formGroup}>
          <label className={styles.profileLabel} style={!form.location?.lat ? { color: '#ef4444' } : {}}>
            Plus Code <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            className={styles.profileInput}
            value={locationInput}
            onChange={(e) => handleLocationChange(e.target.value)}
            placeholder="e.g. GV3C+9X"
            style={!form.location?.lat ? { borderColor: '#ef4444' } : {}}
          />
          {locationError && (
            <p className={styles.hint} style={{ color: '#ef4444' }}>{locationError}</p>
          )}
          {!locationError && form.location?.lat != null && (
            <p className={styles.hint} style={{ fontFamily: 'monospace' }}>
              📍 {form.location.lat}, {form.location.lng}
            </p>
          )}
          {!locationError && form.location?.name && form.location.lat == null && (
            <p className={styles.hint}>Coordinates will be resolved when you save.</p>
          )}
        </div>
        <p className={styles.hint}>
          Find your apartment&apos;s Plus Code here:{' '}
          <a href="https://plus.codes/map" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--hunter-green)' }}>plus.codes/map</a>
        </p>
      </div>

      {/* Account Info (read-only) */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.sections.account}</h2>
        <p className={styles.readOnlyNote}>{t.readOnly}</p>
        <div className={styles.fieldRow}>
          <div className={styles.formGroup}>
            <label className={styles.profileLabel}>Email</label>
            <input className={styles.profileInput} value={initialData.email || ''} disabled />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.profileLabel}>Phone</label>
            <input className={styles.profileInput} value={initialData.phone || ''} disabled />
          </div>
        </div>
      </div>

      {/* My Home */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.sections.home}</h2>
        <div className={styles.fieldRow}>
          <div className={styles.formGroup}>
            <label className={styles.profileLabel}>{t.fields.bedrooms}</label>
            <input type="number" min={0} max={20} className={styles.profileInput} value={form.bedrooms} onChange={(e) => update('bedrooms', e.target.value)} placeholder="e.g. 2" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.profileLabel}>{t.fields.householdSize}</label>
            <input type="number" min={1} max={20} className={styles.profileInput} value={form.householdSize} onChange={(e) => update('householdSize', e.target.value)} placeholder="e.g. 2" />
            <p className={styles.hint}>Number of people living in your home</p>
          </div>
        </div>
      </div>

      {/* My Cats */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.sections.myCats} <span style={{ color: '#e53e3e', fontWeight: 400 }}>*</span></h2>
        {form.cats.map((cat, idx) => (
          <div key={idx} className={styles.catCard}>
            <div className={styles.catCardHeader}>
              <span className={styles.catCardTitle}>{cat.name || `Cat ${idx + 1}`}</span>
              <button type="button" className={styles.removeBtnSmall} onClick={() => removeCat(idx)}>{t.fields.removeCat}</button>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.formGroup}>
                <label className={styles.profileLabel}>{t.fields.catName} <span style={{ color: '#e53e3e' }}>*</span></label>
                <input type="text" className={styles.profileInput} value={cat.name || ''} onChange={(e) => updateCat(idx, 'name', e.target.value)} placeholder="e.g. Mochi" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.profileLabel}>{t.fields.catAge}</label>
                <input type="number" min={0} max={30} className={styles.profileInput} value={cat.age || ''} onChange={(e) => updateCat(idx, 'age', e.target.value)} placeholder="e.g. 3" />
                {Number(cat.age) >= 10 && (
                  <p className={styles.hint}>🐱 Senior cat (10+ yrs) — tagged automatically</p>
                )}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.profileLabel}>{t.fields.catPersonality}</label>
              <CheckboxGroup options={PERSONALITY_OPTIONS} value={cat.personality || []} onChange={(v) => updateCat(idx, 'personality', v)} labelMap={tagMap} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.profileLabel}>{t.fields.catDiet}</label>
              <CheckboxGroup options={DIET_OPTIONS} value={cat.diet || []} onChange={(v) => updateCat(idx, 'diet', v)} labelMap={tagMap} />
            </div>
          </div>
        ))}
        <button type="button" className={styles.addBtn} onClick={addCat}>{t.fields.addCat}</button>
      </div>

      {/* My Availability */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.sections.availability}</h2>
        <div className={styles.formGroup}>
          <Toggle checked={form.alwaysAvailable} onChange={(v) => update('alwaysAvailable', v)} label={t.fields.alwaysAvailable} />
        </div>
        {form.alwaysAvailable ? (
          <div className={styles.formGroup}>
            <label className={styles.profileLabel}>{t.fields.unavailableDates}</label>
            <p className={styles.hint}>Pick each date you won&apos;t be available.</p>
            <input
              type="date"
              className={styles.profileInput}
              value=""
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                const val = e.target.value;
                if (val && !(form.unavailableDates || []).includes(val)) {
                  update('unavailableDates', [...(form.unavailableDates || []), val].sort());
                }
                e.target.value = '';
              }}
              style={{ maxWidth: '180px' }}
            />
            {(form.unavailableDates || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
                {(form.unavailableDates || []).map((d) => (
                  <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(200,92,63,0.1)', border: '1px solid rgba(200,92,63,0.25)', borderRadius: '6px', padding: '0.2rem 0.5rem 0.2rem 0.65rem', fontSize: '0.8rem', color: 'var(--text-dark)' }}>
                    {d}
                    <button
                      type="button"
                      onClick={() => update('unavailableDates', (form.unavailableDates || []).filter((x) => x !== d))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 0.15rem', lineHeight: 1, color: '#c85c3f', fontSize: '1rem', fontWeight: 700 }}
                      title="Remove date"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.formGroup}>
            <label className={styles.profileLabel}>{t.fields.availableRanges}</label>
            <div className={styles.dateRangeList}>
              {form.availableDates.map((range, idx) => (
                <div key={idx} className={styles.dateRangeRow}>
                  <input type="date" className={styles.profileInput} value={range.start || ''} onChange={(e) => updateDateRange(idx, 'start', e.target.value)} style={{ flex: 1 }} />
                  <span>→</span>
                  <input type="date" className={styles.profileInput} value={range.end || ''} onChange={(e) => updateDateRange(idx, 'end', e.target.value)} style={{ flex: 1 }} />
                  <button type="button" className={styles.removeBtnSmall} onClick={() => removeDateRange(idx)}>{t.fields.removeRange}</button>
                </div>
              ))}
            </div>
            <button type="button" className={styles.addBtn} onClick={addDateRange}>{t.fields.addRange}</button>
          </div>
        )}
      </div>

      {/* Sitting Capabilities */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.sections.sittingCapabilities}</h2>
        <div className={styles.formGroup}>
          <label className={styles.profileLabel}>{t.fields.maxHomesPerDay}</label>
          <input type="number" min={1} max={5} className={styles.profileInput} value={form.maxHomesPerDay} onChange={(e) => update('maxHomesPerDay', e.target.value)} placeholder="e.g. 2" style={{ maxWidth: '140px' }} />
          <p className={styles.hint}>For planning multiple visits in one day</p>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.profileLabel}>{t.fields.feedingTypes}</label>
          <CheckboxGroup options={FEEDING_OPTIONS} value={form.feedingTypes} onChange={(v) => update('feedingTypes', v)} labelMap={tagMap} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.profileLabel}>{t.fields.behavioralTraits}</label>
          <CheckboxGroup options={BEHAVIORAL_OPTIONS} value={form.behavioralTraits} onChange={(v) => update('behavioralTraits', v)} labelMap={tagMap} />
        </div>
      </div>

      {/* My Status */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.sections.status}</h2>
        <p className={styles.hint} style={{ marginBottom: '0.75rem' }}>Select one, or neither if you&apos;re currently unavailable.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Toggle checked={form.canSit} onChange={(v) => handleStatusToggle('canSit', v)} label={t.fields.canSit} />
          <Toggle checked={form.needsSitting} onChange={(v) => handleStatusToggle('needsSitting', v)} label={t.fields.needsSitting} />
        </div>
      </div>

      {/* Contact Privacy */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Contact Privacy</h2>
        <div className={styles.contactPrivacySection}>
          <label className={styles.checkboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input
              type="checkbox"
              checked={form.hideEmail}
              onChange={(e) => update('hideEmail', e.target.checked)}
            />
            Hide email from profile
          </label>
          <label className={styles.checkboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={form.hideWhatsApp}
              onChange={(e) => update('hideWhatsApp', e.target.checked)}
            />
            Hide WhatsApp/phone from profile
          </label>
          <p className={styles.privacyHelp}>
            Your contact info is visible by default. If both are hidden, members message you through the inbox instead.
          </p>
        </div>
      </div>

      {/* Save Bar */}
      <div className={styles.saveBar}>
        {saveError && <span className={styles.saveError}>{saveError}</span>}
        <button
          type="submit"
          className={styles.saveBtn}
          disabled={saving || !isDirty}
          style={{ opacity: isDirty ? 1 : 0.4, cursor: isDirty ? 'pointer' : 'not-allowed' }}
        >
          {saving ? t.saving : t.save}
        </button>
      </div>
    </form>
  );
}
