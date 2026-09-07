import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';

// Fix for default marker icons in webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const priorityIcons = {
  critical: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }),
  high: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }),
  medium: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }),
  low: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] })
};

function FitBounds({ complaints }) {
  const map = useMap();
  useEffect(() => {
    if (complaints.length > 0) {
      const bounds = L.latLngBounds(complaints.map(c => [c.latitude, c.longitude]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [complaints, map]);
  return null;
}

export default function ComplaintMap({ complaints = [], center = [13.0827, 80.2707], zoom = 12, height = '500px', onMarkerClick }) {
  const validComplaints = complaints.filter(c => c.latitude && c.longitude);

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validComplaints.length > 0 && <FitBounds complaints={validComplaints} />}
        {validComplaints.map(complaint => (
          <Marker key={complaint.id} position={[complaint.latitude, complaint.longitude]}
            icon={priorityIcons[complaint.priority] || priorityIcons.medium}
            eventHandlers={{ click: () => onMarkerClick && onMarkerClick(complaint) }}>
            <Popup>
              <div className="min-w-[200px]">
                <p className="font-semibold text-sm mb-1">{complaint.title || complaint.complaint_id}</p>
                <div className="flex gap-1 mb-2">
                  <StatusBadge status={complaint.status} />
                  <PriorityBadge priority={complaint.priority} />
                </div>
                <p className="text-xs text-gray-500">{complaint.category_name}</p>
                <p className="text-xs text-gray-500">{complaint.area}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(complaint.created_at).toLocaleDateString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

