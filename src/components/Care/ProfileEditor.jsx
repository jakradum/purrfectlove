'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Care.module.css';
import contentEN from '@/data/careContent.en.json';
import contentDE from '@/data/careContent.de.json';
import AvailabilityCalendar from './AvailabilityCalendar';
import SitterProfile from './SitterProfile';

const AVATAR_BG = {
  'whisker-cream': '#F6F4F0',
  'paw-pink':      '#F5D5C8',
  'hunter-green':  '#2C5F4F',
  'tabby-brown':   '#C85C3F',
};

const LocationMapPicker = dynamic(() => import('./LocationMapPicker'), {
  ssr: false,
  loading: () => <div style={{ height: '320px', background: '#f5f5f3', borderRadius: '8px' }} />,
});

const DIET_OPTIONS = ['wet', 'dry', 'medication', 'special diet'];
const FEEDING_OPTIONS = ['wet', 'dry', 'medication', 'special diet'];

// Grouped trait definitions — shared for cat personality and sitter "comfortable with"
const TRAIT_GROUPS = [
  { label: 'Temperament', options: ['shy', 'confident', 'gentle', 'playful', 'independent'] },
  { label: 'Social', options: ['good_with_cats', 'prefers_solo', 'good_with_kids'] },
  { label: 'Care needs', options: ['senior', 'special_needs', 'on_medication', 'indoor_only'] },
];
// All 12 traits flat
const ALL_TRAITS = TRAIT_GROUPS.flatMap(g => g.options);
// Cat personality: senior excluded (auto-calculated from age ≥ 10)
const PERSONALITY_GROUPS = TRAIT_GROUPS.map(g => ({
  ...g,
  options: g.options.filter(o => o !== 'senior'),
}));

const TRAIT_LABELS = {
  shy: 'Shy', confident: 'Confident', gentle: 'Gentle', playful: 'Playful', independent: 'Independent',
  good_with_cats: 'Good with other cats', prefers_solo: 'Prefers to be only cat', good_with_kids: 'Good with kids',
  senior: 'Senior (10+ yrs)', special_needs: 'Special needs', on_medication: 'On medication', indoor_only: 'Indoor only',
};

const TAG_LABELS = {
  ...TRAIT_LABELS,
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
    if (!form.canDoHomeVisit && !form.canHostCats) required.push('How I can sit (select at least one)');
    if (form.canDoHomeVisit && !form.maxHomesPerDay) required.push('Homes you can visit per day');
    if (form.canHostCats && !form.maxCatsPerDay) required.push('Max cats per day');
    if (!form.feedingTypes?.length) required.push('Feeding types you can handle');
    if (!form.behavioralTraits?.length) required.push('Cat behaviors you\'re comfortable with');
    // Availability is optional in new system — all days available by default
  }

  if (!form.bedrooms) optional.push('Number of bedrooms');
  if (!form.householdSize) optional.push('Household size');

  // totalRequired is dynamic based on which sit types are selected
  let totalRequired = 2; // name + location
  if (form.canSit) {
    totalRequired += 1; // sit type selection
    if (form.canDoHomeVisit) totalRequired += 1; // maxHomesPerDay
    if (form.canHostCats) totalRequired += 1; // maxCatsPerDay
    totalRequired += 2; // feedingTypes + behavioralTraits
  }
  const totalOptional = 2;
  const total = totalRequired + totalOptional;
  const completed = (totalRequired - required.length) + (totalOptional - optional.length);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 100;

  return { required, optional, completed, total, percent, isComplete: required.length === 0 };
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

function GroupedCheckboxGroup({ groups, value = [], onChange, labelMap }) {
  const toggle = (opt) => {
    const current = value || [];
    onChange(current.includes(opt) ? current.filter((v) => v !== opt) : [...current, opt]);
  };
  return (
    <div className={styles.traitGrid}>
      {groups.map((group) => (
        <div key={group.label} className={styles.traitGroup}>
          <div className={styles.traitGroupLabel}>{group.label}</div>
          <div className={styles.checkboxGroup}>
            {group.options.map((opt) => (
              <label key={opt} className={styles.checkboxLabel}>
                <input type="checkbox" checked={(value || []).includes(opt)} onChange={() => toggle(opt)} />
                {labelMap ? labelMap[opt] || opt : opt}
              </label>
            ))}
          </div>
        </div>
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
    // New availability system
    availabilityDefault: data.availabilityDefault || 'available',
    unavailableDatesV2: data.unavailableDatesV2 || [],
    // Legacy fields kept so old data still renders correctly
    alwaysAvailable: data.alwaysAvailable ?? false,
    unavailableDates: data.unavailableDates || [],
    unavailableRanges: data.unavailableRanges || [],
    availableDates: data.availableDates || [],
    maxHomesPerDay: data.maxHomesPerDay ?? '',
    maxCatsPerDay: data.maxCatsPerDay ?? '',
    feedingTypes: data.feedingTypes || [],
    behavioralTraits: data.behavioralTraits || [],
    canSit: data.canSit ?? false,
    canDoHomeVisit: data.canDoHomeVisit ?? false,
    canHostCats: data.canHostCats ?? false,
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
    ...TRAIT_LABELS,
    wet: tags.wet, dry: tags.dry, medication: tags.medication, 'special diet': tags.specialDiet,
  };

  const savedForm = useRef(formFromData(initialData));
  const [form, setForm] = useState(formFromData(initialData));
  // editMode: null = read, 'profile' = full profile edit, 'availability' = availability only
  const [editMode, setEditMode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [privacySaving, setPrivacySaving] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionSubmitting, setDeletionSubmitting] = useState(false);
  const [deletionDone, setDeletionDone] = useState(false);
  const [newsletterOptOut, setNewsletterOptOut] = useState(!!initialData.newsletterOptOut);
  const [newsletterSaving, setNewsletterSaving] = useState(false);
  const [notifEmailMessage, setNotifEmailMessage] = useState(initialData.notifEmailMessage !== false);
  const [notifEmailSitRequest, setNotifEmailSitRequest] = useState(initialData.notifEmailSitRequest !== false);
  const [photoUrl, setPhotoUrl] = useState(initialData.photoUrl || null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef(null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [blockedDatesLoading, setBlockedDatesLoading] = useState(false);
  // Tracks dates the sitter overrode this edit session; used to compute blockedByBooking on save.
  // A ref (not state) so it doesn't trigger re-renders and survives across onChange calls.
  const overriddenDatesRef = useRef(new Set());

  useEffect(() => {
    if (editMode !== 'availability') return;
    // Reset overrides on each edit-mode entry — fresh session, fresh computation.
    overriddenDatesRef.current = new Set();
    setBlockedDatesLoading(true);
    fetch('/api/care/bookings/blocked-dates')
      .then(r => r.json())
      .then(d => { if (d.blockedDates) setBlockedDates(d.blockedDates); })
      .catch(() => {/* silent — calendar works without blocked dates */})
      .finally(() => setBlockedDatesLoading(false));
  }, [editMode]);

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

  const handlePhotoClick = () => {
    if (!photoUploading) photoInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch('/api/care/upload-photo', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setPhotoUrl(data.photoUrl);
      }
    } catch { /* silent */ }
    setPhotoUploading(false);
    e.target.value = '';
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
          maxCatsPerDay: form.maxCatsPerDay !== '' ? Number(form.maxCatsPerDay) : undefined,
          cats: form.cats.map((cat) => ({
            _key: cat._key || Math.random().toString(36).slice(2, 14),
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
      setEditMode(null);
      router.refresh();
    } catch {
      setSaveError(t.errors.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(savedForm.current);
    setSaveError('');
    setEditMode(null);
  };

  const handleSaveAvailability = async () => {
    setSaving(true);
    setSaveError('');
    try {
      // Compute blockedByBooking = freshly fetched server-blocked dates minus any the sitter
      // overrode this session. Running on every save (not just when overrides exist) ensures
      // the stored value stays correct even across multiple save/re-entry cycles.
      const updatedBlockedByBooking = blockedDates.filter(d => !overriddenDatesRef.current.has(d));

      const res = await fetch('/api/care/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canSit: form.canSit,
          availabilityDefault: form.availabilityDefault,
          unavailableDatesV2: form.unavailableDatesV2,
          blockedByBooking: updatedBlockedByBooking,
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
      setEditMode(null);
      router.refresh();
    } catch {
      setSaveError(t.errors.saveFailed);
    } finally {
      setSaving(false);
    }
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
  const addCat = () => update('cats', [...form.cats, { _key: Math.random().toString(36).slice(2, 14), name: '', age: '', personality: [], diet: [] }]);
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
  if (editMode === null) {
    const deletionPending = !!initialData.deletionRequested;
    const sitterForView = {
      _id: initialData._id,
      _createdAt: initialData._createdAt,
      name: form.name,
      location: form.location || initialData.location,
      bio: form.bio,
      email: initialData.email,
      phone: initialData.phone,
      hideEmail: form.hideEmail ?? initialData.hideEmail,
      hideWhatsApp: form.hideWhatsApp ?? initialData.hideWhatsApp,
      cats: form.cats,
      feedingTypes: form.feedingTypes,
      behavioralTraits: form.behavioralTraits,
      availabilityDefault: form.availabilityDefault,
      unavailableDatesV2: form.unavailableDatesV2,
      avatarColour: initialData.avatarColour,
      photoUrl: photoUrl,
      coverImageUrl: initialData.coverImageUrl,
      identityVerified: initialData.identityVerified,
      trustedSitter: initialData.trustedSitter,
    };
    return (
      <div>
        {deletionPending && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem', color: '#b91c1c', fontSize: '0.9rem', lineHeight: 1.6 }}>
            <strong>Your deletion request is pending.</strong> Your account will be removed within 48 hours. You cannot use the community during this time.
          </div>
        )}
        {!deletionPending && (
          <div style={{ maxWidth: 600, margin: '0 auto', padding: '2.5rem 1rem 1.25rem' }}>
            <CompletionIndicator form={form} onEdit={() => setEditMode('profile')} />
          </div>
        )}
        <SitterProfile
          sitter={sitterForView}
          isOwnProfile={true}
          onEdit={!deletionPending ? () => setEditMode('profile') : undefined}
          onEditAvailability={!deletionPending ? () => setEditMode('availability') : undefined}
          onAvatarClick={!deletionPending ? handlePhotoClick : undefined}
          photoUploading={photoUploading}
        />
        <div style={{ textAlign: 'center', padding: '0.5rem 1rem 2rem' }}>
          <a href="/profile/privacy" style={{ fontSize: '0.78rem', color: 'var(--hunter-green)', textDecoration: 'none', fontWeight: 600, opacity: 0.7 }}>
            How we protect your data ↗
          </a>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
        />
      </div>
    );
  }

  // ── AVAILABILITY EDIT MODE ────────────────────────────────────────────────
  if (editMode === 'availability') {
    return (
      <div className={styles.sitterProfilePage}>
        <button
          type="button"
          onClick={() => setEditMode(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--hunter-green)', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-outfit)', marginBottom: '1.5rem', padding: 0 }}
        >
          ← Back to profile
        </button>
        <div className={styles.sitterSection}>
          <div className={styles.sitterSectionTitle}>Edit availability</div>
          <div style={{ marginBottom: '1.25rem' }}>
            <Toggle checked={form.canSit} onChange={(v) => update('canSit', v)} label="List me as available to sit" />
            <p className={styles.hint} style={{ marginTop: '0.4rem' }}>Turns your profile on or off in the sitter search.</p>
          </div>
          {blockedDatesLoading ? (
            <div style={{ color: '#999', fontSize: '0.875rem', padding: '1rem 0' }}>Loading calendar…</div>
          ) : (
            <AvailabilityCalendar
              markedDates={form.unavailableDatesV2}
              availabilityDefault={form.availabilityDefault}
              onChange={(dates) => update('unavailableDatesV2', dates)}
              onDefaultChange={(val) => { update('availabilityDefault', val); update('unavailableDatesV2', []); }}
              onOverride={(ymd) => { overriddenDatesRef.current = new Set([...overriddenDatesRef.current, ymd]); }}
              blockedDates={blockedDates}
            />
          )}
          <div className={styles.saveBar} style={{ marginTop: '1rem' }}>
            {saveError && <span className={styles.saveError}>{saveError}</span>}
            <button type="button" className={styles.cancelBtnText} onClick={handleCancel}>Cancel</button>
            <button type="button" className={styles.saveBtn} onClick={handleSaveAvailability} disabled={saving}>
              {saving ? t.saving : t.save}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PROFILE EDIT MODE ──────────────────────────────────────────────────────
  return (
    <form className={styles.profilePage} onSubmit={handleSave}>
      <div className={styles.profileHeader}>
        <h1 className={styles.pageTitle}>Edit Profile</h1>
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
        <LocationMapPicker
          value={form.location}
          onChange={(loc) => update('location', loc)}
          locale={initialData.locale}
        />
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
        <p className={styles.hint} style={{ marginBottom: '0.75rem' }}>Helps sitters understand your space before accepting a request.</p>
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
        <p className={styles.hint} style={{ marginBottom: '0.75rem' }}>Sitters check this to see if they can handle your cats&apos; needs before accepting.</p>
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
              <GroupedCheckboxGroup groups={PERSONALITY_GROUPS} value={cat.personality || []} onChange={(v) => updateCat(idx, 'personality', v)} labelMap={tagMap} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.profileLabel}>{t.fields.catDiet}</label>
              <CheckboxGroup options={DIET_OPTIONS} value={cat.diet || []} onChange={(v) => updateCat(idx, 'diet', v)} labelMap={tagMap} />
            </div>
          </div>
        ))}
        <button type="button" className={styles.addBtn} onClick={addCat}>{t.fields.addCat}</button>
      </div>

      {/* Sitting Capabilities — shown only when canSit is on */}
      {form.canSit && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.sections.sittingCapabilities}</h2>

          {/* How I can sit */}
          <div className={styles.formGroup}>
            <label className={styles.profileLabel}>How I can sit</label>

            {/* Home visits */}
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#2D2D2D' }}>
                <input
                  type="checkbox"
                  checked={!!form.canDoHomeVisit}
                  onChange={(e) => update('canDoHomeVisit', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#2C5F4F', cursor: 'pointer' }}
                />
                Home visits <span style={{ color: '#888', fontWeight: 400 }}>(I travel to the cat&apos;s home)</span>
              </label>
              {form.canDoHomeVisit && (
                <div style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                  <label className={styles.profileLabel} style={{ fontSize: '0.8rem' }}>{t.fields.maxHomesPerDay}</label>
                  <input
                    type="number" min={1} max={10}
                    className={styles.profileInput}
                    value={form.maxHomesPerDay}
                    onChange={(e) => update('maxHomesPerDay', e.target.value)}
                    placeholder="e.g. 2"
                    style={{ maxWidth: '120px' }}
                  />
                  <p className={styles.hint}>Homes you can visit in a single day</p>
                </div>
              )}
            </div>

            {/* Host cats */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#2D2D2D' }}>
                <input
                  type="checkbox"
                  checked={!!form.canHostCats}
                  onChange={(e) => update('canHostCats', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#2C5F4F', cursor: 'pointer' }}
                />
                Host cats at my place <span style={{ color: '#888', fontWeight: 400 }}>(cat parents drop off with me)</span>
              </label>
              {form.canHostCats && (
                <div style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                  <label className={styles.profileLabel} style={{ fontSize: '0.8rem' }}>Max cats per day</label>
                  <input
                    type="number" min={1} max={10}
                    className={styles.profileInput}
                    value={form.maxCatsPerDay}
                    onChange={(e) => update('maxCatsPerDay', e.target.value)}
                    placeholder="e.g. 3"
                    style={{ maxWidth: '120px' }}
                  />
                  <p className={styles.hint}>Maximum cats you&apos;re comfortable hosting per day</p>
                </div>
              )}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.profileLabel}>{t.fields.feedingTypes}</label>
            <CheckboxGroup options={FEEDING_OPTIONS} value={form.feedingTypes} onChange={(v) => update('feedingTypes', v)} labelMap={tagMap} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.profileLabel}>{t.fields.behavioralTraits}</label>
            <GroupedCheckboxGroup groups={TRAIT_GROUPS} value={form.behavioralTraits} onChange={(v) => update('behavioralTraits', v)} labelMap={tagMap} />
          </div>
        </div>
      )}

      {/* Contact Privacy */}
      <div className={styles.section}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Contact Privacy</h2>
          <a href="/profile/privacy" style={{ fontSize: '0.78rem', color: 'var(--hunter-green)', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>How we protect your data ↗</a>
        </div>
        <p className={styles.hint} style={{ marginBottom: '1rem' }}>Shared only with confirmed booking partners 2 days before the sit.</p>
        <div className={styles.formGroup}>
          <label className={styles.profileLabel}>Email</label>
          <div className={styles.contactFilterGroup}>
            <label className={styles.contactFilterOption}>
              <input type="radio" name="hideEmail" value="show" checked={!form.hideEmail} onChange={() => update('hideEmail', false)} />
              Visible
            </label>
            <label className={styles.contactFilterOption}>
              <input type="radio" name="hideEmail" value="hide" checked={!!form.hideEmail} onChange={() => update('hideEmail', true)} />
              Hidden
            </label>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.profileLabel}>WhatsApp / Phone</label>
          <div className={styles.contactFilterGroup}>
            <label className={styles.contactFilterOption}>
              <input type="radio" name="hideWhatsApp" value="show" checked={!form.hideWhatsApp} onChange={() => update('hideWhatsApp', false)} />
              Visible
            </label>
            <label className={styles.contactFilterOption}>
              <input type="radio" name="hideWhatsApp" value="hide" checked={!!form.hideWhatsApp} onChange={() => update('hideWhatsApp', true)} />
              Hidden
            </label>
          </div>
        </div>
      </div>

      {/* Save Bar */}
      <div className={styles.saveBar}>
        {saveError && <span className={styles.saveError}>{saveError}</span>}
        <button type="button" className={styles.cancelBtnText} onClick={handleCancel}>Cancel</button>
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
