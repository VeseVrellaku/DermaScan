/**
 * @typedef {{ latitude: number, longitude: number }} GeoPoint
 */

/**
 * @param {GeoPoint | null | undefined} destination
 * @param {GeoPoint | null | undefined} [origin]
 * @returns {string | null}
 */
export function buildGoogleMapsDirectionsUrl(destination, origin = null) {
  if (destination?.latitude == null || destination?.longitude == null) return null;

  const params = new URLSearchParams({
    api: '1',
    destination: `${destination.latitude},${destination.longitude}`,
    travelmode: 'driving',
  });

  if (origin?.latitude != null && origin?.longitude != null) {
    params.set('origin', `${origin.latitude},${origin.longitude}`);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * @param {GeoPoint | null | undefined} destination
 * @returns {string | null}
 */
export function buildGoogleMapsViewUrl(destination) {
  if (destination?.latitude == null || destination?.longitude == null) return null;
  const params = new URLSearchParams({
    api: '1',
    query: `${destination.latitude},${destination.longitude}`,
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

/**
 * Opens Google Maps directions in a new tab. On mobile, Google Maps app opens when installed.
 * @param {GeoPoint | null | undefined} destination
 * @param {GeoPoint | null | undefined} [origin]
 */
export function openGoogleMapsNavigation(destination, origin = null) {
  const url = buildGoogleMapsDirectionsUrl(destination, origin);
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * @param {GeoPoint | null | undefined} destination
 */
export function openGoogleMapsView(destination) {
  const url = buildGoogleMapsViewUrl(destination);
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Heuristic travel estimates when routing API is unavailable.
 * @param {number | null | undefined} distanceKm
 * @returns {{ walkingMins: number, drivingMins: number } | null}
 */
export function estimateTravelTimes(distanceKm) {
  if (distanceKm == null || Number.isNaN(Number(distanceKm))) return null;
  const km = Number(distanceKm);
  return {
    walkingMins: Math.max(1, Math.round((km / 5) * 60)),
    drivingMins: Math.max(1, Math.round((km / 40) * 60)),
  };
}

/**
 * @param {number | null | undefined} distanceKm
 * @returns {string}
 */
export function formatDistance(distanceKm) {
  if (distanceKm == null || Number.isNaN(Number(distanceKm))) return 'Distance unavailable';
  const km = Number(distanceKm);
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
