import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function ClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function LocationPicker({ latitude, longitude, onLocationSelect }) {
  const [position, setPosition] = useState(latitude && longitude ? [latitude, longitude] : null);
  const [loading, setLoading] = useState(false);

  const handleSelect = (lat, lng) => {
    setPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  const getGPSLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handleSelect(pos.coords.latitude, pos.coords.longitude);
          setLoading(false);
        },
        () => { setLoading(false); alert('Could not get GPS location. Please select manually on the map.'); },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLoading(false);
      alert('Geolocation not supported');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={getGPSLocation} disabled={loading}
          className="btn-secondary flex items-center gap-2 text-sm">
          <Navigation className="w-4 h-4" />
          {loading ? 'Getting location...' : 'Use GPS Location'}
        </button>
        {position && (
          <span className="text-xs text-gray-500">
            {position[0].toFixed(4)}, {position[1].toFixed(4)}
          </span>
        )}
      </div>
      <div className="h-64 rounded-xl overflow-hidden border">
        <MapContainer center={position || [13.0827, 80.2707]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onLocationSelect={handleSelect} />
          {position && <Marker position={position} />}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500 flex items-center gap-1">
        <MapPin className="w-3 h-3" /> Click on the map or use GPS to set the complaint location
      </p>
    </div>
  );
}

