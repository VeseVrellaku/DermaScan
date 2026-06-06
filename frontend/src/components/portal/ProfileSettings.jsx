import { useEffect, useState } from 'react';
import { mvcApi } from '../../services/mvcApi';

/**
 * @param {{
 *   user: { id: string, name?: string, email: string, city?: string | null },
 *   onUserUpdated: (user: object) => void,
 *   onUseMyLocation: () => void,
 *   locationStatus?: string,
 *   locationMessage?: string,
 * }} props
 */
export default function ProfileSettings({
  user,
  onUserUpdated,
  onUseMyLocation,
  locationStatus = 'idle',
  locationMessage = '',
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    mvcApi.me()
      .then((profile) => {
        if (cancelled) return;
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setPhone(profile.phone || '');
        setCity(profile.city || '');
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load profile.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updated = await mvcApi.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
      });
      onUserUpdated(updated);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="portal-card text-center py-5">
        <div className="spinner-border text-accent mb-3" role="status" aria-label="Loading profile" />
        <p className="text-muted mb-0">Loading profile settings...</p>
      </div>
    );
  }

  return (
    <div className="portal-card">
      <div className="section-title text-start mb-4">
        <h2 className="text-dark h4 mb-1">Profile Settings</h2>
        <p className="text-muted small mb-0">Manage your account details and location preferences.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label" htmlFor="profile-first-name">First Name</label>
            <input
              id="profile-first-name"
              className="form-control"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="profile-last-name">Last Name</label>
            <input
              id="profile-last-name"
              className="form-control"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="profile-email">Email</label>
            <input id="profile-email" className="form-control" value={user.email} disabled readOnly />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="profile-phone">Phone</label>
            <input
              id="profile-phone"
              className="form-control"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="profile-city">City</label>
            <input
              id="profile-city"
              className="form-control"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-top">
          <h5 className="text-dark h6 mb-2">Location for Clinic Recommendations</h5>
          <p className="text-muted small mb-3">
            Share your location to improve nearby clinic suggestions and Google Maps directions.
          </p>
          <button
            type="button"
            className="btn btn-outline-accent"
            onClick={onUseMyLocation}
            disabled={locationStatus === 'loading'}
          >
            {locationStatus === 'loading' ? 'Getting Location...' : 'Update My Location'}
          </button>
          {locationMessage && <p className="small mt-2 mb-0 text-muted">{locationMessage}</p>}
        </div>

        <div className="mt-4">
          <button type="submit" className="btn btn-accent" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
