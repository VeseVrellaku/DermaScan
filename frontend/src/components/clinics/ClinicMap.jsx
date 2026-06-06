import { useEffect, useRef } from 'react';
import { buildGoogleMapsDirectionsUrl, formatDistance } from '../../utils/googleMaps';

/**
 * @param {{
 *   clinics: Array<{
 *     id: string,
 *     name: string,
 *     address: string,
 *     city: string,
 *     latitude?: number | null,
 *     longitude?: number | null,
 *     distance_km?: number | null,
 *   }>,
 *   userLocation?: { latitude?: number | null, longitude?: number | null } | null,
 *   selectedClinicId?: string | null,
 *   onSelectClinic?: (clinicId: string) => void,
 * }} props
 */
export default function ClinicMap({
  clinics = [],
  userLocation = null,
  selectedClinicId = null,
  onSelectClinic,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(/** @type {Map<string, any>} */ (new Map()));
  const userMarkerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !window.L || mapInstanceRef.current) return;

    const map = window.L.map(mapRef.current, { zoomControl: true });
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current.clear();
      userMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    const bounds = window.L.latLngBounds([]);

    clinics.forEach((clinic) => {
      if (clinic.latitude == null || clinic.longitude == null) return;

      const marker = window.L.marker([clinic.latitude, clinic.longitude], {
        riseOnHover: true,
      }).addTo(map);

      const address = [clinic.address, clinic.city].filter(Boolean).join(', ');
      const destination = { latitude: clinic.latitude, longitude: clinic.longitude };
      const origin =
        userLocation?.latitude != null && userLocation?.longitude != null
          ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
          : null;
      const directionsUrl = buildGoogleMapsDirectionsUrl(destination, origin);

      const popupHtml = `
        <div class="clinic-map-popup">
          <strong>${escapeHtml(clinic.name)}</strong>
          <p class="small text-muted mb-1">${escapeHtml(address)}</p>
          <p class="small mb-2">${formatDistance(clinic.distance_km)} away</p>
          ${
            directionsUrl
              ? `<a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-accent clinic-map-popup__navigate">
                   <i class="bi bi-sign-turn-right"></i> Navigate
                 </a>`
              : ''
          }
        </div>
      `;

      marker.bindPopup(window.L.popup({ maxWidth: 280, className: 'clinic-leaflet-popup' }).setContent(popupHtml));

      marker.on('click', () => {
        onSelectClinic?.(clinic.id);
      });

      markersRef.current.set(clinic.id, marker);
      bounds.extend([clinic.latitude, clinic.longitude]);
    });

    if (userLocation?.latitude != null && userLocation?.longitude != null) {
      const userIcon = window.L.divIcon({
        className: 'clinic-map-user-marker',
        html: '<div class="clinic-map-user-marker__dot" title="Your location"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      userMarkerRef.current = window.L.marker(
        [userLocation.latitude, userLocation.longitude],
        { icon: userIcon, zIndexOffset: 1000 },
      ).addTo(map);
      userMarkerRef.current.bindPopup('<strong>Your location</strong>');
      bounds.extend([userLocation.latitude, userLocation.longitude]);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
    } else {
      map.setView([41.3275, 19.8187], 6);
    }
  }, [clinics, userLocation, onSelectClinic]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedClinicId) return;

    const marker = markersRef.current.get(selectedClinicId);
    if (!marker) return;

    const { lat, lng } = marker.getLatLng();
    map.setView([lat, lng], Math.max(map.getZoom(), 14), { animate: true });
    marker.openPopup();
  }, [selectedClinicId]);

  return (
    <div className="clinic-map-wrapper">
      <div ref={mapRef} className="clinic-map" aria-label="Clinic locations map" />
    </div>
  );
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
