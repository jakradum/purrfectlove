'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const COLOUR_MAP = {
  'whisker-cream': '#F6F4F0',
  'paw-pink':      '#F5D5C8',
  'hunter-green':  '#2C5F4F',
  'tabby-brown':   '#C85C3F',
};

function formatDist(d) {
  if (d == null) return null;
  return `~${(Math.round(d * 10) / 10).toFixed(1)} km`;
}

function avatarIconHtml({ photoUrl, avatarColour, name = 'M', active = false, isUser = false, distance = null }) {
  const size = active ? 46 : 38;
  const borderColor = isUser ? '#3b82f6' : (active ? '#C85C3F' : '#2C5F4F');
  const bg = COLOUR_MAP[avatarColour] || '#2C5F4F';
  const initial = (name || 'M')[0].toUpperCase();
  const distLabel = !isUser && distance != null ? formatDist(distance) : null;

  const inner = photoUrl
    ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;object-position:center;border-radius:50%;" />`
    : `<img src="/images/care/default-avatar-cat.png"
            style="width:68%;height:68%;object-fit:contain;image-rendering:pixelated;"
            onerror="this.style.display='none';this.nextSibling.style.display='flex';" />
       <span style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;
                    font-size:${Math.round(size * 0.36)}px;font-weight:700;color:#fff;
                    font-family:system-ui,sans-serif;">${initial}</span>`;

  const label = distLabel
    ? `<div style="position:absolute;bottom:${size + 6}px;left:50%;transform:translateX(-50%);
                  background:rgba(255,255,255,0.96);border:1px solid rgba(0,0,0,0.10);
                  border-radius:6px;padding:2px 7px;font-size:11px;font-weight:600;
                  color:#444;white-space:nowrap;box-shadow:0 1px 5px rgba(0,0,0,0.14);
                  font-family:system-ui,sans-serif;pointer-events:none;">${distLabel}</div>`
    : '';

  return `<div style="position:relative;width:${size}px;height:${size}px;">
    ${label}
    <div style="
      width:${size}px;height:${size}px;
      border-radius:50%;
      border:2.5px solid ${borderColor};
      box-shadow:0 2px 8px rgba(0,0,0,0.28);
      background:${bg};
      overflow:hidden;
      display:flex;align-items:center;justify-content:center;
      position:relative;
      transition:width .12s,height .12s,border-color .12s;
    ">${inner}</div>
  </div>`;
}

function makeIcon(opts) {
  const size = opts.active ? 46 : 38;
  return L.divIcon({
    className: '',
    html: avatarIconHtml(opts),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitBounds({ sitters }) {
  const map = useMap();
  useEffect(() => {
    const pts = sitters
      .filter(s => s.location?.lat != null && s.location?.lng != null)
      .map(s => [s.location.lat, s.location.lng]);
    if (pts.length === 0) return;
    map.fitBounds(L.latLngBounds(pts), { padding: [52, 52], maxZoom: 14 });
  }, [sitters, map]);
  return null;
}

export default function MarketplaceMap({ sitters = [], hoveredId, userLocation, myProfile, onMarkerClick }) {
  const center = userLocation?.lat != null
    ? [userLocation.lat, userLocation.lng]
    : [20.5937, 78.9629];

  const withLocation = sitters.filter(s => s.location?.lat != null && s.location?.lng != null);

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <FitBounds sitters={withLocation} />

      {withLocation.map(sitter => {
        const active = hoveredId === sitter._id;
        return (
          <Marker
            key={`${sitter._id}-${active}`}
            position={[sitter.location.lat, sitter.location.lng]}
            icon={makeIcon({
              photoUrl: sitter.photoUrl,
              avatarColour: sitter.avatarColour,
              name: sitter.name,
              active,
              distance: sitter._distance ?? null,
            })}
            eventHandlers={{ click: () => onMarkerClick?.(sitter._id) }}
          />
        );
      })}

      {userLocation?.lat != null && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={makeIcon({
            photoUrl: myProfile?.photoUrl,
            avatarColour: myProfile?.avatarColour,
            name: myProfile?.name,
            isUser: true,
          })}
        />
      )}
    </MapContainer>
  );
}
