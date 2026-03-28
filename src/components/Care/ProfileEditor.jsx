'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Care.module.css';
import contentEN from '@/data/careContent.en.json';
import contentDE from '@/data/careContent.de.json';

const PERSONALITY_OPTIONS = ['shy', 'energetic', 'senior', 'special needs'];
const DIET_OPTIONS = ['wet', 'dry', 'medication', 'special diet'];
const FEEDING_OPTIONS = ['wet', 'dry', 'medication', 'special diet'];
const BEHAVIORAL_OPTIONS = ['shy', 'energetic', 'senior', 'special needs'];
const CONTACT_OPTIONS = ['email', 'whatsapp'];

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
    if (current.includes(opt)) {
      onChange(current.filter((v) => v !== opt));
    } else {
      onChange([...current, opt]);
    }
  };

  return (
    <div className={styles.checkboxGroup}>
      {options.map((opt) => (
        <label key={opt} className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={(value || []).includes(opt)}
            onChange={() => toggle(opt)}
          />
          {labelMap ? labelMap[opt] || opt : opt}
        </label>
      ))}
    </div>
  );
}

export default function ProfileEditor({ initialData }) {
  const locale = 'en';
  const t = locale === 'de' ? contentDE.profile : contentEN.profile;
  const tags = t.tags;
  const router = useRouter();

  const tagMap = {
    shy: tags.shy,
    energetic: tags.energetic,
    senior: tags.senior,
    'special needs': tags.specialNeeds,
    wet: tags.wet,
    dry: tags.dry,
    medication: tags.medication,
    'special diet': tags.specialDiet,
  };

  const [form, setForm] = useState({
    name: initialData.name || '',
    bio: initialData.bio || '',
    contactPreference: initialData.contactPreference || 'email',
    bedrooms: initialData.bedrooms ?? '',
    householdSize: initialData.householdSize ?? '',
    cats: initialData.cats || [],
    alwaysAvailable: initialData.alwaysAvailable ?? false,
    unavailableDates: initialData.unavailableDates || [],
    availableDates: initialData.availableDates || [],
    maxCats: initialData.maxCats ?? '',
    feedingTypes: initialData.feedingTypes || [],
    behavioralTraits: initialData.behavioralTraits || [],
    canSit: initialData.canSit ?? false,
    needsSitting: initialData.needsSitting ?? false,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
    setSaveError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
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

      setSaved(true);
      router.refresh();
    } catch {
      setSaveError(t.errors.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  // Cats array helpers
  const addCat = () => {
    update('cats', [...form.cats, { name: '', age: '', personality: [], diet: [] }]);
  };

  const updateCat = (idx, field, value) => {
    const updated = form.cats.map((cat, i) =>
      i === idx ? { ...cat, [field]: value } : cat
    );
    update('cats', updated);
  };

  const removeCat = (idx) => {
    update('cats', form.cats.filter((_, i) => i !== idx));
  };

  // Date ranges helpers
  const addDateRange = () => {
    update('availableDates', [...form.availableDates, { start: '', end: '' }]);
  };

  const updateDateRange = (idx, field, value) => {
    const updated = form.availableDates.map((r, i) =>
      i === idx ? { ...r, [field]: value } : r
    );
    update('availableDates', updated);
  };

  const removeDateRange = (idx) => {
    update('availableDates', form.availableDates.filter((_, i) => i !== idx));
  };

  return (
    <form className={styles.profilePage} onSubmit={handleSave}>
      <div className={styles.profileHeader}>
        <h1 className={styles.pageTitle}>{t.title}</h1>
        <div className={styles.profileActions}>
          <Link href="/care" className={styles.backLink}>← Back to network</Link>
        </div>
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

      {/* About Me */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.sections.about}</h2>
        <div className={styles.formGroup}>
          <label className={styles.profileLabel}>{t.fields.name}</label>
          <input
            type="text"
            className={styles.profileInput}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Your display name"
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.profileLabel}>{t.fields.bio}</label>
          <textarea
            className={styles.profileTextarea}
            value={form.bio}
            onChange={(e) => update('bio', e.target.value.slice(0, 250))}
            placeholder="Tell other members about yourself..."
            rows={4}
            maxLength={250}
          />
          <p className={styles.hint}>{form.bio.length}/250 — {t.fields.bioHint}</p>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.profileLabel}>{t.fields.contactPreference}</label>
          <select
            className={styles.profileSelect}
            value={form.contactPreference}
            onChange={(e) => update('contactPreference', e.target.value)}
          >
            <option value="email">{t.fields.contactEmail}</option>
            <option value="whatsapp">{t.fields.contactWhatsapp}</option>
          </select>
        </div>
      </div>

      {/* My Home */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.sections.home}</h2>
        <div className={styles.fieldRow}>
          <div className={styles.formGroup}>
            <label className={styles.profileLabel}>{t.fields.bedrooms}</label>
            <input
              type="number"
              min={0}
              max={20}
              className={styles.profileInput}
              value={form.bedrooms}
              onChange={(e) => update('bedrooms', e.target.value)}
              placeholder="e.g. 2"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.profileLabel}>{t.fields.householdSize}</label>
            <input
              type="number"
              min={1}
              max={20}
              className={styles.profileInput}
              value={form.householdSize}
              onChange={(e) => update('householdSize', e.target.value)}
              placeholder="e.g. 2"
            />
          </div>
        </div>
      </div>

      {/* My Cats */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.sections.myCats}</h2>
        {form.cats.map((cat, idx) => (
          <div key={idx} className={styles.catCard}>
            <div className={styles.catCardHeader}>
              <span className={styles.catCardTitle}>
                {cat.name || `Cat ${idx + 1}`}
              </span>
              <button
                type="button"
                className={styles.removeBtnSmall}
                onClick={() => removeCat(idx)}
              >
                {t.fields.removeCat}
              </button>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.formGroup}>
                <label className={styles.profileLabel}>{t.fields.catName}</label>
                <input
                  type="text"
                  className={styles.profileInput}
                  value={cat.name || ''}
                  onChange={(e) => updateCat(idx, 'name', e.target.value)}
                  placeholder="e.g. Mochi"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.profileLabel}>{t.fields.catAge}</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  className={styles.profileInput}
                  value={cat.age || ''}
                  onChange={(e) => updateCat(idx, 'age', e.target.value)}
                  placeholder="e.g. 3"
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.profileLabel}>{t.fields.catPersonality}</label>
              <CheckboxGroup
                options={PERSONALITY_OPTIONS}
                value={cat.personality || []}
                onChange={(v) => updateCat(idx, 'personality', v)}
                labelMap={tagMap}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.profileLabel}>{t.fields.catDiet}</label>
              <CheckboxGroup
                options={DIET_OPTIONS}
                value={cat.diet || []}
                onChange={(v) => updateCat(idx, 'diet', v)}
                labelMap={tagMap}
              />
            </div>
          </div>
        ))}
        <button type="button" className={styles.addBtn} onClick={addCat}>
          {t.fields.addCat}
        </button>
      </div>

      {/* My Availability */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.sections.availability}</h2>
        <div className={styles.formGroup}>
          <Toggle
            checked={form.alwaysAvailable}
            onChange={(v) => update('alwaysAvailable', v)}
            label={t.fields.alwaysAvailable}
          />
        </div>

        {form.alwaysAvailable ? (
          <div className={styles.formGroup}>
            <label className={styles.profileLabel}>{t.fields.unavailableDates}</label>
            <p className={styles.hint}>Enter dates (one per line) when you are NOT available</p>
            <textarea
              className={styles.profileTextarea}
              value={(form.unavailableDates || []).join('\n')}
              onChange={(e) =>
                update(
                  'unavailableDates',
                  e.target.value.split('\n').map((d) => d.trim()).filter(Boolean)
                )
              }
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
                  <input
                    type="date"
                    className={styles.profileInput}
                    value={range.start || ''}
                    onChange={(e) => updateDateRange(idx, 'start', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <span>→</span>
                  <input
                    type="date"
                    className={styles.profileInput}
                    value={range.end || ''}
                    onChange={(e) => updateDateRange(idx, 'end', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className={styles.removeBtnSmall}
                    onClick={() => removeDateRange(idx)}
                  >
                    {t.fields.removeRange}
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className={styles.addBtn} onClick={addDateRange}>
              {t.fields.addRange}
            </button>
          </div>
        )}
      </div>

      {/* Sitting Capabilities */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.sections.sittingCapabilities}</h2>
        <div className={styles.formGroup}>
          <label className={styles.profileLabel}>{t.fields.maxCats}</label>
          <input
            type="number"
            min={1}
            max={20}
            className={styles.profileInput}
            value={form.maxCats}
            onChange={(e) => update('maxCats', e.target.value)}
            placeholder="e.g. 2"
            style={{ maxWidth: '140px' }}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.profileLabel}>{t.fields.feedingTypes}</label>
          <CheckboxGroup
            options={FEEDING_OPTIONS}
            value={form.feedingTypes}
            onChange={(v) => update('feedingTypes', v)}
            labelMap={tagMap}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.profileLabel}>{t.fields.behavioralTraits}</label>
          <CheckboxGroup
            options={BEHAVIORAL_OPTIONS}
            value={form.behavioralTraits}
            onChange={(v) => update('behavioralTraits', v)}
            labelMap={tagMap}
          />
        </div>
      </div>

      {/* My Status */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.sections.status}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Toggle
            checked={form.canSit}
            onChange={(v) => update('canSit', v)}
            label={t.fields.canSit}
          />
          <Toggle
            checked={form.needsSitting}
            onChange={(v) => update('needsSitting', v)}
            label={t.fields.needsSitting}
          />
        </div>
      </div>

      {/* Save Bar */}
      <div className={styles.saveBar}>
        {saveError && <span className={styles.saveError}>{saveError}</span>}
        {saved && <span className={styles.savedMsg}>{t.saved}</span>}
        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? t.saving : t.save}
        </button>
      </div>
    </form>
  );
}
