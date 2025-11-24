// src/components/SearchRadiusCircle.jsx
import { Circle } from 'react-leaflet';

const MIA_COORDS = {
  lat: 25.7959,
  lng: -80.2870
};

export default function SearchRadiusCircle({ radiusKm = 50, visible = true }) {
  if (!visible) return null;

  return (
    <Circle
      center={[MIA_COORDS.lat, MIA_COORDS.lng]}
      radius={radiusKm * 1000} // Convert km to meters
      pathOptions={{
        color: '#2563eb',
        fillColor: '#2563eb',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '10, 10' // Dashed line
      }}
    />
  );
}
