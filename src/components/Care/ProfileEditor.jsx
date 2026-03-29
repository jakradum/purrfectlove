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
    maxCats: data.maxCats ?? '',
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

  const olc = new OpenLocationCode();

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm.current);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveError('');
  };

  const handleLocationChange = (raw) => {
    setLocationInput(raw);
    const trimmed = raw.trim();
    if (!trimmed) { update('location', null); return; }

    const token = trimmed.split(/\s+/)[0];
    if (token.includes('+') && olc.isValid(token) && olc.isFull(token)) {
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
    // Short code or plain text — server will resolve coords on save
    update('location', { name: trimmed });
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
          maxCats: form.maxCats !== '' ? Number(form.maxCats) : undefined,
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
        <div className={styles.profileHeader}>
          <div>
            <Link href="/" className={styles.backLink}>← Back to network</Link>
            <h1 className={styles.pageTitle}>{form.name || 'My Profile'}</h1>
          </div>
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
              <span className={styles.readFieldValue} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {initialData.email}
                <button
                  type="button"
                  className={styles.btnSecondary}
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', marginTop: 0 }}
                  onClick={() => navigator.clipboard.writeText(initialData.email)}
                >
                  Copy
                </button>
              </span>
            </div>
          )}
          {initialData.phone && (
            <div className={styles.readField}>
              <span className={styles.readFieldLabel}>Phone</span>
              <span className={styles.readFieldValue} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {initialData.phone}
                <button
                  type="button"
                  className={styles.btnSecondary}
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', marginTop: 0 }}
                  onClick={() => navigator.clipboard.writeText(initialData.phone)}
                >
                  Copy
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
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Location</h2>
        <div className={styles.formGroup}>
          <label className={styles.profileLabel}>Plus Code or Area</label>
          <input
            type="text"
            className={styles.profileInput}
            value={locationInput}
            onChange={(e) => handleLocationChange(e.target.value)}
            placeholder="e.g. VHQ2+FH Bengaluru"
          />
          {form.location?.lat != null && (
            <p className={styles.hint} style={{ fontFamily: 'monospace' }}>
              📍 {form.location.lat}, {form.location.lng}
            </p>
          )}
          {form.location?.name && form.location.lat == null && (
            <p className={styles.hint}>Coordinates will be resolved when you save.</p>
          )}
        </div>
        <details className={styles.infoBlurb}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>What is a Plus Code?</summary>
          <p style={{ marginTop: '0.5rem' }}>It&apos;s a short address Google Maps uses for any location. To get yours:</p>
          <ol style={{ margin: '0.5rem 0 0 1.2rem', padding: 0, lineHeight: 1.8 }}>
            <li>Open <strong>Google Maps</strong> on your phone</li>
            <li>Long-press on your building/area to drop a pin</li>
            <li>Tap the pin info at the bottom — the Plus Code appears (e.g. <em>VHQ2+FH</em>)</li>
            <li>Tap the Plus Code → tap <strong>Copy</strong>, then paste it here with the city name</li>
          </ol>
          <p style={{ marginTop: '0.5rem' }}>A full Plus Code (like <em>7J4VVHQ2+FH</em>) auto-fills coordinates instantly. A short code with city (like <em>VHQ2+FH Bengaluru</em>) is resolved when you save.</p>
        </details>
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
        <h2 className={styles.sectionTitle}>{t.sections.myCats}</h2>
        {form.cats.map((cat, idx) => (
          <div key={idx} className={styles.catCard}>
            <div className={styles.catCardHeader}>
              <span className={styles.catCardTitle}>{cat.name || `Cat ${idx + 1}`}</span>
              <button type="button" className={styles.removeBtnSmall} onClick={() => removeCat(idx)}>{t.fields.removeCat}</button>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.formGroup}>
                <label className={styles.profileLabel}>{t.fields.catName}</label>
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
            <p className={styles.hint}>Dates when you are NOT available (one per line)</p>
            <textarea
              className={styles.profileTextarea}
              value={(form.unavailableDates || []).join('\n')}
              onChange={(e) => update('unavailableDates', e.target.value.split('\n').map((d) => d.trim()).filter(Boolean))}
              placeholder="YYYY-MM-DD"
              rows={4}
            />
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
          <label className={styles.profileLabel}>{t.fields.maxCats}</label>
          <input type="number" min={1} max={20} className={styles.profileInput} value={form.maxCats} onChange={(e) => update('maxCats', e.target.value)} placeholder="e.g. 2" style={{ maxWidth: '140px' }} />
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
