import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './PortalApp.css';
import LiveKitModal from '../../components/LiveKitModal';
import PortalLayout from '../../components/layout/PortalLayout';
import AdminDashboard from './AdminDashboard';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../../config/env.js';
import { mvcApi, riskBadgeClass, scanImageUrl } from '../../services/mvcApi.js';

function PortalApp() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(AUTH_USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [currentView, setCurrentView] = useState(() => {
    const savedUser = localStorage.getItem(AUTH_USER_KEY);
    if (!savedUser) return 'login';
    const parsed = JSON.parse(savedUser);
    return parsed.role === 'admin' ? 'admin-dashboard' : 'dashboard';
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regLatitude, setRegLatitude] = useState(null);
  const [regLongitude, setRegLongitude] = useState(null);
  const [regLocationStatus, setRegLocationStatus] = useState('idle');
  const [regLocationMessage, setRegLocationMessage] = useState('');
  const [regError, setRegError] = useState('');

  const [showSupport, setShowSupport] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanState, setScanState] = useState('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScan, setCurrentScan] = useState(null);
  const [scanError, setScanError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [symptoms, setSymptoms] = useState('');

  const [scanHistory, setScanHistory] = useState([]);
  const [suggestedClinics, setSuggestedClinics] = useState(null);
  const [locationMessage, setLocationMessage] = useState('');
  const [profileLocationStatus, setProfileLocationStatus] = useState('idle');

  const mapApiUser = (apiUser) => ({
    id: apiUser.id,
    name: `${apiUser.first_name} ${apiUser.last_name}`.trim(),
    email: apiUser.email,
    role: apiUser.role === 'admin' ? 'admin' : 'patient',
    city: apiUser.city,
    latitude: apiUser.latitude,
    longitude: apiUser.longitude,
  });

  const persistSession = (apiUser, token) => {
    const mappedUser = mapApiUser(apiUser);
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(mappedUser));
    setUser(mappedUser);
    setCurrentView(mappedUser.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    return mappedUser;
  };

  const isAuthenticated = useCallback(() => {
    return Boolean(user && localStorage.getItem(AUTH_TOKEN_KEY));
  }, [user]);

  const requireAuth = useCallback(
    (message = 'Please sign in to access this feature.') => {
      if (!isAuthenticated()) {
        setAuthError(message);
        setCurrentView('login');
        return false;
      }
      return true;
    },
    [isAuthenticated],
  );

  const loadPatientData = useCallback(async () => {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) return;
    try {
      const [scansResponse, clinicsResponse] = await Promise.all([
        mvcApi.listScans(1, 50),
        mvcApi.nearestClinics().catch(() => ({ clinics: [] })),
      ]);
      setScanHistory(scansResponse.items || []);
      setSuggestedClinics(clinicsResponse);
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      setUser(null);
      setCurrentView('login');
      setAuthError('Your session expired. Please sign in again.');
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token || !user) return;

    mvcApi.me()
      .then((apiUser) => {
        const mapped = mapApiUser(apiUser);
        setUser(mapped);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(mapped));
        if (mapped.role !== 'admin') loadPatientData();
      })
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        setUser(null);
        setCurrentView('login');
      });
  }, []);

  useEffect(() => {
    if (!isAuthenticated() || user?.role === 'admin') return;
    if (currentView === 'dashboard' || currentView === 'history') {
      loadPatientData();
    }
  }, [currentView, user, isAuthenticated, loadPatientData]);

  useEffect(() => {
    if (currentView === 'dashboard' && !isAuthenticated()) {
      setCurrentView('login');
      setAuthError('Please sign in to upload and scan images.');
    }
    if (currentView === 'history' && !isAuthenticated()) {
      setCurrentView('login');
      setAuthError('Please sign in to view your scan history.');
    }
    if (currentView === 'admin-dashboard' && (!isAuthenticated() || user?.role !== 'admin')) {
      setCurrentView('login');
      setAuthError('Admin access required.');
    }
  }, [currentView, isAuthenticated, user]);

  const navigateTo = (view) => {
    setCurrentView(view);
    setAuthError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!email || !password) {
      setAuthError('Please fill in all fields.');
      return;
    }
    try {
      const tokenPayload = await mvcApi.login({ email, password });
      localStorage.setItem(AUTH_TOKEN_KEY, tokenPayload.access_token);
      const apiUser = await mvcApi.me();
      persistSession(apiUser, tokenPayload.access_token);
      setEmail('');
      setPassword('');
      if (apiUser.role !== 'admin') await loadPatientData();
    } catch (error) {
      setAuthError(error.message || 'Login failed.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!regName || !regEmail || !regPassword || !regConfirmPassword) {
      setRegError('Please fill in all required fields.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }
    const nameParts = regName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    try {
      const payload = {
        email: regEmail,
        password: regPassword,
        first_name: firstName,
        last_name: lastName,
      };
      if (regLatitude != null && regLongitude != null) {
        payload.latitude = regLatitude;
        payload.longitude = regLongitude;
      }
      const registration = await mvcApi.register(payload);
      setSuggestedClinics(registration.suggested_clinics);
      const tokenPayload = await mvcApi.login({ email: regEmail, password: regPassword });
      persistSession(registration.user, tokenPayload.access_token);
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegLatitude(null);
      setRegLongitude(null);
      setRegLocationStatus('idle');
      setRegLocationMessage('');
    } catch (error) {
      setRegError(error.message || 'Registration failed.');
    }
  };

  const handleUseMyLocation = (forProfile = false) => {
    if (!navigator.geolocation) {
      const message = 'Geolocation is not supported by your browser.';
      if (forProfile) setLocationMessage(message);
      else {
        setRegLocationStatus('error');
        setRegLocationMessage(message);
      }
      return;
    }

    if (forProfile) setProfileLocationStatus('loading');
    else {
      setRegLocationStatus('loading');
      setRegLocationMessage('');
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        if (forProfile) {
          try {
            const updated = await mvcApi.updateProfile({ latitude, longitude });
            const mapped = mapApiUser(updated);
            setUser(mapped);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(mapped));
            setProfileLocationStatus('success');
            setLocationMessage('Location updated. Clinic recommendations will use your current coordinates.');
            const clinics = await mvcApi.nearestClinics();
            setSuggestedClinics(clinics);
          } catch (error) {
            setProfileLocationStatus('error');
            setLocationMessage(error.message || 'Could not save location.');
          }
          return;
        }
        setRegLatitude(latitude);
        setRegLongitude(longitude);
        setRegLocationStatus('success');
        setRegLocationMessage('Location captured successfully.');
      },
      (error) => {
        const deniedMessage =
          'Location access was denied. You can still continue — sharing your location helps us recommend nearby clinics.';
        if (forProfile) {
          setProfileLocationStatus('denied');
          setLocationMessage(deniedMessage);
          return;
        }
        setRegLatitude(null);
        setRegLongitude(null);
        setRegLocationStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error');
        setRegLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? deniedMessage
            : 'Could not retrieve your location. You can still register without it.',
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setSuggestedClinics(null);
    setScanHistory([]);
    setCurrentScan(null);
    setPreviewUrl(null);
    setScanState('idle');
    setScanProgress(0);
    setScanError('');
    setShowSupport(false);
    setAuthError('');
    setEmail('');
    setPassword('');
    setCurrentView('login');
    navigate('/app', { replace: true });
  };

  const handleUploadClick = () => {
    if (!requireAuth('Please sign in to upload and scan images.')) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanState('idle');
      setCurrentScan(null);
      setScanError('');
    }
  };

  const handleAnalyzeClick = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile || !requireAuth()) return;

    setScanError('');
    setScanState('scanning');
    setScanProgress(15);

    try {
      setScanProgress(40);
      const scanSession = await mvcApi.createScan(symptoms || null);
      setScanProgress(70);
      const completedScan = await mvcApi.uploadScanImages(scanSession.id, [selectedFile]);
      setScanProgress(100);
      setCurrentScan(completedScan);
      setScanState('completed');
      await loadPatientData();
      const clinics = await mvcApi.nearestClinics().catch(() => null);
      if (clinics) setSuggestedClinics(clinics);
    } catch (error) {
      setScanState('idle');
      setScanError(error.message || 'Scan failed.');
    }
  };

  const resetScan = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setSymptoms('');
    setScanState('idle');
    setScanProgress(0);
    setCurrentScan(null);
    setScanError('');
  };

  const renderClinicRecommendations = () => {
    if (user?.latitude == null || user?.longitude == null) {
      return (
        <div className="portal-card mb-4">
          <h4 className="portal-card-title">Nearby Clinics</h4>
          <p className="text-muted mb-3">
            Add your location to receive clinic recommendations sorted by distance from you.
          </p>
          <button
            type="button"
            className="btn btn-outline-accent"
            onClick={() => handleUseMyLocation(true)}
            disabled={profileLocationStatus === 'loading'}
          >
            {profileLocationStatus === 'loading' ? 'Getting Location...' : 'Use My Location'}
          </button>
          {locationMessage && <p className="small mt-2 mb-0 text-muted">{locationMessage}</p>}
        </div>
      );
    }

    if (!suggestedClinics?.clinics?.length) {
      return (
        <div className="portal-card mb-4">
          <h4 className="portal-card-title">Nearby Clinics</h4>
          <p className="text-muted mb-0">No active clinics are available near your location yet.</p>
        </div>
      );
    }

    return (
      <div className="portal-card mb-4">
        <h4 className="portal-card-title">Nearest Clinics</h4>
        <p className="text-muted small mb-3">Recommendations sorted by distance from your location.</p>
        <div className="history-grid">
          {suggestedClinics.clinics.map((clinic) => (
            <div className="history-card" key={clinic.id}>
              <div className="history-details">
                <h6 className="text-dark">{clinic.name}</h6>
                <p className="text-muted small mb-1">{clinic.address}, {clinic.city}</p>
                <p className="text-accent small fw-bold mb-0">{clinic.distance_km} km away</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <PortalLayout
      user={user}
      currentView={currentView}
      onNavigate={navigateTo}
      onLogout={handleLogout}
      onSupportClick={() => {
        if (requireAuth('Please sign in to use the AI Doctor.')) setShowSupport(true);
      }}
    >
      {currentView === 'login' && (
        <section className="section portal-section light-background">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-5">
                <div className="portal-card auth-card">
                  <div className="section-title text-start">
                    <h2 className="text-dark">Welcome Back</h2>
                    <p>Sign in to scan moles and consult the AI dermatologist.</p>
                  </div>
                  {authError && <div className="alert alert-danger">{authError}</div>}
                  <form onSubmit={handleLogin}>
                    <div className="mb-3">
                      <label className="form-label">Email Address</label>
                      <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="mb-4">
                      <label className="form-label">Password</label>
                      <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-accent w-100">Sign In</button>
                  </form>
                  <p className="text-center small mt-3 mb-0">
                    Don&apos;t have an account?{' '}
                    <button type="button" className="btn btn-link p-0 align-baseline" onClick={() => navigateTo('register')}>
                      Register here
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {currentView === 'register' && (
        <section className="section portal-section light-background">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-5">
                <div className="portal-card auth-card">
                  <div className="section-title text-start">
                    <h2 className="text-dark">Create Account</h2>
                    <p>Access AI-driven skin classification and triage tools.</p>
                  </div>
                  {regError && <div className="alert alert-danger">{regError}</div>}
                  <form onSubmit={handleRegister}>
                    <div className="mb-3">
                      <label className="form-label">Full Name</label>
                      <input className="form-control" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email Address</label>
                      <input type="email" className="form-control" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Password</label>
                      <input type="password" className="form-control" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Confirm Password</label>
                      <input type="password" className="form-control" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} required />
                    </div>
                    <div className="mb-4">
                      <label className="form-label">Location (optional)</label>
                      <button type="button" className="btn btn-outline-accent w-100 mb-2" onClick={() => handleUseMyLocation(false)} disabled={regLocationStatus === 'loading'}>
                        {regLocationStatus === 'loading' ? 'Getting Location...' : 'Use My Location'}
                      </button>
                      {regLocationMessage && (
                        <div className={`small ${regLocationStatus === 'success' ? 'text-success' : 'text-muted'}`}>{regLocationMessage}</div>
                      )}
                    </div>
                    <button type="submit" className="btn btn-accent w-100">Register Account</button>
                  </form>
                  <p className="text-center small mt-3 mb-0">
                    Already have an account?{' '}
                    <button type="button" className="btn btn-link p-0 align-baseline" onClick={() => navigateTo('login')}>
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {currentView === 'dashboard' && user && user.role !== 'admin' && (
        <section className="section portal-section light-background">
          <div className="container">
            <div className="portal-account-bar d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
              <div>
                <p className="text-muted small mb-1">Signed in as</p>
                <p className="mb-0 fw-semibold text-dark">{user.name || user.email}</p>
              </div>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-1"></i> Sign Out
              </button>
            </div>

            <div className="section-title">
              <h2 className="text-dark">Patient Dashboard</h2>
              <p>Upload a mole image for AI analysis, download reports, and view nearby clinics.</p>
            </div>

            {renderClinicRecommendations()}

            <div className="portal-card p-4 mb-4 text-start" style={{ borderRadius: '24px', backgroundColor: '#ffffff' }}>
              <form onSubmit={handleAnalyzeClick}>
                <div className="form-group mb-3 text-start">
                  <label className="form-label fw-semibold text-secondary">Upload Image of Lesion</label>
                  
                  {/* File input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileChange}
                  />

                  {/* Drag and drop zone (solid border) */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        setPreviewUrl(URL.createObjectURL(file));
                        setScanState('idle');
                        setCurrentScan(null);
                        setScanError('');
                      }
                    }}
                    onClick={handleUploadClick}
                    className="text-center cursor-pointer p-4 d-flex flex-column align-items-center justify-content-center"
                    style={{
                      minHeight: '220px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {!previewUrl ? (
                      <>
                        <i className="bi bi-cloud-arrow-up text-primary" style={{ fontSize: '54px', color: '#2563eb' }}></i>
                        <p className="mt-2 mb-1 fw-bold text-dark" style={{ fontSize: '16px', color: '#1e293b' }}>
                          Drag & drop your skin photo here
                        </p>
                        <p className="text-muted small mb-2">Supports JPG, PNG (Max 5MB)</p>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUploadClick();
                          }}
                          style={{
                            backgroundColor: '#2563eb',
                            borderColor: '#2563eb',
                            borderRadius: '6px',
                            padding: '8px 18px',
                            fontWeight: '600',
                            fontSize: '14px',
                          }}
                        >
                          Browse Image
                        </button>
                      </>
                    ) : (
                      <div className="position-relative w-100 text-center" onClick={(e) => e.stopPropagation()}>
                        <img
                          src={previewUrl}
                          alt="Skin Lesion Preview"
                          className="img-fluid rounded-3"
                          style={{ maxHeight: '200px', objectFit: 'contain' }}
                        />
                        {scanState === 'scanning' && (
                          <div
                            className="position-absolute w-100 start-0"
                            style={{
                              height: '4px',
                              background: 'linear-gradient(to right, transparent, #ff3b3b, transparent)',
                              boxShadow: '0 0 12px #ff3b3b',
                              top: '50%',
                              animation: 'scanLaser 2s infinite ease-in-out',
                            }}
                          ></div>
                        )}
                        {scanState === 'idle' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle"
                            onClick={resetScan}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Symptoms Text Area */}
                <div className="form-group mb-3">
                  <textarea
                    className="form-control"
                    rows="3"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Any additional symptoms (itching, bleeding, changing shape)?"
                    style={{ borderRadius: '12px', border: '1px solid #cbd5e1', padding: '12px' }}
                  ></textarea>
                </div>

                {/* Scan Status / Error Feedback */}
                {scanState === 'scanning' && (
                  <div className="mt-3 text-center text-primary fw-bold">
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Analyzing Image...
                    <div className="progress mt-3 mx-auto" style={{ maxWidth: '400px', height: '8px', borderRadius: '4px' }}>
                      <div className="progress-bar bg-accent" role="progressbar" style={{ width: `${scanProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {scanError && (
                  <div className="alert alert-danger rounded-3 p-3 mt-3">
                    <i className="bi bi-exclamation-octagon-fill me-2"></i>
                    {scanError}
                  </div>
                )}

                {/* Scan Result Feedback (if completed) */}
                {scanState === 'completed' && currentScan && (
                  <div className="mt-4 alert alert-success border-0 shadow-sm rounded-4 p-4 text-start" style={{ background: '#f0fdf4', color: '#15803d' }}>
                    <div className="d-flex align-items-center mb-3">
                      <i className="bi bi-check-circle-fill me-2 fs-4 text-success"></i>
                      <h4 className="alert-heading m-0 fw-bold">Analysis Complete!</h4>
                    </div>
                    <div className="row gy-3">
                      <div className="col-md-6 border-end">
                        <p className="text-secondary small mb-1">CLASSIFICATION RESULT</p>
                        <p className="fw-bold fs-5 text-dark">{currentScan.classification_label || 'Analysis Complete'}</p>
                      </div>
                      <div className="col-md-3 border-end text-center">
                        <p className="text-secondary small mb-1">CONFIDENCE</p>
                        <p className="fw-bold fs-5 text-dark">{currentScan.confidence_score}%</p>
                      </div>
                      <div className="col-md-3 text-center">
                        <p className="text-secondary small mb-1">RISK LEVEL</p>
                        <span className={`badge bg-${riskBadgeClass(currentScan.risk_level)} px-3 py-2 fs-6 rounded-pill`}>
                          {currentScan.risk_level || 'Low Risk'}
                        </span>
                      </div>
                    </div>
                    <hr className="my-3" style={{ opacity: 0.15 }} />
                    <p className="mb-0 text-dark" style={{ lineHeight: '1.6' }}>{currentScan.report_summary}</p>
                    <div className="mt-3 d-flex gap-2">
                      {currentScan.report_url && (
                        <button type="button" className="btn btn-sm btn-outline-success" onClick={() => mvcApi.downloadScanReport(currentScan.id)}>
                          <i className="bi bi-file-earmark-pdf me-1"></i> Download PDF Report
                        </button>
                      )}
                      <button type="button" className="btn btn-sm btn-success" onClick={() => setShowSupport(true)}>
                        <i className="bi bi-telephone-outbound me-1"></i> Consult Voice Doctor
                      </button>
                    </div>
                  </div>
                )}

                {/* Action button */}
                {scanState !== 'completed' && (
                  <div className="text-center mt-3">
                    <button
                      type="submit"
                      disabled={!selectedFile || scanState === 'scanning'}
                      className="btn text-white px-5 rounded-pill shadow-sm"
                      style={{
                        backgroundColor: '#3fbbc0',
                        borderColor: '#3fbbc0',
                        fontWeight: '600',
                        padding: '12px 30px',
                      }}
                    >
                      {scanState === 'scanning' ? 'Scanning...' : 'Analyze Skin Image'}
                    </button>
                  </div>
                )}

                {scanState === 'completed' && (
                  <div className="text-center mt-3">
                    <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={resetScan}>
                      Scan Another Image
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>
      )}

      {currentView === 'history' && user && user.role !== 'admin' && (
        <section className="section portal-section light-background">
          <div className="container">
            <div className="section-title">
              <h2 className="text-dark">Scan History</h2>
              <p>Review uploaded images, analysis results, and download previous PDF reports.</p>
            </div>
            {scanHistory.length === 0 ? (
              <div className="portal-card text-center py-5">
                <p className="text-muted mb-0">No scans recorded yet. Upload an image from your dashboard to get started.</p>
              </div>
            ) : (
              <div className="history-grid">
                {scanHistory.map((scan) => (
                  <div className="history-card" key={scan.id}>
                    <div className="history-image-container">
                      {scan.images?.[0]?.image_url ? (
                        <img src={scanImageUrl(scan.images[0].image_url)} className="history-image" alt="Scan" />
                      ) : (
                        <div className="history-image-placeholder">No image</div>
                      )}
                    </div>
                    <div className="history-details">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted small">{new Date(scan.scan_date).toLocaleString()}</span>
                        <span className={`badge bg-${riskBadgeClass(scan.risk_level)}`}>{scan.risk_level || scan.status}</span>
                      </div>
                      <h6 className="text-dark">{scan.classification_label || 'Analysis pending'}</h6>
                      <p className="small mb-2">Confidence: {scan.confidence_score != null ? `${scan.confidence_score}%` : 'N/A'}</p>
                      <p className="small text-muted mb-3">{scan.report_summary}</p>
                      {scan.report_url && (
                        <button type="button" className="btn btn-sm btn-accent" onClick={() => mvcApi.downloadScanReport(scan.id)}>
                          <i className="bi bi-file-earmark-pdf me-1"></i> Download PDF
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {currentView === 'admin-dashboard' && user?.role === 'admin' && <AdminDashboard />}

      {showSupport && <LiveKitModal setShowSupport={setShowSupport} userName={user?.name || 'DermaScan User'} />}
    </PortalLayout>
  );
}

export default PortalApp;
