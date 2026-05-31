import { useCallback, useEffect, useState } from 'react';
import ClinicMapPicker from '../../components/admin/ClinicMapPicker';
import { mvcApi, riskBadgeClass, scanImageUrl } from '../../services/mvcApi';

const emptyClinicForm = {
  name: '',
  address: '',
  city: '',
  latitude: 41.3275,
  longitude: 19.8187,
  phone: '',
  is_active: true,
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [clinics, setClinics] = useState([]);
  const [clinicsLoading, setClinicsLoading] = useState(false);
  const [clinicsError, setClinicsError] = useState('');
  const [clinicForm, setClinicForm] = useState(emptyClinicForm);
  const [editingClinicId, setEditingClinicId] = useState(null);
  const [clinicMessage, setClinicMessage] = useState('');

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const response = await mvcApi.listAdminUsers(1, 50);
      setUsers(response.items || []);
    } catch (error) {
      setUsersError(error.message || 'Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadClinics = useCallback(async () => {
    setClinicsLoading(true);
    setClinicsError('');
    try {
      const response = await mvcApi.listAdminClinics(1, 50);
      setClinics(response.items || []);
    } catch (error) {
      setClinicsError(error.message || 'Failed to load clinics.');
    } finally {
      setClinicsLoading(false);
    }
  }, []);

  const loadUserDetail = useCallback(async (userId) => {
    setDetailLoading(true);
    try {
      const detail = await mvcApi.getAdminUser(userId, 1, 50);
      setUserDetail(detail);
      setSelectedUserId(userId);
    } catch (error) {
      setUsersError(error.message || 'Failed to load user details.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'clinics') loadClinics();
  }, [activeTab, loadUsers, loadClinics]);

  const resetClinicForm = () => {
    setClinicForm(emptyClinicForm);
    setEditingClinicId(null);
    setClinicMessage('');
  };

  const handleClinicSubmit = async (event) => {
    event.preventDefault();
    setClinicMessage('');
    try {
      if (editingClinicId) {
        await mvcApi.updateClinic(editingClinicId, clinicForm);
        setClinicMessage('Clinic updated successfully.');
      } else {
        await mvcApi.createClinic(clinicForm);
        setClinicMessage('Clinic created successfully.');
      }
      resetClinicForm();
      loadClinics();
    } catch (error) {
      setClinicMessage(error.message || 'Clinic save failed.');
    }
  };

  const handleEditClinic = (clinic) => {
    setEditingClinicId(clinic.id);
    setClinicForm({
      name: clinic.name,
      address: clinic.address,
      city: clinic.city,
      latitude: clinic.latitude,
      longitude: clinic.longitude,
      phone: clinic.phone || '',
      is_active: clinic.is_active,
    });
  };

  const handleDeleteClinic = async (clinicId) => {
    if (!confirm('Delete this clinic?')) return;
    try {
      await mvcApi.deleteClinic(clinicId);
      loadClinics();
    } catch (error) {
      setClinicsError(error.message || 'Delete failed.');
    }
  };

  return (
    <section className="section portal-section">
      <div className="container">
        <div className="section-title">
          <h2 className="text-dark">Admin Dashboard</h2>
          <p>Manage registered users, scan activity, and clinic locations.</p>
        </div>

        <ul className="nav nav-tabs portal-tabs mb-4">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              User Management
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link ${activeTab === 'clinics' ? 'active' : ''}`}
              onClick={() => setActiveTab('clinics')}
            >
              Clinic Management
            </button>
          </li>
        </ul>

        {activeTab === 'users' && (
          <div className="row g-4">
            <div className="col-lg-5">
              <div className="portal-card">
                <h4 className="portal-card-title">Registered Users</h4>
                {usersLoading && <p className="text-muted">Loading users...</p>}
                {usersError && <div className="alert alert-danger">{usersError}</div>}
                <div className="table-responsive">
                  <table className="table portal-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Scans</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((entry) => (
                        <tr key={entry.id}>
                          <td>{entry.first_name} {entry.last_name}</td>
                          <td>{entry.email}</td>
                          <td>{entry.scan_count}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-accent"
                              onClick={() => loadUserDetail(entry.id)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="portal-card">
                <h4 className="portal-card-title">User Details</h4>
                {detailLoading && <p className="text-muted">Loading user details...</p>}
                {!selectedUserId && !detailLoading && (
                  <p className="text-muted mb-0">Select a user to view scan history, images, and reports.</p>
                )}
                {userDetail?.user && (
                  <>
                    <div className="mb-3">
                      <h5 className="text-dark mb-1">
                        {userDetail.user.first_name} {userDetail.user.last_name}
                      </h5>
                      <p className="text-muted small mb-1">{userDetail.user.email}</p>
                      <p className="text-muted small mb-0">
                        Location:{' '}
                        {userDetail.user.latitude != null
                          ? `${userDetail.user.latitude.toFixed(4)}, ${userDetail.user.longitude.toFixed(4)}`
                          : 'Not provided'}
                      </p>
                    </div>

                    <div className="history-grid">
                      {(userDetail.scans?.items || []).map((scan) => (
                        <div className="history-card" key={scan.id}>
                          <div className="history-image-container">
                            {scan.images?.[0]?.image_url ? (
                              <img
                                src={scanImageUrl(scan.images[0].image_url)}
                                className="history-image"
                                alt="Scan"
                              />
                            ) : (
                              <div className="history-image-placeholder">No image</div>
                            )}
                          </div>
                          <div className="history-details">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="text-muted small">
                                {new Date(scan.scan_date).toLocaleString()}
                              </span>
                              <span className={`badge bg-${riskBadgeClass(scan.risk_level)}`}>
                                {scan.risk_level || scan.status}
                              </span>
                            </div>
                            <h6 className="text-dark">{scan.classification_label || 'Pending analysis'}</h6>
                            <p className="small text-muted mb-2">
                              Confidence: {scan.confidence_score != null ? `${scan.confidence_score}%` : 'N/A'}
                            </p>
                            <p className="small text-muted mb-3">{scan.report_summary}</p>
                            {scan.report_url && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-accent"
                                onClick={() => mvcApi.downloadAdminUserScanReport(userDetail.user.id, scan.id)}
                              >
                                <i className="bi bi-file-earmark-pdf me-1"></i>
                                Download PDF
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clinics' && (
          <div className="row g-4">
            <div className="col-lg-5">
              <div className="portal-card">
                <h4 className="portal-card-title">
                  {editingClinicId ? 'Edit Clinic' : 'Create Clinic'}
                </h4>
                {clinicMessage && (
                  <div className={`alert ${clinicMessage.includes('success') ? 'alert-success' : 'alert-danger'}`}>
                    {clinicMessage}
                  </div>
                )}
                <form onSubmit={handleClinicSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Clinic Name</label>
                    <input
                      className="form-control"
                      value={clinicForm.name}
                      onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <input
                      className="form-control"
                      value={clinicForm.address}
                      onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">City</label>
                    <input
                      className="form-control"
                      value={clinicForm.city}
                      onChange={(e) => setClinicForm({ ...clinicForm, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="form-label">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        value={clinicForm.latitude}
                        onChange={(e) => setClinicForm({ ...clinicForm, latitude: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        value={clinicForm.longitude}
                        onChange={(e) => setClinicForm({ ...clinicForm, longitude: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      className="form-control"
                      value={clinicForm.phone}
                      onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Map Location</label>
                    <ClinicMapPicker
                      latitude={clinicForm.latitude}
                      longitude={clinicForm.longitude}
                      onChange={({ latitude, longitude }) =>
                        setClinicForm((prev) => ({ ...prev, latitude, longitude }))
                      }
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-accent">
                      {editingClinicId ? 'Update Clinic' : 'Create Clinic'}
                    </button>
                    {editingClinicId && (
                      <button type="button" className="btn btn-outline-secondary" onClick={resetClinicForm}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="portal-card">
                <h4 className="portal-card-title">All Clinics</h4>
                {clinicsLoading && <p className="text-muted">Loading clinics...</p>}
                {clinicsError && <div className="alert alert-danger">{clinicsError}</div>}
                <div className="table-responsive">
                  <table className="table portal-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>City</th>
                        <th>Coordinates</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {clinics.map((clinic) => (
                        <tr key={clinic.id}>
                          <td>{clinic.name}</td>
                          <td>{clinic.city}</td>
                          <td>{clinic.latitude.toFixed(4)}, {clinic.longitude.toFixed(4)}</td>
                          <td>{clinic.is_active ? 'Active' : 'Inactive'}</td>
                          <td className="text-nowrap">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-accent me-2"
                              onClick={() => handleEditClinic(clinic)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteClinic(clinic.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
