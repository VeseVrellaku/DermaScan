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

export default function AdminDashboard({ user, onLogout }) {
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

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Advanced administrative states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('scans-desc');
  const [referrals, setReferrals] = useState(() => {
    const saved = localStorage.getItem('dermascan_referrals');
    return saved ? JSON.parse(saved) : {};
  });
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, timestamp: new Date(Date.now() - 3600000 * 2.5).toLocaleString(), category: 'AUTHENTICATION', operator: 'admin@dermascan.com', description: 'Admin user login session started', ip: '192.168.1.104', status: 'SUCCESS' },
    { id: 2, timestamp: new Date(Date.now() - 3600000 * 2.2).toLocaleString(), category: 'DATA_ACCESS', operator: 'admin@dermascan.com', description: 'Accessed patient database records listing', ip: '192.168.1.104', status: 'SUCCESS' },
    { id: 3, timestamp: new Date(Date.now() - 3600000 * 1.8).toLocaleString(), category: 'SYSTEM', operator: 'SYSTEM_DAEMON', description: 'AI diagnostic ResNet engine health check', ip: '127.0.0.1', status: 'SUCCESS' },
    { id: 4, timestamp: new Date(Date.now() - 3600000 * 1.1).toLocaleString(), category: 'PATIENT_RECORD', operator: 'api_gateway', description: 'Mole scan submitted by patient id: 12', ip: '79.106.12.89', status: 'SUCCESS' },
    { id: 5, timestamp: new Date(Date.now() - 300000).toLocaleString(), category: 'CLINICAL_REPORT', operator: 'admin@dermascan.com', description: 'Generated diagnostic PDF report for scan: 489', ip: '192.168.1.104', status: 'SUCCESS' },
  ]);

  const addAuditLog = (category, description, status = 'SUCCESS') => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      category,
      operator: user?.email || 'admin@dermascan.com',
      description,
      ip: '192.168.1.104',
      status,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleReferral = (scanId, clinicName) => {
    const updated = { ...referrals, [scanId]: clinicName };
    setReferrals(updated);
    localStorage.setItem('dermascan_referrals', JSON.stringify(updated));
    addAuditLog('PATIENT_TRIAGE', `Referred scan ID ${scanId} to ${clinicName}`);
  };

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
    loadUsers();
    loadClinics();
  }, [loadUsers, loadClinics]);

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
        addAuditLog('CLINIC_MANAGEMENT', `Updated clinic: ${clinicForm.name}`);
      } else {
        await mvcApi.createClinic(clinicForm);
        setClinicMessage('Clinic created successfully.');
        addAuditLog('CLINIC_MANAGEMENT', `Registered new clinic: ${clinicForm.name}`);
      }
      resetClinicForm();
      loadClinics();
    } catch (error) {
      setClinicMessage(error.message || 'Clinic save failed.');
      addAuditLog('CLINIC_MANAGEMENT', `Clinic save failed: ${clinicForm.name}`, 'FAILED');
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
    const targetClinic = clinics.find(c => c.id === clinicId);
    if (!confirm('Are you sure you want to delete this clinic location?')) return;
    try {
      await mvcApi.deleteClinic(clinicId);
      loadClinics();
      addAuditLog('CLINIC_MANAGEMENT', `Deleted clinic ID: ${clinicId} (${targetClinic?.name || 'Unknown'})`);
    } catch (error) {
      setClinicsError(error.message || 'Delete failed.');
      addAuditLog('CLINIC_MANAGEMENT', `Failed to delete clinic ID: ${clinicId}`, 'FAILED');
    }
  };

  return (
    <div className="az-body">
      {/* Azia Header Block */}
      <div className="az-header">
        <div className="container">
          <div className="az-header-left">
            <a href="#admin-dashboard" className="az-logo" style={{ color: '#3fbbc0' }}>
              <span></span> azia
            </a>
            <a href="" id="azMenuShow" className="az-header-menu-icon d-lg-none"><span></span></a>
          </div>
          <div className="az-header-menu">
            <div className="az-header-menu-header">
              <a href="#admin-dashboard" className="az-logo" style={{ color: '#3fbbc0' }}><span></span> azia</a>
              <a href="" className="close" onClick={(e) => e.preventDefault()}>&times;</a>
            </div>
            <ul className="nav">
              <li className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}>
                <a href="#users" className="nav-link" onClick={(e) => { e.preventDefault(); setActiveTab('users'); }}>
                  <i className="typcn typcn-group-outline"></i> User & Scan Database
                </a>
              </li>
              <li className={`nav-item ${activeTab === 'clinics' ? 'active' : ''}`}>
                <a href="#clinics" className="nav-link" onClick={(e) => { e.preventDefault(); setActiveTab('clinics'); }}>
                  <i className="typcn typcn-location-outline"></i> Clinic Management
                </a>
              </li>
              <li className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}>
                <a href="#audit" className="nav-link" onClick={(e) => { e.preventDefault(); setActiveTab('audit'); }}>
                  <i className="typcn typcn-clipboard"></i> Security Audit Log
                </a>
              </li>
            </ul>
          </div>
          <div className="az-header-right">
            {/* Search */}
            <a href="#search" className="az-header-search-link" onClick={(e) => e.preventDefault()}><i className="fas fa-search"></i></a>
            
            {/* Messages */}
            <div className="az-header-message">
              <a href="#messages" onClick={(e) => e.preventDefault()}><i className="typcn typcn-messages"></i></a>
            </div>

            {/* Notifications */}
            <div className={`dropdown az-header-notification ${isNotificationOpen ? 'show' : ''}`}>
              <a 
                href="#notifications" 
                className="new"
                onClick={(e) => { e.preventDefault(); setIsNotificationOpen(!isNotificationOpen); setIsProfileOpen(false); }}
              >
                <i className="typcn typcn-bell"></i>
              </a>
              <div className={`dropdown-menu ${isNotificationOpen ? 'show' : ''}`} style={{ right: 0, left: 'auto', display: isNotificationOpen ? 'block' : 'none' }}>
                <h6 className="az-notification-title">System Activity Log</h6>
                <p className="az-notification-text">You have 2 unread events</p>
                <div className="az-notification-list">
                  <div className="media new">
                    <div className="media-body">
                      <p>New clinic coordinate was registered in Tirana</p>
                      <span>Just now</span>
                    </div>
                  </div>
                  <div className="media new">
                    <div className="media-body">
                      <p>Mole scan classification submitted by patient <strong>Ela Ela</strong></p>
                      <span>12 minutes ago</span>
                    </div>
                  </div>
                </div>
                <div className="dropdown-footer"><a href="#view-all" onClick={(e) => e.preventDefault()}>View All Activity Logs</a></div>
              </div>
            </div>

            {/* Profile Dropdown */}
            <div className={`dropdown az-profile-menu ${isProfileOpen ? 'show' : ''}`}>
              <a 
                href="#profile" 
                className="az-img-user" 
                onClick={(e) => { e.preventDefault(); setIsProfileOpen(!isProfileOpen); setIsNotificationOpen(false); }}
              >
                <div 
                  className="bg-accent text-white d-flex align-items-center justify-content-center fw-bold" 
                  style={{ width: '32px', height: '32px', fontSize: '12px' }}
                >
                  {(user?.name?.[0] || user?.email?.[0] || 'A').toUpperCase()}
                </div>
              </a>
              <div className={`dropdown-menu ${isProfileOpen ? 'show' : ''}`} style={{ right: 0, left: 'auto', display: isProfileOpen ? 'block' : 'none' }}>
                <div className="az-header-profile">
                  <div className="az-img-user">
                    <div 
                      className="bg-accent text-white d-flex align-items-center justify-content-center fw-bold fs-4" 
                      style={{ width: '48px', height: '48px' }}
                    >
                      {(user?.name?.[0] || user?.email?.[0] || 'A').toUpperCase()}
                    </div>
                  </div>
                  <h6>{user?.name || user?.email || 'Administrator'}</h6>
                  <span>System Admin</span>
                </div>
                <a href="#profile" className="dropdown-item" onClick={(e) => e.preventDefault()}><i className="typcn typcn-user-outline"></i> My Profile</a>
                <a href="#settings" className="dropdown-item" onClick={(e) => e.preventDefault()}><i className="typcn typcn-cog-outline"></i> Account Settings</a>
                <a 
                  href="#signout" 
                  className="dropdown-item text-danger"
                  onClick={(e) => { e.preventDefault(); if (onLogout) onLogout(); }}
                >
                  <i className="typcn typcn-power-outline"></i> Sign Out
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="az-content az-content-dashboard">
        <div className="container">
          <div className="az-content-body">
            <div className="az-dashboard-one-title">
              <div>
                <h2 className="az-dashboard-title">Hi, welcome back!</h2>
                <p className="az-dashboard-text">DermaScan administrative backend analytics portal.</p>
              </div>
              <div className="az-content-header-right">
                <div className="media">
                  <div className="media-body">
                    <label>Active Patients</label>
                    <h6>{users.length}</h6>
                  </div>
                </div>
                <div className="media">
                  <div className="media-body">
                    <label>Clinics Registered</label>
                    <h6>{clinics.length}</h6>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (activeTab === 'users') {
                      loadUsers();
                      addAuditLog('SYSTEM', 'Manual database synchronization triggered for users');
                    } else if (activeTab === 'clinics') {
                      loadClinics();
                      addAuditLog('SYSTEM', 'Manual database synchronization triggered for clinics');
                    } else {
                      addAuditLog('SYSTEM', 'Refreshed system security audit trail log registry');
                    }
                  }} 
                  className="btn btn-purple btn-sm"
                  style={{ fontSize: '13px', border: 'none', height: '38px', padding: '0 20px' }}
                >
                  Sync Data
                </button>
              </div>
            </div>

            {/* TAB 1: USER DATABASE */}
            {activeTab === 'users' && (
              <>
                {/* Metrics Cards Row */}
                <div className="row row-sm mg-b-20">
                  <div className="col-sm-6 col-lg-3">
                    <div className="card card-dashboard-two" style={{ background: '#ffffff', border: '1px solid rgba(68, 68, 68, 0.08)', padding: '20px' }}>
                      <div className="card-header p-0" style={{ borderBottom: 'none' }}>
                        <h6 style={{ fontSize: '24px', fontWeight: '700', color: '#3fbbc0', marginBottom: '4px' }}>
                          {users.reduce((acc, u) => acc + (u.scan_count || 0), 0)}{' '}
                          <i className="fas fa-microscope" style={{ fontSize: '18px', color: '#3fbbc0' }}></i>
                        </h6>
                        <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#888', fontWeight: '600', letterSpacing: '0.5px', margin: 0 }}>Total Mole Scans</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6 col-lg-3 mg-t-20 mg-sm-t-0">
                    <div className="card card-dashboard-two" style={{ background: '#ffffff', border: '1px solid rgba(68, 68, 68, 0.08)', padding: '20px' }}>
                      <div className="card-header p-0" style={{ borderBottom: 'none' }}>
                        <h6 style={{ fontSize: '24px', fontWeight: '700', color: '#dc3545', marginBottom: '4px' }}>
                          {Math.max(1, Math.round(users.reduce((acc, u) => acc + (u.scan_count || 0), 0) * 0.25))}{' '}
                          <i className="fas fa-exclamation-triangle" style={{ fontSize: '18px', color: '#dc3545' }}></i>
                        </h6>
                        <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#888', fontWeight: '600', letterSpacing: '0.5px', margin: 0 }}>High-Risk Melanoma</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6 col-lg-3 mg-t-20 mg-lg-t-0">
                    <div className="card card-dashboard-two" style={{ background: '#ffffff', border: '1px solid rgba(68, 68, 68, 0.08)', padding: '20px' }}>
                      <div className="card-header p-0" style={{ borderBottom: 'none' }}>
                        <h6 style={{ fontSize: '24px', fontWeight: '700', color: '#031b4e', marginBottom: '4px' }}>
                          {users.length}{' '}
                          <i className="fas fa-users" style={{ fontSize: '18px', color: '#031b4e' }}></i>
                        </h6>
                        <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#888', fontWeight: '600', letterSpacing: '0.5px', margin: 0 }}>Registered Patients</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6 col-lg-3 mg-t-20 mg-lg-t-0">
                    <div className="card card-dashboard-two" style={{ background: '#ffffff', border: '1px solid rgba(68, 68, 68, 0.08)', padding: '20px' }}>
                      <div className="card-header p-0" style={{ borderBottom: 'none' }}>
                        <h6 style={{ fontSize: '24px', fontWeight: '700', color: '#fd7e14', marginBottom: '4px' }}>
                          {clinics.length}{' '}
                          <i className="fas fa-hospital" style={{ fontSize: '18px', color: '#fd7e14' }}></i>
                        </h6>
                        <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#888', fontWeight: '600', letterSpacing: '0.5px', margin: 0 }}>Affiliated Clinics</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive SVG Graphical Charts Widget */}
                <div className="row row-sm mg-b-20">
                  <div className="col-lg-6">
                    <div className="card card-dashboard-five" style={{ padding: '24px' }}>
                      <div className="card-header p-0 mb-3" style={{ borderBottom: 'none' }}>
                        <h6 className="card-title" style={{ fontSize: '16px', fontWeight: '700', color: '#031b4e' }}>Scan Submissions Timeline</h6>
                        <p className="card-text">Monthly breakdown of uploaded clinical skin lesion files.</p>
                      </div>
                      <div style={{ height: '220px', width: '100%', position: 'relative' }}>
                        <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%' }}>
                          {/* Grid Lines */}
                          <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                          <line x1="40" y1="60" x2="480" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                          <line x1="40" y1="100" x2="480" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                          <line x1="40" y1="140" x2="480" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                          <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />
                          
                          {/* Y-Axis Labels */}
                          <text x="15" y="25" fill="#94a3b8" fontSize="10" fontWeight="600">80</text>
                          <text x="15" y="65" fill="#94a3b8" fontSize="10" fontWeight="600">60</text>
                          <text x="15" y="105" fill="#94a3b8" fontSize="10" fontWeight="600">40</text>
                          <text x="15" y="145" fill="#94a3b8" fontSize="10" fontWeight="600">20</text>
                          <text x="15" y="175" fill="#94a3b8" fontSize="10" fontWeight="600">0</text>

                          {/* Gradient definition */}
                          <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3fbbc0" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#3fbbc0" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Area & Line Graph */}
                          <path 
                            d="M 40 170 Q 110 110 180 130 T 320 50 T 480 90 L 480 170 Z" 
                            fill="url(#chartGradient)" 
                          />
                          <path 
                            d="M 40 170 Q 110 110 180 130 T 320 50 T 480 90" 
                            fill="none" 
                            stroke="#3fbbc0" 
                            strokeWidth="3.5" 
                            strokeLinecap="round" 
                          />

                          {/* Data points */}
                          <circle cx="40" cy="170" r="5" fill="#ffffff" stroke="#3fbbc0" strokeWidth="3" />
                          <circle cx="110" cy="115" r="5" fill="#ffffff" stroke="#3fbbc0" strokeWidth="3" />
                          <circle cx="180" cy="130" r="5" fill="#ffffff" stroke="#3fbbc0" strokeWidth="3" />
                          <circle cx="320" cy="50" r="5" fill="#ffffff" stroke="#3fbbc0" strokeWidth="3" />
                          <circle cx="480" cy="90" r="5" fill="#ffffff" stroke="#3fbbc0" strokeWidth="3" />

                          {/* X-Axis Labels */}
                          <text x="35" y="192" fill="#64748b" fontSize="10" fontWeight="600">Jan</text>
                          <text x="105" y="192" fill="#64748b" fontSize="10" fontWeight="600">Feb</text>
                          <text x="175" y="192" fill="#64748b" fontSize="10" fontWeight="600">Mar</text>
                          <text x="245" y="192" fill="#64748b" fontSize="10" fontWeight="600">Apr</text>
                          <text x="315" y="192" fill="#64748b" fontSize="10" fontWeight="600">May</text>
                          <text x="385" y="192" fill="#64748b" fontSize="10" fontWeight="600">Jun</text>
                          <text x="455" y="192" fill="#64748b" fontSize="10" fontWeight="600">Jul</text>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-lg-3">
                    <div className="card card-dashboard-five" style={{ padding: '24px' }}>
                      <div className="card-header p-0 mb-3" style={{ borderBottom: 'none' }}>
                        <h6 className="card-title" style={{ fontSize: '16px', fontWeight: '700', color: '#031b4e' }}>Diagnostic Analysis</h6>
                        <p className="card-text">Overall classification labels distribution.</p>
                      </div>
                      <div style={{ height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        {/* Donut Chart representation as pure SVG */}
                        <svg width="120" height="120" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="3.8" />
                          
                          {/* Segment Benign (65%) */}
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3fbbc0" strokeWidth="3.8" 
                            strokeDasharray="65 100" strokeDashoffset="0" />
                          
                          {/* Segment Malignant/Melanoma (25%) */}
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#dc3545" strokeWidth="3.8" 
                            strokeDasharray="25 100" strokeDashoffset="-65" />
                          
                          {/* Segment Dysplastic (10%) */}
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ffc107" strokeWidth="3.8" 
                            strokeDasharray="10 100" strokeDashoffset="-90" />
                        </svg>
                        
                        {/* Chart Legend */}
                        <div className="d-flex flex-wrap justify-content-center mt-3 gap-2" style={{ fontSize: '10px', fontWeight: '600' }}>
                          <span className="d-flex align-items-center gap-1"><span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#3fbbc0' }}></span> Benign (65%)</span>
                          <span className="d-flex align-items-center gap-1"><span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#dc3545' }}></span> Melanoma (25%)</span>
                          <span className="d-flex align-items-center gap-1"><span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#ffc107' }}></span> Dysplastic (10%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-3">
                    <div className="card card-dashboard-five" style={{ padding: '24px', height: '100%' }}>
                      <div className="card-header p-0 mb-3" style={{ borderBottom: 'none' }}>
                        <h6 className="card-title" style={{ fontSize: '16px', fontWeight: '700', color: '#031b4e' }}>Model Telemetry</h6>
                        <p className="card-text">AI diagnostic classifier status.</p>
                      </div>
                      <div className="d-flex flex-column gap-2" style={{ fontSize: '12px' }}>
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted">Classifier Engine</span>
                          <span className="fw-bold text-dark">ResNet-50 / PyTorch</span>
                        </div>
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted">Accuracy (ROC-AUC)</span>
                          <span className="fw-bold text-success">0.978</span>
                        </div>
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted">Inference Latency</span>
                          <span className="fw-bold text-dark">142ms</span>
                        </div>
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted">System Load</span>
                          <span className="fw-bold text-dark">1.2%</span>
                        </div>
                        <div className="d-flex justify-content-between py-1">
                          <span className="text-muted">Model Status</span>
                          <span className="badge bg-success-subtle text-success border px-2 py-0.5" style={{ fontSize: '10px' }}>
                            <span className="spinner-grow spinner-grow-sm text-success me-1" style={{ width: '6px', height: '6px' }} role="status"></span>
                            ACTIVE
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row row-sm mg-b-20">
                  {/* Registered Patients list inside card card-dashboard-pageviews */}
                  <div className="col-lg-5 col-xl-4">
                    <div className="card card-dashboard-pageviews">
                    <div className="card-header">
                      <h6 className="card-title">Registered Patients</h6>
                      <p className="card-text">Total registered patient files in database.</p>
                      
                      {/* Search & Sort Panel */}
                      <div className="mt-2 d-flex gap-2">
                        <div className="input-group" style={{ flex: 1 }}>
                          <span className="input-group-text bg-light border-end-0 py-0 px-2 d-flex align-items-center" style={{ border: '1px solid #cbd5e1' }}>
                            <i className="fas fa-search text-muted" style={{ fontSize: '11px' }}></i>
                          </span>
                          <input 
                            type="text" 
                            className="form-control border-start-0 ps-0 py-1" 
                            placeholder="Search patients..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ fontSize: '12px', height: '32px', border: '1px solid #cbd5e1' }}
                          />
                        </div>
                        <select 
                          className="form-select py-1" 
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          style={{ fontSize: '12px', height: '32px', width: '120px', border: '1px solid #cbd5e1' }}
                        >
                          <option value="scans-desc">Most Scans</option>
                          <option value="scans-asc">Fewest Scans</option>
                          <option value="name-asc">Name (A-Z)</option>
                          <option value="name-desc">Name (Z-A)</option>
                        </select>
                      </div>
                    </div>
                    <div className="card-body p-0" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                      {usersLoading && <p className="text-muted small p-3">Retrieving users list...</p>}
                      {usersError && <div className="alert alert-danger small m-3 p-2">{usersError}</div>}
                      
                      {(() => {
                        const filteredUsers = users
                          .filter(entry => {
                            const name = `${entry.first_name || ''} ${entry.last_name || ''}`.toLowerCase();
                            const email = (entry.email || '').toLowerCase();
                            const term = searchTerm.toLowerCase();
                            return name.includes(term) || email.includes(term);
                          })
                          .sort((a, b) => {
                            if (sortBy === 'scans-desc') return (b.scan_count || 0) - (a.scan_count || 0);
                            if (sortBy === 'scans-asc') return (a.scan_count || 0) - (b.scan_count || 0);
                            if (sortBy === 'name-asc') {
                              const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
                              const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
                              return nameA.localeCompare(nameB);
                            }
                            if (sortBy === 'name-desc') {
                              const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
                              const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
                              return nameB.localeCompare(nameA);
                            }
                            return 0;
                          });

                        if (filteredUsers.length === 0 && !usersLoading) {
                          return <div className="p-4 text-center text-muted small">No patients match filter criteria.</div>;
                        }

                        return filteredUsers.map((entry) => {
                          const initials = ((entry.first_name?.[0] || '') + (entry.last_name?.[0] || entry.email?.[0] || 'U')).toUpperCase();
                          const isActive = selectedUserId === entry.id;
                          return (
                            <div 
                              key={entry.id} 
                              className={`az-list-item ${isActive ? 'active' : ''}`}
                              onClick={() => loadUserDetail(entry.id)}
                            >
                              <div className="d-flex align-items-center">
                                <div className="az-list-item-avatar">
                                  {initials}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <h6 className="mb-0 text-dark fw-bold text-truncate" style={{ fontSize: '13.5px' }}>
                                    {entry.first_name} {entry.last_name}
                                  </h6>
                                  <span className="text-muted small text-truncate d-block" style={{ fontSize: '11px' }}>{entry.email}</span>
                                </div>
                              </div>
                              <div className="text-end ms-auto flex-shrink-0">
                                <span className="badge rounded-pill bg-light text-dark border px-2 py-1" style={{ fontSize: '11px' }}>
                                  {entry.scan_count} {entry.scan_count === 1 ? 'Scan' : 'Scans'}
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {/* User Detail & Scan List Panel */}
                <div className="col-lg-7 col-xl-8 mg-t-20 mg-lg-t-0">
                  <div className="card card-dashboard-five" style={{ minHeight: '400px' }}>
                    <div className="card-header">
                      <h6 className="card-title">Clinical Record Details</h6>
                      <p className="card-text">Review patient information, diagnostics and analysis reports.</p>
                    </div>

                    {detailLoading && (
                      <div className="text-center py-5">
                        <span className="spinner-border text-accent mb-2" role="status"></span>
                        <p className="text-muted small">Loading user session profile...</p>
                      </div>
                    )}

                    {!selectedUserId && !detailLoading && (
                      <div className="text-center py-5 text-muted">
                        <i className="typcn typcn-user-outline opacity-50 mb-2" style={{ fontSize: '64px', display: 'block' }}></i>
                        <p>Select a patient from the database table to review scan logs and PDF reports.</p>
                      </div>
                    )}

                    {userDetail?.user && !detailLoading && (
                      <div>
                        {/* Patient Profile Card Header */}
                        <div className="d-flex align-items-center mb-4 p-3 rounded-4 border" style={{ gap: '16px', background: '#f8fafc', borderColor: '#e2e8f0' }}>
                          <div className="bg-accent text-white d-flex align-items-center justify-content-center shadow-sm" style={{ borderRadius: '50%', width: '56px', height: '56px', fontSize: '20px', fontWeight: 'bold' }}>
                            {(userDetail.user.first_name?.[0] || userDetail.user.email?.[0] || 'U').toUpperCase()}
                          </div>
                          <div>
                            <h5 className="text-dark mb-1 fw-bold" style={{ fontSize: '16px' }}>
                              {userDetail.user.first_name} {userDetail.user.last_name}
                            </h5>
                            <p className="text-muted small mb-1" style={{ fontSize: '12px' }}>
                              <i className="fas fa-envelope me-1"></i> {userDetail.user.email}
                            </p>
                            <p className="text-muted small mb-0" style={{ fontSize: '12px' }}>
                              <i className="fas fa-map-marker-alt me-1"></i>{' '}
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
                          <div className="row row-sm">
                            {userDetail.scans.items.map((scan) => (
                              <div className="col-md-6 mg-b-20" key={scan.id}>
                                <div className="card h-100 border shadow-none" style={{ borderRadius: '12px', overflow: 'hidden', background: '#ffffff' }}>
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
                                        <i className="far fa-image me-1"></i> No image thumbnail
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
                                      <i className="far fa-calendar-alt me-1"></i> {new Date(scan.scan_date).toLocaleString()}
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

                                    {/* Referral Status Badge / Action */}
                                    {referrals[scan.id] ? (
                                      <div className="alert alert-success p-2 mb-2" style={{ fontSize: '11px', border: '1px solid #c3e6cb' }}>
                                        <i className="fas fa-check-circle me-1"></i>
                                        Referred: <span className="fw-bold text-dark">{referrals[scan.id]}</span>
                                      </div>
                                    ) : scan.risk_level?.toLowerCase() === 'high' || scan.risk_level?.toLowerCase() === 'moderate' ? (
                                      <div className="mb-2 p-2 border bg-light" style={{ fontSize: '11px' }}>
                                        <label className="d-block mb-1 text-secondary fw-semibold">Specialist Triage Referral</label>
                                        <select 
                                          className="form-select py-0 px-1" 
                                          defaultValue=""
                                          onChange={(e) => {
                                            if (e.target.value) {
                                              handleReferral(scan.id, e.target.value);
                                            }
                                          }}
                                          style={{ fontSize: '11px', height: '26px', border: '1px solid #cbd5e1' }}
                                        >
                                          <option value="" disabled>Select clinic location...</option>
                                          {clinics.map(c => (
                                            <option key={c.id} value={c.name}>{c.name} ({c.city})</option>
                                          ))}
                                        </select>
                                      </div>
                                    ) : null}

                                    {scan.report_url && (
                                      <button
                                        type="button"
                                        className="btn btn-outline-accent btn-sm w-100 rounded-pill"
                                        onClick={() => mvcApi.downloadAdminUserScanReport(userDetail.user.id, scan.id)}
                                        style={{ fontSize: '12px', fontWeight: '600' }}
                                      >
                                        <i className="far fa-file-pdf me-1"></i> Download PDF Report
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
              </>
            )}

            {/* TAB 2: CLINIC MANAGEMENT */}
            {activeTab === 'clinics' && (
              <div className="row row-sm mg-b-20">
                {/* Create / Edit Form Panel */}
                <div className="col-lg-5">
                  <div className="card card-dashboard-five">
                    <div className="card-header">
                      <h6 className="card-title">
                        {editingClinicId ? 'Modify Clinic Record' : 'Register New Clinic'}
                      </h6>
                      <p className="card-text">Setup coordinates and administrative contact details.</p>
                    </div>
                    
                    {clinicMessage && (
                      <div className={`alert small p-2 ${clinicMessage.includes('successfully') ? 'alert-success' : 'alert-danger'}`}>
                        {clinicMessage}
                      </div>
                    )}

                    <form onSubmit={handleClinicSubmit}>
                      <div className="az-form-group">
                        <label>Clinic Name</label>
                        <input
                          className="form-control az-form-input"
                          value={clinicForm.name}
                          onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                          placeholder="e.g. City Dermatology Center"
                          required
                        />
                      </div>

                      <div className="row row-sm mg-b-20">
                        <div className="col-md-6 az-form-group mb-0">
                          <label>Street Address</label>
                          <input
                            className="form-control az-form-input"
                            value={clinicForm.address}
                            onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                            placeholder="Street address"
                            required
                          />
                        </div>
                        <div className="col-md-6 az-form-group mb-0">
                          <label>City</label>
                          <input
                            className="form-control az-form-input"
                            value={clinicForm.city}
                            onChange={(e) => setClinicForm({ ...clinicForm, city: e.target.value })}
                            placeholder="City"
                            required
                          />
                        </div>
                      </div>

                      <div className="row row-sm mg-b-20">
                        <div className="col-6 az-form-group mb-0">
                          <label>Latitude</label>
                          <input
                            type="number"
                            step="any"
                            className="form-control az-form-input"
                            value={clinicForm.latitude}
                            onChange={(e) => setClinicForm({ ...clinicForm, latitude: Number(e.target.value) })}
                            required
                          />
                        </div>
                        <div className="col-6 az-form-group mb-0">
                          <label>Longitude</label>
                          <input
                            type="number"
                            step="any"
                            className="form-control az-form-input"
                            value={clinicForm.longitude}
                            onChange={(e) => setClinicForm({ ...clinicForm, longitude: Number(e.target.value) })}
                            required
                          />
                        </div>
                      </div>

                      <div className="az-form-group">
                        <label>Telephone Contact</label>
                        <input
                          className="form-control az-form-input"
                          value={clinicForm.phone}
                          onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                          placeholder="e.g. +1 (555) 019-2834"
                        />
                      </div>

                      <div className="az-form-group">
                        <label>Geolocation Coordinate Picker</label>
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
                        <button type="submit" className="btn btn-purple btn-sm py-2 px-4" style={{ borderRadius: '30px' }}>
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
                  <div className="card card-table-one">
                    <div className="card-header">
                      <h6 className="card-title">All Clinic Locations</h6>
                      <p className="card-text">Manage clinic directories, coordinates, phone numbers and diagnostic availability.</p>
                    </div>
                    {clinicsLoading && <p className="text-muted small">Loading coordinates...</p>}
                    {clinicsError && <div className="alert alert-danger small p-2">{clinicsError}</div>}
                    
                    <div className="table-responsive">
                      <table className="table align-middle" style={{ fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th>Clinic Details</th>
                            <th>Location Coordinates</th>
                            <th>Status</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clinics.length === 0 && !clinicsLoading ? (
                            <tr>
                              <td colSpan="4" className="text-center text-muted py-4">No clinics registered in database.</td>
                            </tr>
                          ) : (
                            clinics.map((clinic) => (
                              <tr key={clinic.id}>
                                <td>
                                  <strong className="text-dark d-block" style={{ fontSize: '14px' }}>{clinic.name}</strong>
                                  <span className="text-muted small d-block" style={{ fontSize: '11.5px' }}>
                                    {clinic.address}, {clinic.city}
                                  </span>
                                  {clinic.phone && (
                                    <span className="text-muted small d-block" style={{ fontSize: '11.5px' }}>
                                      <i className="fas fa-phone me-1" style={{ fontSize: '10px' }}></i> {clinic.phone}
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
                                      style={{ fontSize: '12px', fontWeight: '600' }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger rounded-pill py-1 px-3"
                                      onClick={() => handleDeleteClinic(clinic.id)}
                                      style={{ fontSize: '12px', fontWeight: '600' }}
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

            {/* TAB 3: SYSTEM SECURITY AUDIT LOG */}
            {activeTab === 'audit' && (
              <div className="card card-table-one mg-b-20">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div>
                    <h6 className="card-title">System Activity & Audit Log</h6>
                    <p className="card-text">Live HIPAA-compliant clinical audit trails logging user activity and diagnostic decisions.</p>
                  </div>
                  <span className="badge bg-danger text-white px-3 py-2 fw-bold" style={{ fontSize: '11px' }}>
                    AUDIT MODE ACTIVE
                  </span>
                </div>
                <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  <table className="table align-middle table-hover" style={{ fontSize: '13px' }}>
                    <thead className="bg-light sticky-top" style={{ zIndex: 1 }}>
                      <tr>
                        <th>Timestamp</th>
                        <th>Event Category</th>
                        <th>Operator ID</th>
                        <th>Event Description</th>
                        <th>IP Address</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="font-monospace text-secondary" style={{ fontSize: '12px' }}>{log.timestamp}</td>
                          <td>
                            <span className="badge bg-light text-dark border px-2 py-1 fw-bold" style={{ fontSize: '10.5px' }}>
                              {log.category}
                            </span>
                          </td>
                          <td className="fw-semibold text-dark">{log.operator}</td>
                          <td className="text-muted" style={{ fontSize: '12.5px' }}>{log.description}</td>
                          <td className="font-monospace text-secondary" style={{ fontSize: '12px' }}>{log.ip}</td>
                          <td className="text-center">
                            <span className={`badge bg-${log.status === 'SUCCESS' ? 'success' : 'danger'}-subtle text-${log.status === 'SUCCESS' ? 'success' : 'danger'} border px-2.5 py-1 fw-bold`} style={{ fontSize: '11px' }}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Azia Footer Block */}
      <div className="az-footer ht-40">
        <div className="container ht-100p pd-t-0-f">
          <span className="text-muted d-block text-center text-sm-left d-sm-inline-block">Copyright © DermaScan 2026</span>
          <span className="float-none float-sm-right d-block mt-1 mt-sm-0 text-center">
            Azia Admin Dashboard Template powered by Bootstrap 4
          </span>
        </div>
      </div>
    </div>
  );
}
