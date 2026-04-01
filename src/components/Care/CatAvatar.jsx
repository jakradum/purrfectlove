'use client';

/**
 * CatAvatar — shows a member's photo or the default pixel cat on their avatar colour.
 *
 * Props:
 *   photoUrl     – Sanity CDN photo URL (optional)
 *   avatarColour – one of: 'whisker-cream' | 'paw-pink' | 'hunter-green' | 'tabby-brown'
 *   name         – display name used for accessible alt text
 *   size         – number (px), default 44
 *   style        – extra inline styles applied to the wrapper
 */

const COLOUR_MAP = {
  'whisker-cream': { bg: '#F6F4F0', fg: '#2C5F4F' },
  'paw-pink':      { bg: '#F5D5C8', fg: '#C85C3F' },
  'hunter-green':  { bg: '#2C5F4F', fg: '#F6F4F0' },
  'tabby-brown':   { bg: '#C85C3F', fg: '#F6F4F0' },
};

const DEFAULT_COLOUR = 'hunter-green';

export default function CatAvatar({ photoUrl, avatarColour, name = 'Member', size = 44, style = {} }) {
  const colours = COLOUR_MAP[avatarColour] || COLOUR_MAP[DEFAULT_COLOUR];

  const wrapStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    overflow: 'hidden',
    background: colours.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...style,
  };

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        style={{ ...wrapStyle, objectFit: 'cover', objectPosition: 'center' }}
        onError={(e) => {
          // Fall back to default avatar if photo fails to load
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement?.classList?.add('cat-avatar-fallback');
        }}
      />
    );
  }

  return (
    <div style={wrapStyle} aria-label={name} role="img">
      {/* Pixel cat image — place at /public/images/care/2.png */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/care/2.png"
        alt=""
        aria-hidden="true"
        style={{ width: '70%', height: '70%', objectFit: 'contain', imageRendering: 'pixelated' }}
        onError={(e) => {
          // If image not yet placed, show initials instead
          e.currentTarget.style.display = 'none';
          const fallback = e.currentTarget.nextSibling;
          if (fallback) fallback.style.display = 'flex';
        }}
      />
      {/* Initials fallback */}
      <span
        style={{
          display: 'none',
          position: 'absolute',
          inset: 0,
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.38,
          fontWeight: 700,
          color: colours.fg,
          fontFamily: 'var(--font-outfit)',
          letterSpacing: '-0.02em',
        }}
      >
        {(name || 'M')[0].toUpperCase()}
      </span>
    </div>
  );
}
