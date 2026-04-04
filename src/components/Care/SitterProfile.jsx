'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from './Care.module.css';
import CatAvatar from './CatAvatar';
import ReportModal from './ReportModal';
import FeedbackDisplay from './FeedbackDisplay';
import BookingRequestModal from './BookingRequestModal';

const TAG_LABELS = {
  shy: 'Shy', energetic: 'Energetic', senior: 'Senior', 'special needs': 'Special Needs',
  wet: 'Wet food', dry: 'Dry food', medication: 'Medication', 'special diet': 'Special diet',
};

const COVERS = [
  '/images/care/cover-pattern-1.png',
  '/images/care/cover-pattern-2.png',
  '/images/care/cover-pattern-3.png',
];
const COVER_FALLBACKS = ['#F6F4F0', '#F5D5C8', '#D4E4DF'];

function coverIndex(id) {
  if (!id) return 0;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h * 31) + id.charCodeAt(i)) >>> 0;
  return h % 3;
}

function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DAY_INITIALS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function AvailabilityStrip({ markedDates = [], availabilityDefault = 'available' }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  return (
    <div className={styles.availStrip}>
      {days.map((date) => {
        const ymd = toYMD(date);
        const isAvailable = availabilityDefault === 'available'
          ? !markedDates.includes(ymd)
          : markedDates.includes(ymd);
        return (
          <div key={ymd} className={styles.availDayCol}>
            <span className={styles.availDayInitial}>{DAY_INITIALS[date.getDay()]}</span>
            <div className={styles.availDaySquare} style={{ background: isAvailable ? '#EAF3DE' : '#f3f4f6' }}>
              <span
                className={styles.availDayNum}
                style={{
                  color: isAvailable ? '#2C5F4F' : '#aaa',
                  textDecoration: isAvailable ? 'none' : 'line-through',
                }}
              >
                {date.getDate()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Props:
 *   sitter               – catSitter data object
 *   isOwnProfile         – boolean: show edit controls, hide report/message/feedbacks
 *   onEdit               – callback: "Edit profile" button. If absent + isOwnProfile, links to /care/profile
 *   onEditAvailability   – callback: "Edit" button in availability section (own profile only)
 *   onAvatarClick        – callback: clicking avatar triggers photo upload
 *   photoUploading       – boolean: shows uploading state on avatar
 *   feedbacks            – array of feedback objects (ignored when isOwnProfile)
 */
export default function SitterProfile({
  sitter,
  isOwnProfile = false,
  onEdit,
  onEditAvailability,
  onAvatarClick,
  photoUploading = false,
  feedbacks = [],
}) {
  const {
    _id, _createdAt, name, location, bio,
    cats, feedingTypes, behavioralTraits,
    availabilityDefault, unavailableDatesV2,
    avatarColour, photoUrl, coverImageUrl,
    identityVerified, trustedSitter, maxCatsPerDay,
  } = sitter;

  const displayName = name || 'Member';

  const memberSince = _createdAt
    ? new Date(_createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  const metaParts = [location?.name || location?.displayName, memberSince ? `Member since ${memberSince}` : null].filter(Boolean);

  const idx = coverIndex(_id || '');
  const coverSrc = coverImageUrl || COVERS[idx];
  const coverBg = COVER_FALLBACKS[idx];
  const isCoverPattern = !coverImageUrl;

  const [showReport, setShowReport] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [localCoverUrl, setLocalCoverUrl] = useState(null);
  const coverInputRef = useRef(null);

  const handleCoverUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append('cover', file);
      const res = await fetch('/api/care/upload-cover', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.coverImageUrl) setLocalCoverUrl(data.coverImageUrl);
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  }, []);

  const activeCoverSrc = localCoverUrl || coverSrc;
  const capabilities = [...new Set([...(feedingTypes || []), ...(behavioralTraits || [])])];

  return (
    <div className={styles.sitterProfilePage}>
      {!isOwnProfile && <Link href="/care" className={styles.backLink}>← Back to network</Link>}

      {/* Profile header card */}
      <div className={styles.sitterProfileHeader}>
        {/* Cover */}
        <div
          className={styles.sitterProfileCover}
          style={isCoverPattern && !localCoverUrl
            ? { backgroundImage: `url(${activeCoverSrc})`, backgroundColor: coverBg }
            : { backgroundImage: `url(${activeCoverSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          }
        >
          {isOwnProfile && (
            <>
              <button
                type="button"
                className={styles.editCoverBtn}
                onClick={() => coverInputRef.current?.click()}
                disabled={coverUploading}
              >
                {coverUploading ? 'Uploading…' : 'Edit cover'}
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleCoverUpload}
              />
            </>
          )}

          {/* Avatar */}
          <div className={styles.sitterProfileAvatarWrap}>
            {isOwnProfile && onAvatarClick ? (
              <button
                type="button"
                onClick={onAvatarClick}
                className={styles.avatarUploadBtn}
                title={photoUploading ? 'Uploading…' : 'Change photo'}
                disabled={photoUploading}
              >
                <CatAvatar
                  photoUrl={photoUrl}
                  avatarColour={avatarColour}
                  name={displayName}
                  size={64}
                  style={{ border: '3px solid #fff', opacity: photoUploading ? 0.6 : 1 }}
                />
                <span className={styles.avatarUploadOverlay}>
                  {photoUploading ? '…' : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  )}
                </span>
              </button>
            ) : (
              <CatAvatar
                photoUrl={photoUrl}
                avatarColour={avatarColour}
                name={displayName}
                size={64}
                style={{ border: '3px solid #fff' }}
              />
            )}
          </div>
        </div>

        {/* Header body */}
        <div className={styles.sitterProfileHeaderBody}>
          <div className={styles.sitterProfileUsername}>
            {displayName}
            {isOwnProfile && <span className={styles.sitterProfileYouTag}> — you</span>}
          </div>

          {metaParts.length > 0 && (
            <div className={styles.sitterProfileMeta}>{metaParts.join(' · ')}</div>
          )}
          {(identityVerified || trustedSitter) && (
            <div className={styles.sitterProfileBadges}>
              {identityVerified && (
                <span className={`${styles.sitterBadge} ${styles.sitterBadgeGreen}`}>Identity verified</span>
              )}
              {trustedSitter && (
                <span className={`${styles.sitterBadge} ${styles.sitterBadgeBlue}`}>Trusted sitter</span>
              )}
            </div>
          )}

          {isOwnProfile ? (
            <>
              {onEdit ? (
                <button type="button" onClick={onEdit} className={styles.sitterEditBtn}>
                  Edit profile
                </button>
              ) : (
                <Link href="/care/profile" className={styles.sitterEditBtn}>
                  Edit profile
                </Link>
              )}
              <button
                type="button"
                className={styles.copyLinkBtn}
                onClick={() => {
                  const url = `${window.location.origin}/care/${_id}`;
                  navigator.clipboard.writeText(url).then(() => {
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  });
                }}
              >
                {linkCopied ? 'Link copied!' : 'Copy profile link'}
              </button>
            </>
          ) : (
            <>

              <button
                type="button"
                className={styles.sitterRequestBtn}
                onClick={() => setShowBooking(true)}
              >
                Request a sit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <div className={styles.sitterSection}>
          <div className={styles.sitterSectionTitle}>About</div>
          <p className={styles.sitterBio}>{bio}</p>
        </div>
      )}

      {/* Activity */}
      <div className={styles.sitterSection}>
        <div className={styles.sitterSectionTitle}>Activity</div>
        <div className={styles.trustRow}>
          <div className={styles.trustMetric}>
            <div className={styles.trustVal}>—</div>
            <div className={styles.trustLabel}>Response rate</div>
          </div>
          <div className={styles.trustMetric}>
            <div className={styles.trustVal}>—</div>
            <div className={styles.trustLabel}>Last active</div>
          </div>
          <div className={styles.trustMetric}>
            <div className={styles.trustVal}>—</div>
            <div className={styles.trustLabel}>Sits completed</div>
          </div>
        </div>
        <div className={styles.noActivityNote}>Activity data will appear after the first sit.</div>
      </div>

      {/* Availability */}
      <div className={styles.sitterSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '0.5px solid #eee' }}>
          <div className={styles.sitterSectionTitle} style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>Availability</div>
          {isOwnProfile && onEditAvailability && (
            <button type="button" onClick={onEditAvailability} className={styles.sitterSectionEditBtn}>
              Edit
            </button>
          )}
        </div>
        <AvailabilityStrip
          markedDates={unavailableDatesV2 || []}
          availabilityDefault={availabilityDefault || 'available'}
        />
      </div>

      {/* Capabilities */}
      {(capabilities.length > 0 || maxCatsPerDay > 0) && (
        <div className={styles.sitterSection}>
          <div className={styles.sitterSectionTitle}>Sitting capabilities</div>
          {maxCatsPerDay > 0 && (
            <p style={{ fontSize: '0.875rem', color: '#555', margin: '0 0 10px' }}>
              Can sit up to <strong>{maxCatsPerDay}</strong> cat{maxCatsPerDay !== 1 ? 's' : ''} per day
            </p>
          )}
          {capabilities.length > 0 && (
            <div className={styles.capabilityPills}>
              {capabilities.map(tag => (
                <span key={tag} className={styles.capabilityPill}>
                  {TAG_LABELS[tag] || tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cats */}
      {cats && cats.length > 0 && (
        <div className={styles.sitterSection}>
          <div className={styles.sitterSectionTitle}>My cats</div>
          <div className={styles.catProfileGrid}>
            {cats.map((cat, i) => (
              <div key={i} className={styles.catProfileCard}>
                <div className={styles.catProfileName}>{cat.name || 'Unnamed'}</div>
                {(cat.gender || cat.age || cat.indoor !== undefined || cat.neutered !== undefined) && (
                  <div className={styles.catProfileMeta}>
                    {[
                      cat.gender,
                      cat.age ? `${cat.age} yr` : null,
                      cat.indoor === true ? 'Indoor' : cat.indoor === false ? 'Indoor/Outdoor' : null,
                      cat.neutered === true ? 'Neutered' : cat.neutered === false ? 'Not neutered' : null,
                    ].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Feedbacks — public view only */}
      {!isOwnProfile && feedbacks.length > 0 && (
        <FeedbackDisplay feedbacks={feedbacks} locale="en" />
      )}

      {/* Report — public view only */}
      {!isOwnProfile && (
        <button
          type="button"
          className={styles.reportLink}
          onClick={() => setShowReport(true)}
        >
          Report this member
        </button>
      )}

      {showReport && (
        <ReportModal
          memberName={displayName}
          memberId={_id}
          onClose={() => setShowReport(false)}
        />
      )}

      {showBooking && (
        <BookingRequestModal
          sitterId={_id}
          sitterName={displayName}
          startDate={null}
          endDate={null}
          onClose={() => setShowBooking(false)}
        />
      )}
    </div>
  );
}
