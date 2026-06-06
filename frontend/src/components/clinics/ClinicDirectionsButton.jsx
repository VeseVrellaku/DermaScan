import { openGoogleMapsNavigation, openGoogleMapsView } from '../../utils/googleMaps';

/**
 * @param {{
 *   clinic: { latitude?: number | null, longitude?: number | null },
 *   userLocation?: { latitude?: number | null, longitude?: number | null } | null,
 *   variant?: 'directions' | 'view',
 *   size?: 'sm' | 'md',
 *   className?: string,
 *   onClick?: () => void,
 * }} props
 */
export default function ClinicDirectionsButton({
  clinic,
  userLocation = null,
  variant = 'directions',
  size = 'sm',
  className = '',
  onClick,
}) {
  const hasCoordinates = clinic?.latitude != null && clinic?.longitude != null;

  const handleClick = (event) => {
    event.stopPropagation();
    if (!hasCoordinates) return;
    onClick?.();
    const destination = { latitude: clinic.latitude, longitude: clinic.longitude };
    const origin =
      userLocation?.latitude != null && userLocation?.longitude != null
        ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
        : null;

    if (variant === 'view') {
      openGoogleMapsView(destination);
    } else {
      openGoogleMapsNavigation(destination, origin);
    }
  };

  const sizeClass = size === 'md' ? 'btn-md' : 'btn-sm';
  const label = variant === 'view' ? 'View on Map' : 'Get Directions';
  const icon = variant === 'view' ? 'bi-geo-alt' : 'bi-sign-turn-right';

  return (
    <button
      type="button"
      className={`btn ${sizeClass} ${variant === 'view' ? 'btn-outline-accent' : 'btn-accent'} ${className}`.trim()}
      onClick={handleClick}
      disabled={!hasCoordinates}
      aria-label={label}
    >
      <i className={`bi ${icon} me-1`} aria-hidden="true"></i>
      {label}
    </button>
  );
}
