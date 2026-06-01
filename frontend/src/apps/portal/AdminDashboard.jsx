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
    if (!confirm('Are you sure you want to delete this clinic location?')) return;
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
        {/* Title Block */}
        <div className="section-title text-start mb-4">
          <h2 className="text-dark fw-bold" style={{ fontSize: '28px', letterSpacing: '-0.5px' }}>
            Admin Management Portal
          </h2>
          <p className="text-muted">
            Manage system database tables, review patient mole scans, and administer clinic coordinates.
          </p>
        </div>

        {/* Tab Headers */}
        <ul className="nav nav-tabs portal-tabs mb-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link pb-3 px-3 ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
              style={{ fontSize: '15px' }}
            >
              <i className="bi bi-people me-2"></i> User & Scan Database
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link pb-3 px-3 ${activeTab === 'clinics' ? 'active' : ''}`}
              onClick={() => setActiveTab('clinics')}
              style={{ fontSize: '15px' }}
            >
              <i className="bi bi-geo-alt me-2"></i> Clinic Management
            </button>
          </li>
        </ul>

        {/* TAB 1: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="row g-4">
            {/* User List Panel */}
            <div className="col-lg-5">
              <div className="portal-card" style={{ border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                <h4 className="portal-card-title d-flex align-items-center mb-3">
                  <i className="bi bi-person-lines-fill text-accent me-2"></i> Registered Patients
                </h4>
                {usersLoading && <p className="text-muted small">Retrieving users list...</p>}
                {usersError && <div className="alert alert-danger small p-2">{usersError}</div>}
                
                <div className="table-responsive" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                  <table className="table portal-table align-middle" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Patient Name</th>
                        <th className="text-center">Scans</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center text-muted py-3">No registered users found.</td>
                        </tr>
                      ) : (
                        users.map((entry) => (
                          <tr 
                            key={entry.id}
                            style={{ 
                              backgroundColor: selectedUserId === entry.id ? 'rgba(63, 187, 192, 0.05)' : 'transparent',
                              transition: 'background-color 0.2s'
                            }}
                          >
                            <td>
                              <span className="fw-semibold text-dark d-block">
                                {entry.first_name} {entry.last_name}
                              </span>
                              <span className="text-muted small" style={{ fontSize: '11px' }}>{entry.email}</span>
                            </td>
                            <td className="text-center">
                              <span className="badge rounded-pill bg-light text-dark border px-2 py-1">
                                {entry.scan_count}
                              </span>
                            </td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-accent btn-sm rounded-pill py-1 px-3"
                                onClick={() => loadUserDetail(entry.id)}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* User Detail & Scan List Panel */}
            <div className="col-lg-7">
              <div className="portal-card" style={{ border: '1px solid #e2e8f0', borderRadius: '16px', minHeight: '400px' }}>
                <h4 className="portal-card-title d-flex align-items-center mb-3">
                  <i className="bi bi-file-medical text-accent me-2"></i> Clinical Record Details
                </h4>

                {detailLoading && (
                  <div className="text-center py-5">
                    <span className="spinner-border text-accent mb-2" role="status"></span>
                    <p className="text-muted small">Loading user session profile...</p>
                  </div>
                )}

                {!selectedUserId && !detailLoading && (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-person-badge-fill fs-1 opacity-50 mb-2"></i>
                    <p>Select a patient from the database table to review scan logs and PDF reports.</p>
                  </div>
                )}

                {userDetail?.user && !detailLoading && (
                  <div>
                    {/* Patient Profile Card Header */}
                    <div className="d-flex align-items-center mb-4 p-3 bg-light rounded-4 border border-light" style={{ gap: '16px' }}>
                      <div className="bg-accent text-white d-flex align-items-center justify-content-center shadow-sm" style={{ borderRadius: '50%', width: '56px', height: '56px', fontSize: '20px', fontWeight: 'bold' }}>
                        {(userDetail.user.first_name?.[0] || userDetail.user.email?.[0] || 'U').toUpperCase()}
                      </div>
                      <div>
                        <h5 className="text-dark mb-1 fw-bold">
                          {userDetail.user.first_name} {userDetail.user.last_name}
                        </h5>
                        <p className="text-muted small mb-1" style={{ fontSize: '12px' }}>
                          <i className="bi bi-envelope me-1"></i> {userDetail.user.email}
                        </p>
                        <p className="text-muted small mb-0" style={{ fontSize: '12px' }}>
                          <i className="bi bi-geo-alt me-1"></i>{' '}
                          {userDetail.user.latitude != null
                            ? `Lat: ${userDetail.user.latitude.toFixed(4)}, Lng: ${userDetail.user.longitude.toFixed(4)}`
                            : 'Coordinates not shared'}
                        </p>
                      </div>
                    </div>

                    <h5 className="text-dark fw-bold mb-3" style={{ fontSize: '15px' }}>Scan History Logs</h5>
                    
                    {/* Scan Grid */}
                    {(!userDetail.scans?.items || userDetail.scans.items.length === 0) ? (
                      <p className="text-muted small py-4 text-center">No scans recorded for this patient.</p>
                    ) : (
                      <div className="row g-3">
                        {userDetail.scans.items.map((scan) => (
                          <div className="col-md-6" key={scan.id}>
                            <div className="card h-100 border shadow-none" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                              <div className="position-relative" style={{ height: '140px', backgroundColor: '#f8fafc' }}>
                                {scan.images?.[0]?.image_url ? (
                                  <img
                                    src={scanImageUrl(scan.images[0].image_url)}
                                    className="w-100 h-100"
                                    style={{ objectFit: 'cover' }}
                                    alt="Mole Scan"
                                  />
                                ) : (
                                  <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted small">
                                    <i className="bi bi-image me-1"></i> No image thumbnail
                                  </div>
                                )}
                                <span 
                                  className={`position-absolute top-0 end-0 m-2 badge bg-${riskBadgeClass(scan.risk_level)}`}
                                  style={{ padding: '6px 10px', borderRadius: '30px' }}
                                >
                                  {scan.risk_level || scan.status}
                                </span>
                              </div>
                              <div className="card-body p-3">
                                <span className="text-muted small d-block mb-1" style={{ fontSize: '11px' }}>
                                  <i className="bi bi-calendar3 me-1"></i> {new Date(scan.scan_date).toLocaleString()}
                                </span>
                                <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '14px' }}>
                                  {scan.classification_label || 'Analysis pending'}
                                </h6>
                                <p className="text-muted small mb-2" style={{ fontSize: '11.5px', lineHeight: '1.4' }}>
                                  Confidence: {scan.confidence_score != null ? `${scan.confidence_score}%` : 'N/A'}
                                </p>
                                <p className="text-muted small mb-3 text-truncate" style={{ fontSize: '11.5px' }}>
                                  {scan.report_summary || 'No report summary available.'}
                                </p>
                                {scan.report_url && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-accent btn-sm w-100 rounded-pill"
                                    onClick={() => mvcApi.downloadAdminUserScanReport(userDetail.user.id, scan.id)}
                                    style={{ fontSize: '12px' }}
                                  >
                                    <i className="bi bi-file-earmark-pdf me-1"></i> Download PDF Report
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLINIC MANAGEMENT */}
        {activeTab === 'clinics' && (
          <div className="row g-4">
            {/* Create / Edit Form Panel */}
            <div className="col-lg-5">
              <div className="portal-card" style={{ border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                <h4 className="portal-card-title d-flex align-items-center mb-3">
                  <i className="bi bi-plus-circle text-accent me-2"></i>
                  {editingClinicId ? 'Modify Clinic Record' : 'Register New Clinic'}
                </h4>
                
                {clinicMessage && (
                  <div className={`alert small p-2 ${clinicMessage.includes('successfully') ? 'alert-success' : 'alert-danger'}`}>
                    {clinicMessage}
                  </div>
                )}

                <form onSubmit={handleClinicSubmit}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Clinic Name</label>
                    <input
                      className="form-control form-control-sm"
                      value={clinicForm.name}
                      onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                      placeholder="e.g. City Dermatology Center"
                      required
                      style={{ borderRadius: '8px' }}
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Address</label>
                      <input
                        className="form-control form-control-sm"
                        value={clinicForm.address}
                        onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                        placeholder="Street address"
                        required
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">City</label>
                      <input
                        className="form-control form-control-sm"
                        value={clinicForm.city}
                        onChange={(e) => setClinicForm({ ...clinicForm, city: e.target.value })}
                        placeholder="City"
                        required
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control form-control-sm"
                        value={clinicForm.latitude}
                        onChange={(e) => setClinicForm({ ...clinicForm, latitude: Number(e.target.value) })}
                        required
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control form-control-sm"
                        value={clinicForm.longitude}
                        onChange={(e) => setClinicForm({ ...clinicForm, longitude: Number(e.target.value) })}
                        required
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Telephone Contact</label>
                    <input
                      className="form-control form-control-sm"
                      value={clinicForm.phone}
                      onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                      placeholder="e.g. +1 (555) 019-2834"
                      style={{ borderRadius: '8px' }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary d-block">Geolocation Coordinate Picker</label>
                    <ClinicMapPicker
                      latitude={clinicForm.latitude}
                      longitude={clinicForm.longitude}
                      onChange={({ latitude, longitude }) =>
                        setClinicForm((prev) => ({ ...prev, latitude, longitude }))
                      }
                    />
                    <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                      Drag the red map pin or click anywhere to capture latitude and longitude.
                    </small>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-accent btn-sm rounded-pill px-4">
                      {editingClinicId ? 'Update Record' : 'Register Location'}
                    </button>
                    {editingClinicId && (
                      <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={resetClinicForm}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Clinic List Panel */}
            <div className="col-lg-7">
              <div className="portal-card" style={{ border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                <h4 className="portal-card-title d-flex align-items-center mb-3">
                  <i className="bi bi-geo-alt-fill text-accent me-2"></i> All Clinic Locations
                </h4>
                {clinicsLoading && <p className="text-muted small">Loading coordinates...</p>}
                {clinicsError && <div className="alert alert-danger small p-2">{clinicsError}</div>}
                
                <div className="table-responsive">
                  <table className="table portal-table align-middle" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Clinic Details</th>
                        <th>Location Coordinates</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clinics.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center text-muted py-3">No clinics registered in database.</td>
                        </tr>
                      ) : (
                        clinics.map((clinic) => (
                          <tr key={clinic.id}>
                            <td>
                              <strong className="text-dark d-block">{clinic.name}</strong>
                              <span className="text-muted small d-block" style={{ fontSize: '11.5px' }}>
                                {clinic.address}, {clinic.city}
                              </span>
                              {clinic.phone && (
                                <span className="text-muted small d-block" style={{ fontSize: '11.5px' }}>
                                  <i className="bi bi-telephone-fill me-1" style={{ fontSize: '10px' }}></i> {clinic.phone}
                                </span>
                              )}
                            </td>
                            <td>
                              <span className="font-monospace small text-dark d-block">
                                {clinic.latitude.toFixed(5)}, {clinic.longitude.toFixed(5)}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${clinic.is_active ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'} border px-2 py-1`} style={{ borderRadius: '4px', fontSize: '11px' }}>
                                {clinic.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="text-end">
                              <div className="d-flex justify-content-end gap-1.5">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-accent rounded-pill py-1 px-3"
                                  onClick={() => handleEditClinic(clinic)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger rounded-pill py-1 px-3"
                                  onClick={() => handleDeleteClinic(clinic.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
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
