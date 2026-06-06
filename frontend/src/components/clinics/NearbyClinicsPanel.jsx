import { useState } from 'react';
import ClinicCard from './ClinicCard';
import ClinicMap from './ClinicMap';

/**
 * @param {{
 *   clinics?: Array<object>,
 *   userLocation?: { latitude?: number | null, longitude?: number | null } | null,
 *   hasUserLocation?: boolean,
 *   loading?: boolean,
 *   locationStatus?: string,
 *   locationMessage?: string,
 *   onUseMyLocation?: () => void,
 * }} props
 */
export default function NearbyClinicsPanel({
  clinics = [],
  userLocation = null,
  hasUserLocation = false,
  loading = false,
  locationStatus = 'idle',
  locationMessage = '',
  onUseMyLocation,
}) {
  const [selectedClinicId, setSelectedClinicId] = useState(null);

  if (!hasUserLocation) {
    return (
      <div className="portal-card mb-4">
        <h4 className="portal-card-title">Nearby Clinics</h4>
        <p className="text-muted mb-3">
          Add your location to receive clinic recommendations sorted by distance from you.
        </p>
        <button
          type="button"
          className="btn btn-outline-accent"
          onClick={onUseMyLocation}
          disabled={locationStatus === 'loading'}
        >
          {locationStatus === 'loading' ? 'Getting Location...' : 'Use My Location'}
        </button>
        {locationMessage && <p className="small mt-2 mb-0 text-muted">{locationMessage}</p>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="portal-card mb-4 text-center py-5">
        <div className="spinner-border text-accent mb-3" role="status" aria-label="Loading clinics" />
        <p className="text-muted mb-0">Loading nearby clinics...</p>
      </div>
    );
  }

  if (!clinics.length) {
    return (
      <div className="portal-card mb-4">
        <h4 className="portal-card-title">Nearby Clinics</h4>
        <p className="text-muted mb-0">No active clinics are available near your location yet.</p>
      </div>
    );
  }

  return (
    <div className="portal-card mb-4 nearby-clinics-panel">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <h4 className="portal-card-title mb-1">Nearest Clinics</h4>
          <p className="text-muted small mb-0">
            Select a clinic to highlight it on the map, or use Get Directions to open Google Maps navigation.
          </p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="clinic-card-list">
            {clinics.map((clinic) => (
              <ClinicCard
                key={clinic.id}
                clinic={clinic}
                userLocation={userLocation}
                isSelected={selectedClinicId === clinic.id}
                onSelect={setSelectedClinicId}
              />
            ))}
          </div>
        </div>
        <div className="col-lg-7">
          <ClinicMap
            clinics={clinics}
            userLocation={userLocation}
            selectedClinicId={selectedClinicId}
            onSelectClinic={setSelectedClinicId}
          />
        </div>
      </div>
    </div>
  );
}
