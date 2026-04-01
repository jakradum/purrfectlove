'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom pin icon — avoids the default icon URL issue in webpack
let PIN_ICON = null;
if (typeof window !== 'undefined') {
  PIN_ICON = L.divIcon({
    html: `<div style="position:relative;width:24px;height:32px">
      <div style="width:24px;height:24px;background:#2c5f4f;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);position:absolute;top:0;left:0"></div>
      <div style="position:absolute;bottom:0;left:9px;width:6px;height:8px;background:rgba(44,95,79,0.35);border-radius:50%;filter:blur(2px)"></div>
    </div>`,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32],
    className: '',
  });
}

function MapClickHandler({ onPositionChange }) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ position }) {
  const map = useMap();
  const prevRef = useRef(null);
  useEffect(() => {
    if (!position) return;
    const key = `${position[0].toFixed(4)},${position[1].toFixed(4)}`;
    if (key === prevRef.current) return;
    prevRef.current = key;
    map.flyTo(position, Math.max(map.getZoom(), 14), { animate: true, duration: 0.8 });
  }, [position, map]);
  return null;
}

function DraggableMarker({ position, onPositionChange }) {
  const markerRef = useRef(null);
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const { lat, lng } = marker.getLatLng();
        onPositionChange(lat, lng);
      }
    },
  };

  if (!PIN_ICON || !position) return null;

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={position}
      icon={PIN_ICON}
      ref={markerRef}
    />
  );
}

export default function LeafletMapInner({ center, position, onPositionChange }) {
  return (
    <MapContainer
      center={center || [12.9716, 77.5946]}
      zoom={14}
      style={{ height: '280px', width: '100%', borderRadius: '8px', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onPositionChange={onPositionChange} />
      <FlyTo position={position} />
      <DraggableMarker position={position} onPositionChange={onPositionChange} />
    </MapContainer>
  );
}
