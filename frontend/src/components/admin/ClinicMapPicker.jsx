import { useEffect, useRef } from 'react';

export default function ClinicMapPicker({ latitude, longitude, onChange }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !window.L || mapInstanceRef.current) return;

    const lat = latitude ?? 41.3275;
    const lng = longitude ?? 19.8187;

    const map = window.L.map(mapRef.current).setView([lat, lng], latitude ? 13 : 6);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const marker = window.L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.on('dragend', () => {
      const { lat: nextLat, lng: nextLng } = marker.getLatLng();
      onChange({ latitude: nextLat, longitude: nextLng });
    });

    map.on('click', (event) => {
      marker.setLatLng(event.latlng);
      onChange({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!markerRef.current || latitude == null || longitude == null) return;
    markerRef.current.setLatLng([latitude, longitude]);
    mapInstanceRef.current?.panTo([latitude, longitude]);
  }, [latitude, longitude]);

  return (
    <div
      ref={mapRef}
      className="clinic-map-picker"
      style={{ height: '280px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #dce3e3' }}
    />
  );
}
