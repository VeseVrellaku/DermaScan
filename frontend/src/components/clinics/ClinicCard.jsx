import ClinicDirectionsButton from './ClinicDirectionsButton';
import { estimateTravelTimes, formatDistance } from '../../utils/googleMaps';

/**
 * @param {{
 *   clinic: {
 *     id: string,
 *     name: string,
 *     address: string,
 *     city: string,
 *     phone?: string | null,
 *     latitude?: number | null,
 *     longitude?: number | null,
 *     distance_km?: number | null,
 *   },
 *   userLocation?: { latitude?: number | null, longitude?: number | null } | null,
 *   isSelected?: boolean,
 *   onSelect?: (clinicId: string) => void,
 * }} props
 */
export default function ClinicCard({ clinic, userLocation = null, isSelected = false, onSelect }) {
  if (!clinic?.id) return null;

  const travel = estimateTravelTimes(clinic.distance_km);
  const fullAddress = [clinic.address, clinic.city].filter(Boolean).join(', ');

  const handleCardClick = () => {
    onSelect?.(clinic.id);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick();
    }
  };

  return (
    <article
      className={`clinic-card ${isSelected ? 'clinic-card--selected' : ''}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${clinic.name}, ${formatDistance(clinic.distance_km)} away`}
    >
      <div className="clinic-card__header">
        <h6 className="clinic-card__title">{clinic.name}</h6>
        <span className="clinic-card__distance badge bg-accent">{formatDistance(clinic.distance_km)}</span>
      </div>

      <p className="clinic-card__address text-muted small mb-2">
        <i className="bi bi-geo-alt me-1" aria-hidden="true"></i>
        {fullAddress || 'Address unavailable'}
      </p>

      {clinic.phone && (
        <p className="clinic-card__phone text-muted small mb-2">
          <i className="bi bi-telephone me-1" aria-hidden="true"></i>
          <a href={`tel:${clinic.phone}`} onClick={(e) => e.stopPropagation()}>
            {clinic.phone}
          </a>
        </p>
      )}

      <p className="clinic-card__hours text-muted small mb-2">
        <i className="bi bi-clock me-1" aria-hidden="true"></i>
        Contact clinic for opening hours
      </p>

      {travel && (
        <div className="clinic-card__estimates d-flex flex-wrap gap-2 mb-3">
          <span className="clinic-card__estimate">
            <i className="bi bi-person-walking me-1" aria-hidden="true"></i>
            ~{travel.walkingMins} min walk
          </span>
          <span className="clinic-card__estimate">
            <i className="bi bi-car-front me-1" aria-hidden="true"></i>
            ~{travel.drivingMins} min drive
          </span>
        </div>
      )}

      <div className="clinic-card__actions d-flex flex-wrap gap-2">
        <ClinicDirectionsButton
          clinic={clinic}
          userLocation={userLocation}
          variant="directions"
        />
        <ClinicDirectionsButton
          clinic={clinic}
          userLocation={userLocation}
          variant="view"
        />
      </div>
    </article>
  );
}
