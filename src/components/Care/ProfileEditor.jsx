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

// Grouped trait definitions — EN
const TRAIT_GROUPS = [
  { label: 'Temperament', options: ['shy', 'confident', 'gentle', 'playful', 'independent'] },
  { label: 'Care needs', options: ['senior', 'special_needs', 'on_medication', 'indoor_only'] },
];
// DE uses different temperament traits
const TRAIT_GROUPS_DE = [
  { label: 'Temperament', options: ['shy', 'gentle', 'playful', 'curious', 'calm', 'rather_independent'] },
  { label: 'Pflege', options: ['senior', 'special_needs', 'on_medication', 'indoor_only'] },
];
// Cat personality: senior excluded (auto-calculated from age ≥ 10)
const PERSONALITY_GROUPS = TRAIT_GROUPS.map(g => ({
  ...g,
  options: g.options.filter(o => o !== 'senior'),
}));
const PERSONALITY_GROUPS_DE = TRAIT_GROUPS_DE.map(g => ({
  ...g,
  options: g.options.filter(o => o !== 'senior'),
}));

const TRAIT_LABELS = {
  shy: 'Shy', confident: 'Confident', gentle: 'Gentle', playful: 'Playful', independent: 'Independent',
  curious: 'Curious', calm: 'Calm', rather_independent: 'Rather independent',
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

  if (!form.name?.trim()) required.push('Display name');
  if (!form.location?.lat || !form.location?.lng) required.push('Location');

  if (form.canSit) {
    if (!form.canDoHomeVisit && !form.canHostCats) required.push('How I can sit (select at least one)');
    // maxHomesPerDay hidden for now — not required
    if (form.canHostCats && !form.maxCatsPerDay) required.push('Max cats per day');
    if (!form.feedingTypes?.length) required.push('Feeding types you can handle');
    if (!form.behavioralTraits?.length) required.push('Cat behaviors you\'re comfortable with');
  }

  let total = 2; // name + location
  if (form.canSit) {
    total += 1; // sit type selection
    if (form.canDoHomeVisit) total += 1;
    if (form.canHostCats) total += 1;
    total += 2; // feedingTypes + behavioralTraits
  }
  const completed = total - required.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 100;

  return { required, completed, total, percent, isComplete: required.length === 0 };
}

function CompletionIndicator({ form, onEdit }) {
  const { required, completed, total, percent, isComplete } = computeCompletion(form);
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

      {required.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c0392b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Required</p>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', listStyle: 'disc' }}>
            {required.map((f) => (
              <li key={f} style={{ fontSize: '0.82rem', color: '#c0392b', lineHeight: 1.7 }}>{f}</li>
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

function Toggle({ checked, onChange, label, labelOn, labelOff }) {
  const text = labelOn && labelOff ? (checked ? labelOn : labelOff) : label;
  return (
    <div className={styles.switchRow}>
      <label className={styles.toggle}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={styles.toggleSlider} />
      </label>
      <span className={styles.switchLabel}>{text}</span>
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

const TRAIT_ALLOWED = /^[a-zA-Z0-9 '-]+$/;
const blockNonInteger = (e) => { if (['.', '-', 'e', 'E', '+'].includes(e.key)) e.preventDefault(); };

function CustomTraitInput({ value = [], onChange }) {
  const [input, setInput] = useState('');
  const [traitError, setTraitError] = useState('');
  const addTrait = () => {
    const trimmed = input.trim();
    if (!trimmed) { setInput(''); setTraitError(''); return; }
    if (!TRAIT_ALLOWED.test(trimmed)) { setTraitError('Only letters, numbers, spaces, hyphens, and apostrophes allowed.'); return; }
    if (value.includes(trimmed)) { setInput(''); setTraitError(''); return; }
    onChange([...value, trimmed]);
    setInput('');
    setTraitError('');
  };
  const removeTrait = (t) => onChange(value.filter(v => v !== t));
  return (
    <div>
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
          {value.map(t => (
            <span key={t} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.2rem 0.6rem', background: 'rgba(44,95,79,0.1)',
              color: 'var(--hunter-green)', borderRadius: '20px', fontSize: '0.8rem',
              border: '1px solid rgba(44,95,79,0.25)',
            }}>
              {t}
              <button
                type="button"
                onClick={() => removeTrait(t)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: 'var(--hunter-green)', fontSize: '0.9rem' }}
                aria-label={`Remove ${t}`}
              >×</button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setTraitError(''); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTrait(); } }}
          placeholder="e.g. Loves chin scratches"
          style={{
            flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.83rem',
            border: '1px solid rgba(44,95,79,0.25)', borderRadius: '6px',
            fontFamily: 'var(--font-outfit)', outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={addTrait}
          style={{
            padding: '0.4rem 0.75rem', background: 'var(--hunter-green)', color: '#fff',
            border: 'none', borderRadius: '6px', fontSize: '0.83rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-outfit)', whiteSpace: 'nowrap',
          }}
        >
          Add
        </button>
      </div>
      {traitError && <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#c0392b' }}>{traitError}</p>}
    </div>
  );
}

function VaxxDropZone({ busy, onFile, onClickUpload, vaxxDate, onDateChange }) {
  const [dragging, setDragging] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragging(false);
          const f = e.dataTransfer.files?.[0]; if (f) onFile(f);
        }}
        style={{
          border: `2px dashed ${dragging ? '#2C5F4F' : 'rgba(44,95,79,0.28)'}`,
          borderRadius: 10, padding: '1.4rem 1rem', textAlign: 'center',
          background: dragging ? 'rgba(44,95,79,0.06)' : '#fafaf8',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke={dragging ? '#2C5F4F' : '#bbb'} strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ display: 'block', margin: '0 auto 0.55rem' }}
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p style={{ margin: '0 0 0.65rem', fontSize: '0.82rem', color: dragging ? '#2C5F4F' : '#777', fontWeight: dragging ? 600 : 400, lineHeight: 1.4 }}>
          {dragging ? 'Drop to upload' : 'Drag & drop your vaccination record here'}
        </p>
        <button
          type="button" disabled={busy} onClick={onClickUpload}
          style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', background: 'var(--hunter-green)', border: 'none', borderRadius: '6px', padding: '0.4rem 1rem', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-outfit)', opacity: busy ? 0.6 : 1 }}
        >
          {busy ? 'Uploading…' : 'Upload from device'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          type="date" value={vaxxDate || ''}
          onChange={e => onDateChange(e.target.value)}
          style={{ fontSize: '0.83rem', padding: '0.35rem 0.5rem', border: '1px solid rgba(44,95,79,0.25)', borderRadius: '6px', fontFamily: 'var(--font-outfit)', color: '#555' }}
        />
        <span style={{ fontSize: '0.75rem', color: '#aaa' }}>Vaccination date (optional)</span>
      </div>
      <p style={{ margin: 0, fontSize: '0.75rem', color: '#aaa' }}>Upload at least one vaccination record from the last 3 years</p>
    </div>
  );
}

function VaxxReplaceZone({ busy, onFile, children }) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      tabIndex={0}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault(); setDragging(false);
        const f = e.dataTransfer.files?.[0]; if (f) onFile(f);
      }}
      style={{
        borderRadius: 8, padding: '0.5rem 0.6rem',
        border: `2px dashed ${dragging ? '#2C5F4F' : 'transparent'}`,
        background: dragging ? 'rgba(44,95,79,0.05)' : 'transparent',
        transition: 'border-color 0.15s, background 0.15s',
        position: 'relative', outline: 'none',
      }}
    >
      {dragging && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)', borderRadius: 6, zIndex: 1, pointerEvents: 'none' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2C5F4F' }}>Drop to replace</span>
        </div>
      )}
      {children}
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
    cats: (data.cats || []).map(c => ({ ...c, customTraits: c.customTraits || [] })),
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
    phone: data.phone || '',
  };
}

export default function ProfileEditor({ initialData, locale = 'en' }) {
  const t = locale === 'de' ? contentDE.profile : contentEN.profile;
  const lp = t.locationPicker;
  const tags = t.tags;
  const router = useRouter();

  const tagMap = {
    ...tags,                         // all trait codes → locale labels
    'special diet': tags.specialDiet, // key has a space; JSON key is camelCase
  };

  const savedForm = useRef(formFromData(initialData));
  const [form, setForm] = useState(formFromData(initialData));
  // editMode: null = read, 'profile' = full profile edit, 'availability' = availability only
  const [editMode, setEditMode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [availSaved, setAvailSaved] = useState(false);
  const [pendingDefaultChange, setPendingDefaultChange] = useState(null);
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
  const [photoError, setPhotoError] = useState('');
  const photoInputRef = useRef(null);

  // Vaccination records — keyed by cat._key, managed by upload-vaxx route (not general profile save)
  const [vaxxRecords, setVaxxRecords] = useState(() => {
    const map = {}
    for (const cat of initialData.cats || []) {
      if (cat._key) map[cat._key] = cat.vaccinationRecord?.fileUrl ? cat.vaccinationRecord : null
    }
    return map
  })
  const [vaxxUploading, setVaxxUploading] = useState({})
  const [vaxxRemoving, setVaxxRemoving] = useState({})
  const [vaxxDirty, setVaxxDirty] = useState(false)
  const [vaxxDates, setVaxxDates] = useState({})
  const vaxxInputRefs = useRef({})
  const [focusCatVaxx, setFocusCatVaxx] = useState(null) // catIndex to scroll to
  const [blockedDates, setBlockedDates] = useState([]);
  const [blockedDatesLoading, setBlockedDatesLoading] = useState(false);
  // Tracks dates the sitter overrode this edit session; used to compute blockedByBooking on save.
  // A ref (not state) so it doesn't trigger re-renders and survives across onChange calls.
  const overriddenDatesRef = useRef(new Set());

  // locationPickerOpen: true = show picker, false = show confirmation (if location already set)
  const [locationPickerOpen, setLocationPickerOpen] = useState(!initialData.location?.lat);

  // If URL contains ?edit=availability or ?edit=location, jump into the right mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit') === 'availability') {
      setEditMode('availability');
      router.replace('/care/profile', { scroll: false });
    } else if (params.get('edit') === 'location') {
      setEditMode('profile');
      setLocationPickerOpen(true);
      router.replace('/care/profile', { scroll: false });
    } else if (params.get('edit') === 'cat' && params.get('section') === 'vaccination') {
      const idx = parseInt(params.get('catIndex') || '0', 10);
      setEditMode('profile');
      setFocusCatVaxx(isNaN(idx) ? 0 : idx);
      router.replace('/care/profile', { scroll: false });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editMode !== 'profile' || focusCatVaxx === null) return;
    const el = document.getElementById(`cat-vaxx-${focusCatVaxx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFocusCatVaxx(null);
  }, [editMode, focusCatVaxx]);

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

  const isDirty = vaxxDirty || JSON.stringify(form) !== JSON.stringify(savedForm.current);

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
    setPhotoError('');
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch('/api/care/upload-photo', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setPhotoUrl(data.photoUrl);
      } else {
        setPhotoError(data.error || 'Upload failed. Please try again.');
      }
    } catch {
      setPhotoError('Upload failed. Please check your connection and try again.');
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };


  const handleVaxxUpload = async (catKey, file) => {
    setVaxxUploading(prev => ({ ...prev, [catKey]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('catKey', catKey);
      const date = vaxxDates[catKey] || '';
      if (date) fd.append('date', date);
      const res = await fetch('/api/care/upload-vaxx', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        setVaxxRecords(prev => ({ ...prev, [catKey]: { fileUrl: data.fileUrl, fileName: data.fileName, date: data.date || null } }));
        setVaxxDirty(true);
      }
    } catch { /* silent */ }
    setVaxxUploading(prev => ({ ...prev, [catKey]: false }));
  };

  const handleVaxxRemove = async (catKey) => {
    setVaxxRemoving(prev => ({ ...prev, [catKey]: true }));
    try {
      const res = await fetch(`/api/care/upload-vaxx?catKey=${encodeURIComponent(catKey)}`, { method: 'DELETE' });
      if (res.ok) {
        setVaxxRecords(prev => ({ ...prev, [catKey]: null }));
        setVaxxDates(prev => ({ ...prev, [catKey]: '' }));
        setVaxxDirty(true);
      }
    } catch { /* silent */ }
    setVaxxRemoving(prev => ({ ...prev, [catKey]: false }));
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
          cats: form.cats.map(({ vaccinationRecord: _vaxx, ...cat }) => ({
            _key: cat._key || Math.random().toString(36).slice(2, 14),
            ...cat,
            customTraits: cat.customTraits || [],
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
      setVaxxDirty(false);
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
      setAvailSaved(true);
      setTimeout(() => { setAvailSaved(false); setEditMode(null); router.refresh(); }, 1500);
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
  const addCat = () => update('cats', [...form.cats, { _key: Math.random().toString(36).slice(2, 14), name: '', age: '', personality: [], diet: [], customTraits: [] }]);
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
      locationName: form.location?.displayName || initialData.locationName || null,
      bio: form.bio,
      email: initialData.email,
      phone: form.phone || initialData.phone,
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
      canSit: initialData.canSit,
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
          locale={locale}
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
        {photoError && (
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#c0392b', margin: '0.5rem 0 0', padding: '0 1rem' }}>{photoError}</p>
        )}
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
          {pendingDefaultChange && (
            <div className={styles.availSwitchWarn}>
              <p>Switching modes will clear your {form.unavailableDatesV2.length} selected date{form.unavailableDatesV2.length !== 1 ? 's' : ''}. Continue?</p>
              <div className={styles.availSwitchWarnBtns}>
                <button type="button" onClick={() => setPendingDefaultChange(null)}>Cancel</button>
                <button type="button" onClick={() => {
                  update('availabilityDefault', pendingDefaultChange);
                  update('unavailableDatesV2', []);
                  setPendingDefaultChange(null);
                }}>Switch anyway</button>
              </div>
            </div>
          )}
          {blockedDatesLoading ? (
            <div style={{ color: '#999', fontSize: '0.875rem', padding: '1rem 0' }}>Loading calendar…</div>
          ) : (
            <AvailabilityCalendar
              markedDates={form.unavailableDatesV2}
              availabilityDefault={form.availabilityDefault}
              onChange={(dates) => update('unavailableDatesV2', dates)}
              onDefaultChange={(val) => {
                if (form.unavailableDatesV2.length > 0) {
                  setPendingDefaultChange(val);
                } else {
                  update('availabilityDefault', val);
                }
              }}
              onOverride={(ymd) => { overriddenDatesRef.current = new Set([...overriddenDatesRef.current, ymd]); }}
              blockedDates={blockedDates}
            />
          )}
          <div className={styles.saveBar} style={{ marginTop: '1rem' }}>
            {saveError && <span className={styles.saveError}>{saveError}</span>}
            <button type="button" className={styles.cancelBtnText} onClick={handleCancel}>Cancel</button>
            <button type="button" className={styles.saveBtn} onClick={handleSaveAvailability} disabled={saving || availSaved}>
              {saving ? t.saving : availSaved ? '✓ Saved' : t.save}
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
          <textarea className={styles.profileTextarea} value={form.bio} onChange={(e) => update('bio', e.target.value.slice(0, 250))} placeholder="I've been owned by cats for years. Ask me about the time my cat..." rows={4} maxLength={250} />
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
        {form.location?.lat && !locationPickerOpen ? (
          <div>
            <div className={styles.locationConfirmed}>
              <span className={styles.locationConfirmedCheck}>✓</span>
              <span>
                {lp.confirmed}
                {form.location.displayName ? ` — ${form.location.displayName}` : ''}
              </span>
            </div>
            <LocationMapPicker
              value={form.location}
              onChange={() => {}}
              locale={locale}
              readOnly
            />
            <button
              type="button"
              className={styles.locationUpdateLink}
              onClick={() => setLocationPickerOpen(true)}
              style={{ marginTop: '0.75rem' }}
            >
              {lp.changeLocation}
            </button>
          </div>
        ) : (
          <LocationMapPicker
            value={form.location}
            onChange={(loc) => { update('location', loc); if (loc?.lat) setLocationPickerOpen(false); }}
            locale={locale}
          />
        )}
      </div>

      {/* Account Info */}
      <div className={styles.section}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>{t.sections.account}</h2>
          <a href="/profile/privacy" style={{ fontSize: '0.78rem', color: 'var(--hunter-green)', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>How we protect your data ↗</a>
        </div>
        <p className={styles.hint} style={{ marginBottom: '0.75rem' }}>Shared only with confirmed booking partners 2 days before the sit.</p>
        <div className={styles.fieldRow}>
          <div className={styles.formGroup}>
            <label className={styles.profileLabel}>Email</label>
            <input className={styles.profileInput} value={initialData.email || ''} disabled style={{ cursor: 'not-allowed', opacity: 0.6 }} />
            <div style={{ marginTop: '0.5rem' }}>
              <Toggle checked={!form.hideEmail} onChange={(v) => update('hideEmail', !v)} labelOn="Visible to booking partner" labelOff="Not visible to booking partner" />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.profileLabel}>Phone</label>
            <input className={styles.profileInput} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+1 555 000 0000" />
            <div style={{ marginTop: '0.5rem' }}>
              <Toggle checked={!form.hideWhatsApp} onChange={(v) => update('hideWhatsApp', !v)} labelOn="Visible to booking partner" labelOff="Not visible to booking partner" />
            </div>
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
            <input type="number" min={0} max={20} className={styles.profileInput} value={form.bedrooms} onChange={(e) => update('bedrooms', e.target.value)} onKeyDown={blockNonInteger} placeholder="e.g. 2" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.profileLabel}>{t.fields.householdSize}</label>
            <input type="number" min={1} max={20} className={styles.profileInput} value={form.householdSize} onChange={(e) => update('householdSize', e.target.value)} onKeyDown={blockNonInteger} placeholder="e.g. 2" />
            <p className={styles.hint}>(how many people at your home including you)</p>
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
                <input type="number" min={0} max={30} className={styles.profileInput} value={cat.age || ''} onChange={(e) => updateCat(idx, 'age', e.target.value)} onKeyDown={blockNonInteger} placeholder="e.g. 3" />
                {Number(cat.age) >= 10 && (
                  <p className={styles.hint}>🐱 Senior cat (10+ yrs) — tagged automatically</p>
                )}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.profileLabel}>{t.fields.catPersonality}</label>
              <p className={styles.hint} style={{ marginBottom: '0.4rem' }}>Select all that apply.</p>
              <GroupedCheckboxGroup groups={locale === 'de' ? PERSONALITY_GROUPS_DE : PERSONALITY_GROUPS} value={cat.personality || []} onChange={(v) => updateCat(idx, 'personality', v)} labelMap={tagMap} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.profileLabel}>{t.fields.catDiet}</label>
              <p className={styles.hint} style={{ marginBottom: '0.4rem' }}>Select all that apply.</p>
              <CheckboxGroup options={DIET_OPTIONS} value={cat.diet || []} onChange={(v) => updateCat(idx, 'diet', v)} labelMap={tagMap} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.profileLabel}>Custom traits</label>
              <p className={styles.hint} style={{ marginBottom: '0.4rem' }}>Anything else worth knowing about your cat.</p>
              <CustomTraitInput value={cat.customTraits || []} onChange={(v) => updateCat(idx, 'customTraits', v)} />
            </div>

            {/* Vaccination record */}
            <div id={`cat-vaxx-${idx}`} className={styles.formGroup} style={{ borderTop: '1px solid rgba(44,95,79,0.1)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <label className={styles.profileLabel}>Vaccination Record</label>
              {(() => {
                const rec = vaxxRecords[cat._key];
                const busy = !!vaxxUploading[cat._key];
                const removing = !!vaxxRemoving[cat._key];
                if (rec?.fileUrl) {
                  return (
                    <VaxxReplaceZone busy={busy || removing} onFile={f => handleVaxxUpload(cat._key, f)}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.83rem', color: '#2C5F4F', fontWeight: 600 }}>
                            {rec.fileName || 'Vaccination record'}
                          </span>
                          {rec.date && (
                            <span style={{ fontSize: '0.78rem', color: '#888' }}>
                              · {new Date(rec.date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="button" disabled={busy || removing}
                            onClick={() => vaxxInputRefs.current[cat._key]?.click()}
                            style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--hunter-green)', background: 'none', border: '1px solid rgba(44,95,79,0.35)', borderRadius: '6px', padding: '0.25rem 0.6rem', cursor: 'pointer', fontFamily: 'var(--font-outfit)' }}
                          >
                            {busy ? 'Uploading…' : 'Replace'}
                          </button>
                          <button
                            type="button" disabled={busy || removing}
                            onClick={() => handleVaxxRemove(cat._key)}
                            style={{ fontSize: '0.78rem', fontWeight: 600, color: '#c0392b', background: 'none', border: '1px solid rgba(192,57,43,0.3)', borderRadius: '6px', padding: '0.25rem 0.6rem', cursor: 'pointer', fontFamily: 'var(--font-outfit)' }}
                          >
                            {removing ? 'Removing…' : 'Remove'}
                          </button>
                          <span style={{ fontSize: '0.72rem', color: '#bbb' }}>or drag a new file to replace</span>
                        </div>
                        <input
                          ref={el => { vaxxInputRefs.current[cat._key] = el }}
                          type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleVaxxUpload(cat._key, f); e.target.value = ''; }}
                        />
                      </div>
                    </VaxxReplaceZone>
                  );
                }
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#c0392b', fontStyle: 'italic' }}>
                      No vaccination record — required to request a sit
                    </p>
                    <VaxxDropZone
                      busy={busy}
                      onFile={f => handleVaxxUpload(cat._key, f)}
                      onClickUpload={() => vaxxInputRefs.current[cat._key]?.click()}
                      vaxxDate={vaxxDates[cat._key]}
                      onDateChange={v => setVaxxDates(prev => ({ ...prev, [cat._key]: v }))}
                    />
                    <input
                      ref={el => { vaxxInputRefs.current[cat._key] = el }}
                      type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleVaxxUpload(cat._key, f); e.target.value = ''; }}
                    />
                  </div>
                );
              })()}
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
              {/* maxHomesPerDay input hidden — feature disabled, will re-enable in future version */}
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
                    onKeyDown={blockNonInteger}
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
            <p className={styles.hint} style={{ marginBottom: '0.4rem' }}>Select all that apply.</p>
            <CheckboxGroup options={FEEDING_OPTIONS} value={form.feedingTypes} onChange={(v) => update('feedingTypes', v)} labelMap={tagMap} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.profileLabel}>{t.fields.behavioralTraits}</label>
            <p className={styles.hint} style={{ marginBottom: '0.4rem' }}>Select all that apply.</p>
            <GroupedCheckboxGroup groups={locale === 'de' ? TRAIT_GROUPS_DE : TRAIT_GROUPS} value={form.behavioralTraits} onChange={(v) => update('behavioralTraits', v)} labelMap={tagMap} />
          </div>
        </div>
      )}


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
