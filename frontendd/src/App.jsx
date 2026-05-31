import { useState, useEffect, useRef } from 'react'
import './App.css'
import LiveKitModal from './components/LiveKitModal';

function App() {
  // Simulated Authentication & User States
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dermascan_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentView, setCurrentView] = useState(() => {
    const savedUser = localStorage.getItem('dermascan_user');
    if (!savedUser) return 'login';
    const parsed = JSON.parse(savedUser);
    return parsed.role === 'admin' ? 'admin-dashboard' : 'dashboard';
  });

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminSubView, setAdminSubView] = useState('database'); // 'database', 'logs', 'stats'

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('az-header-menu-show');
    } else {
      document.body.classList.remove('az-header-menu-show');
    }
    return () => document.body.classList.remove('az-header-menu-show');
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const backdrop = document.querySelector('.az-navbar-backdrop');
    const closeMenu = () => setMobileMenuOpen(false);
    backdrop?.addEventListener('click', closeMenu);
    return () => backdrop?.removeEventListener('click', closeMenu);
  }, [mobileMenuOpen]);

  // Audit Logs State (Local state with persistence)
  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('dermascan_logs');
    return saved ? JSON.parse(saved) : [
      { id: 1, timestamp: '2026-05-31 16:30:12', user: 'admin@dermascan.com', action: 'System settings loaded', status: 'Success' },
      { id: 2, timestamp: '2026-05-31 17:12:45', user: 'patient@demo.com', action: 'Scan run: Benign Melanocytic Nevus (Confidence: 96.2%)', status: 'Success' },
      { id: 3, timestamp: '2026-05-31 17:45:20', user: 'admin@dermascan.com', action: 'Login successful', status: 'Success' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('dermascan_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const addAuditLog = (actionUser, actionDescription) => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: actionUser || 'anonymous',
      action: actionDescription,
      status: 'Success'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Static/Default Page Configurations (Webpage Manager removed, configurations are now static defaults)
  const adminConfig = {
    mainTitle: 'Instant Skin Scan & Triage',
    introText: 'Welcome to DermaScan. Upload close-up pictures of skin moles to run our instant neural network pre-diagnosis. If any risk is identified, you can consult with our voice AI assistant for immediate triage instructions.',
    intention1Title: '1. Early Melanoma Triage',
    intention1Text: 'Melanoma is highly treatable if caught early. DermaScan helps identify atypical structures and asymmetric borders in moles quickly.',
    intention2Title: '2. Live AI Doctor',
    intention2Text: 'After receiving scan results, initiate a high-fidelity voice call to discuss symptoms, severity scale, and next triage steps.',
    intention3Title: '3. Historical Skin Logs',
    intention3Text: 'Securely store uploaded photos to observe structural changes, enlargement, or bleeding in your moles over a chronological timeline.',
    classifierSensitivity: 85,
    emergencyContact: '+1 (555) 337-6272'
  };

  // Auth Forms State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');

  // Patient Actions / Upload States
  const [showSupport, setShowSupport] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanState, setScanState] = useState('idle'); // 'idle', 'scanning', 'completed'
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const fileInputRef = useRef(null);

  // Patient Scan History (Local State with Persistence)
  const [scanHistory, setScanHistory] = useState(() => {
    const saved = localStorage.getItem('dermascan_scans');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        patientEmail: 'patient@demo.com',
        date: 'May 28, 2026',
        image: '/img/faces/face2.jpg',
        label: 'Seborrheic Keratosis (Benign)',
        confidence: '96.2%',
        risk: 'Low Risk',
        color: 'success',
        notes: 'No critical atypical structures detected. Continue monthly checks.'
      },
      {
        id: 2,
        patientEmail: 'patient@demo.com',
        date: 'May 12, 2026',
        image: '/img/faces/face3.jpg',
        label: 'Atypical Melanocytic Indication',
        confidence: '91.8%',
        risk: 'High Risk / Action Required',
        color: 'danger',
        notes: 'Slight asymmetry and color variation observed. Discuss with AI Doctor.'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('dermascan_scans', JSON.stringify(scanHistory));
  }, [scanHistory]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navigateTo = (view) => {
    setCurrentView(view);
    closeMobileMenu();
    setProfileDropdownOpen(false);
  };

  // Handle support trigger
  const handleSupportClick = (e) => {
    if (e) e.preventDefault();
    closeMobileMenu();
    setShowSupport(true);
  }

  // Trigger file select dialog
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  // Handle uploaded file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanState('scanning');
      setScanProgress(0);
      setScanResult(null);
    }
  }

  // Simulate neural network scanning progress
  useEffect(() => {
    if (scanState !== 'scanning') return;

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanState('completed');
          
          // Generate a mockup result based on classifier sensitivity
          const isHighRisk = Math.random() * 100 < adminConfig.classifierSensitivity;
          const result = isHighRisk ? {
            label: 'Atypical Melanocytic Indication Detected',
            confidence: `${(88 + Math.random() * 11).toFixed(1)}%`,
            risk: 'High Risk / Consult AI Doctor',
            color: 'danger',
            notes: `Asymmetry and irregular border contours detected. We highly recommend connecting with our AI voice assistant at ${adminConfig.emergencyContact} or via Voice Call for clinical triage.`
          } : {
            label: 'Benign Melanocytic Nevus (Common Mole)',
            confidence: `${(92 + Math.random() * 7).toFixed(1)}%`,
            risk: 'Low Risk',
            color: 'success',
            notes: 'Symmetrical structure with uniform color distribution. Monitor monthly.'
          };
          
          setScanResult(result);
          
          // Append to history
          const activeUserEmail = user ? user.email : 'patient@demo.com';
          setScanHistory(prevHistory => [
            {
              id: Date.now(),
              patientEmail: activeUserEmail,
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              image: previewUrl,
              label: result.label,
              confidence: result.confidence,
              risk: result.risk,
              color: result.color,
              notes: result.notes
            },
            ...prevHistory
          ]);

          addAuditLog(activeUserEmail, `Uploaded image for neural mole scan. Classification: ${result.label} (Conf: ${result.confidence})`);

          return 100;
        }
        return prev + 10;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [scanState, previewUrl, user]);

  // Auth Operations
  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setAuthError('');

    if (!email || !password) {
      setAuthError('Please fill in all fields.');
      return;
    }

    // Simple email rule to determine if admin
    const isAdmin = email.toLowerCase().includes('admin');
    const loggedUser = {
      name: isAdmin ? 'Admin Account' : 'John Doe',
      email: email,
      role: isAdmin ? 'admin' : 'patient'
    };

    localStorage.setItem('dermascan_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    setCurrentView(isAdmin ? 'admin-dashboard' : 'dashboard');
    addAuditLog(loggedUser.email, `User login successful (${isAdmin ? 'Admin' : 'Patient'} role)`);
    
    // Clear forms
    setEmail('');
    setPassword('');
  };

  const handleDemoLogin = (role) => {
    const loggedUser = role === 'admin' 
      ? { name: 'Admin Account', email: 'admin@dermascan.com', role: 'admin' }
      : { name: 'Demo Patient', email: 'patient@demo.com', role: 'patient' };

    localStorage.setItem('dermascan_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    setCurrentView(role === 'admin' ? 'admin-dashboard' : 'dashboard');
    setAuthError('');
    addAuditLog(loggedUser.email, `Demo login successful (Role: ${role})`);
  };

  const handleRegister = (e) => {
    if (e) e.preventDefault();
    setRegError('');

    if (!regName || !regEmail || !regPassword || !regConfirmPassword) {
      setRegError('Please fill in all fields.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    // Simulate registration
    const loggedUser = {
      name: regName,
      email: regEmail,
      role: 'patient'
    };

    localStorage.setItem('dermascan_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    setCurrentView('dashboard');
    addAuditLog(loggedUser.email, `New patient registered: ${regName}`);

    // Clear forms
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
  };

  const handleLogout = (e) => {
    if (e) e.preventDefault();
    if (user) {
      addAuditLog(user.email, 'User logged out');
    }
    localStorage.removeItem('dermascan_user');
    setUser(null);
    setCurrentView('login');
    closeMobileMenu();
    setProfileDropdownOpen(false);
  };

  // Admin CRUD Operations (Manual scan creation form removed)
  const handleDeleteScan = (id) => {
    const scanToRemove = scanHistory.find(scan => scan.id === id);
    const targetEmail = scanToRemove ? scanToRemove.patientEmail : 'unknown';
    
    if (confirm(`Are you sure you want to delete the scan record for ${targetEmail}?`)) {
      setScanHistory(prev => prev.filter(scan => scan.id !== id));
      addAuditLog(user.email, `Archived patient scan record ID: ${id} belonging to ${targetEmail}`);
    }
  };

  const handleUpdateScanNotes = (id, newNotes) => {
    setScanHistory(prev => prev.map(scan => {
      if (scan.id === id) {
        return { ...scan, notes: newNotes };
      }
      return scan;
    }));
  };

  const handleUpdateScanRisk = (id, newRisk) => {
    const color = newRisk.includes('High') ? 'danger' : newRisk.includes('Moderate') ? 'warning' : 'success';
    setScanHistory(prev => prev.map(scan => {
      if (scan.id === id) {
        return { ...scan, risk: newRisk, color: color };
      }
      return scan;
    }));
    const updated = scanHistory.find(scan => scan.id === id);
    addAuditLog(user.email, `Updated scan classification risk for ID: ${id} belonging to ${updated ? updated.patientEmail : 'unknown'}`);
  };

  // Calculate dynamic stats for Statistics Tab
  const statsTotal = scanHistory.length;
  const statsHighRisk = scanHistory.filter(s => s.color === 'danger').length;
  const statsModRisk = scanHistory.filter(s => s.color === 'warning').length;
  const statsLowRisk = scanHistory.filter(s => s.color === 'success').length;
  const avgConfidence = statsTotal 
    ? (scanHistory.reduce((sum, s) => sum + parseFloat(s.confidence), 0) / statsTotal).toFixed(1) 
    : 0;

  return (
    <div className="app">
      
      {/* Premium Navigation Header */}
      <div className="az-header">
        <div className="container">
          <div className="az-header-left">
            <a
              href=""
              id="azMenuShow"
              className="az-header-menu-icon d-lg-none"
              onClick={(e) => { e.preventDefault(); setMobileMenuOpen((open) => !open); }}
              aria-label="Toggle navigation menu"
            >
              <span></span>
            </a>
            <a href="/" className="az-logo" style={{ textTransform: 'none' }} onClick={(e) => { 
              e.preventDefault(); 
              if (user) {
                navigateTo(user.role === 'admin' ? 'admin-dashboard' : 'dashboard');
              } else {
                navigateTo('login');
              }
            }}>
              <span style={{ marginRight: '8px' }}>
                <i className="typcn typcn-heart-full-outline text-purple" style={{ fontSize: '26px' }}></i>
              </span>
              Derma<span className="text-purple">Scan</span>
            </a>
          </div>
          
          <div className="az-header-menu">
            <div className="az-header-menu-header">
              <a href="" className="close" onClick={(e) => { e.preventDefault(); closeMobileMenu(); }}>&times;</a>
              <div className="az-header-menu-title font-weight-bold text-dark">Menu</div>
            </div>
            <ul className="nav">
              {!user ? (
                <>
                  <li className="nav-item">
                    <a href="" className={`nav-link ${currentView === 'login' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); navigateTo('login'); }}>
                      <i className="typcn typcn-key-outline"></i> Sign In
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="" className={`nav-link ${currentView === 'register' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); navigateTo('register'); }}>
                      <i className="typcn typcn-user-add-outline"></i> Register
                    </a>
                  </li>
                </>
              ) : user.role === 'admin' ? (
                <>
                  <li className="nav-item">
                    <a href="" className="nav-link active">
                      <i className="typcn typcn-th-large-outline"></i> Admin Dashboard
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <a href="" className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); navigateTo('dashboard'); }}>
                      <i className="typcn typcn-home-outline"></i> Home Page
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="" className={`nav-link ${currentView === 'history' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); navigateTo('history'); }}>
                      <i className="typcn typcn-time"></i> Scan History
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="" className="nav-link" onClick={handleSupportClick}>
                      <i className="typcn typcn-microphone"></i> AI Doctor Call
                    </a>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* User profile dropdown - managed in React state */}
          <div className="az-header-right">
            {user && (
              <div className={`dropdown az-profile-menu ${profileDropdownOpen ? 'show' : ''}`}>
                <button 
                  className="btn btn-outline-light d-flex align-items-center pd-y-6 pd-x-12 border-0" 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} 
                  style={{ gap: '8px', cursor: 'pointer', borderRadius: '30px', background: 'transparent' }}
                >
                  <div className="bg-purple text-white d-flex align-items-center justify-content-center shadow-sm" style={{ borderRadius: '50%', width: '34px', height: '34px' }}>
                    <i className="typcn typcn-user" style={{ fontSize: '18px' }}></i>
                  </div>
                  <div className="text-left d-none d-md-block">
                    <div className="text-dark font-weight-bold" style={{ fontSize: '13px', lineHeight: '1.2' }}>{user.name}</div>
                    <div className="text-muted small text-capitalize" style={{ fontSize: '10px', lineHeight: '1.1' }}>{user.role}</div>
                  </div>
                  <i className="typcn typcn-chevron-down text-muted" style={{ fontSize: '12px' }}></i>
                </button>
                <div className={`dropdown-menu ${profileDropdownOpen ? 'show' : ''}`} style={{ right: 0, left: 'auto', display: profileDropdownOpen ? 'block' : 'none' }}>
                  <div className="az-header-profile center-position-container pd-b-15">
                    <div className="bg-purple text-white d-flex align-items-center justify-content-center mg-b-10 shadow-sm" style={{ borderRadius: '50%', width: '56px', height: '56px' }}>
                      <i className="typcn typcn-user" style={{ fontSize: '32px' }}></i>
                    </div>
                    <h6 className="font-weight-bold text-dark mb-0">{user.name}</h6>
                    <span className="text-muted small">{user.email}</span>
                  </div>
                  {user.role !== 'admin' && (
                    <>
                      <a href="" className="dropdown-item" onClick={(e) => { e.preventDefault(); navigateTo('dashboard'); }}><i className="typcn typcn-home-outline"></i> Home Page</a>
                      <a href="" className="dropdown-item" onClick={(e) => { e.preventDefault(); navigateTo('history'); }}><i className="typcn typcn-time"></i> Scan History</a>
                    </>
                  )}
                  <a href="" className="dropdown-item" onClick={(e) => { handleLogout(e); setProfileDropdownOpen(false); }}><i className="typcn typcn-power-outline"></i> Sign Out</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content View Container */}
      <div className="az-content az-content-dashboard">
        <div className="container">
          <div className="az-content-body">
            
            {/* VIEW: LOGIN */}
            {currentView === 'login' && (
              <div className="auth-container">
                <div className="auth-card animate-fade-in">
                  <div className="auth-header">
                    <h3 className="font-weight-bold text-dark mb-1">Welcome Back</h3>
                    <p className="text-muted small">Sign in to scan moles & consult AI dermatologist</p>
                  </div>

                  {authError && (
                    <div className="alert alert-danger small pd-y-10 pd-x-15 mb-3" style={{ borderRadius: '12px' }}>
                      {authError}
                    </div>
                  )}

                  <form onSubmit={handleLogin}>
                    <div className="form-group mb-3">
                      <label className="font-weight-bold small text-muted">Email Address</label>
                      <input 
                        type="email" 
                        className="form-control rounded-lg" 
                        placeholder="patient@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ borderRadius: '12px', padding: '12px' }}
                      />
                    </div>
                    <div className="form-group mb-4">
                      <label className="font-weight-bold small text-muted">Password</label>
                      <input 
                        type="password" 
                        className="form-control rounded-lg" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ borderRadius: '12px', padding: '12px' }}
                      />
                    </div>
                    <button type="submit" className="btn btn-purple btn-block font-weight-bold rounded-pill mb-3" style={{ padding: '12px' }}>
                      Sign In
                    </button>
                  </form>

                  <div className="text-center small mt-3">
                    <span className="text-muted">Don't have an account? </span>
                    <a href="" className="text-purple font-weight-bold" onClick={(e) => { e.preventDefault(); setCurrentView('register'); }}>Register here</a>
                  </div>

                  <div className="auth-demo-box">
                    <div className="auth-demo-title">Quick Demo Login</div>
                    <div className="auth-demo-buttons">
                      <button className="auth-demo-btn" onClick={() => handleDemoLogin('patient')}>
                        <i className="typcn typcn-user-outline mr-1"></i> Patient Portal
                      </button>
                      <button className="auth-demo-btn auth-demo-btn-admin" onClick={() => handleDemoLogin('admin')}>
                        <i className="typcn typcn-cog-outline mr-1"></i> Admin Portal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: REGISTER */}
            {currentView === 'register' && (
              <div className="auth-container">
                <div className="auth-card animate-fade-in">
                  <div className="auth-header">
                    <h3 className="font-weight-bold text-dark mb-1">Create Account</h3>
                    <p className="text-muted small">Access our AI-driven skin classification triage tools</p>
                  </div>

                  {regError && (
                    <div className="alert alert-danger small pd-y-10 pd-x-15 mb-3" style={{ borderRadius: '12px' }}>
                      {regError}
                    </div>
                  )}

                  <form onSubmit={handleRegister}>
                    <div className="form-group mb-3">
                      <label className="font-weight-bold small text-muted">Full Name</label>
                      <input 
                        type="text" 
                        className="form-control rounded-lg" 
                        placeholder="John Doe" 
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        style={{ borderRadius: '12px', padding: '12px' }}
                      />
                    </div>
                    <div className="form-group mb-3">
                      <label className="font-weight-bold small text-muted">Email Address</label>
                      <input 
                        type="email" 
                        className="form-control rounded-lg" 
                        placeholder="john@example.com" 
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        style={{ borderRadius: '12px', padding: '12px' }}
                      />
                    </div>
                    <div className="form-group mb-3">
                      <label className="font-weight-bold small text-muted">Password</label>
                      <input 
                        type="password" 
                        className="form-control rounded-lg" 
                        placeholder="••••••••" 
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        style={{ borderRadius: '12px', padding: '12px' }}
                      />
                    </div>
                    <div className="form-group mb-4">
                      <label className="font-weight-bold small text-muted">Confirm Password</label>
                      <input 
                        type="password" 
                        className="form-control rounded-lg" 
                        placeholder="••••••••" 
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        style={{ borderRadius: '12px', padding: '12px' }}
                      />
                    </div>
                    <button type="submit" className="btn btn-purple btn-block font-weight-bold rounded-pill mb-3" style={{ padding: '12px' }}>
                      Register Account
                    </button>
                  </form>

                  <div className="text-center small mt-3">
                    <span className="text-muted">Already have an account? </span>
                    <a href="" className="text-purple font-weight-bold" onClick={(e) => { e.preventDefault(); setCurrentView('login'); }}>Sign In</a>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: PATIENT HOME / UPLOAD */}
            {currentView === 'dashboard' && user && (
              <div>
                {/* Intro Title & Intentions */}
                <div className="center-position-container mg-t-30 mg-b-40 pd-x-15">
                  <h1 className="text-dark font-weight-bold" style={{ fontSize: '34px', letterSpacing: '-0.75px', marginBottom: '12px' }}>
                    {adminConfig.mainTitle}
                  </h1>
                  <p className="text-muted mx-auto mb-0" style={{ maxWidth: '620px', fontSize: '16px', lineHeight: '1.6' }}>
                    {adminConfig.introText}
                  </p>
                </div>

                {/* Central Upload Widget */}
                <div className="card pd-40 mg-b-45 text-center animate-fade-in" style={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.01)' }}>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                    onChange={handleFileChange}
                  />

                  {scanState === 'idle' && (
                    <div className="upload-zone" onClick={handleUploadClick}>
                      <div className="upload-icon">
                        <i className="typcn typcn-camera"></i>
                      </div>
                      <h4 className="upload-title">Scan New Mole Image</h4>
                      <p className="upload-subtitle text-muted">
                        Drag and drop a clear, high-resolution close-up photo of your mole here, or click to browse files from your device.
                      </p>
                    </div>
                  )}

                  {scanState === 'scanning' && (
                    <div className="center-position-container pd-y-50">
                      <div className="spinner-border text-purple mg-b-20" role="status" style={{ width: '4rem', height: '4rem', borderWidth: '5px' }}>
                        <span className="sr-only">Scanning...</span>
                      </div>
                      <h4 className="font-weight-bold text-dark mb-1">Neural Scan in Progress...</h4>
                      <p className="text-muted mb-4 small text-uppercase font-weight-bold" style={{ letterSpacing: '0.5px' }}>Running Computer Vision Classifiers</p>
                      <div className="progress w-100" style={{ maxWidth: '400px', height: '10px', borderRadius: '5px', backgroundColor: '#f1f5f9' }}>
                        <div className="progress-bar bg-purple progress-bar-striped progress-bar-animated" role="progressbar" style={{ width: `${scanProgress}%` }}></div>
                      </div>
                      <span className="text-purple font-weight-bold d-block mg-t-15" style={{ fontSize: '15px' }}>{scanProgress}% Scanned</span>
                    </div>
                  )}

                  {scanState === 'completed' && scanResult && (
                    <div className="center-position-container pd-y-20">
                      <div className="avatar-preview-box mg-b-25 shadow-sm" style={{ width: '160px', height: '160px', borderRadius: '24px', overflow: 'hidden', border: '4px solid #fff' }}>
                        <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      
                      <div className="scan-alert-box pd-25 mg-b-30" style={{ maxWidth: '600px', borderRadius: '20px', backgroundColor: scanResult.color === 'danger' ? '#fdf2f2' : '#f0fdf4', border: scanResult.color === 'danger' ? '1px solid #fecdca' : '1px solid #bdf4c5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                        <h5 className={`font-weight-bold text-${scanResult.color} mb-2`} style={{ fontSize: '17px' }}>
                          <i className="fas fa-exclamation-triangle mr-2"></i> {scanResult.label}
                        </h5>
                        <p className="text-dark small mb-3">Classification Confidence Score: <strong className="text-purple">{scanResult.confidence}</strong></p>
                        <p className="text-muted small mb-0 mx-auto" style={{ lineHeight: '1.6', maxWidth: '480px' }}>{scanResult.notes}</p>
                      </div>

                      <div className="d-flex justify-content-center" style={{ gap: '15px' }}>
                        <button className="btn btn-purple font-weight-bold rounded-pill" onClick={handleSupportClick} style={{ padding: '14px 30px', fontSize: '14px' }}>
                          <i className="typcn typcn-microphone mr-1.5" style={{ fontSize: '16px' }}></i> Call AI Doctor Now
                        </button>
                        <button className="btn btn-outline-light font-weight-bold text-muted rounded-pill" onClick={() => setScanState('idle')} style={{ borderColor: '#cbd5e1', padding: '14px 30px', fontSize: '14px' }}>
                          Scan Another Image
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Patient Intention & Info Sections */}
                <div className="center-position-container mg-t-50 mg-b-20 border-top pd-t-40 w-100">
                  <h3 className="font-weight-bold text-dark" style={{ fontSize: '24px' }}>Our Intentions & Service Offering</h3>
                  <p className="text-muted small max-width-440 text-center">A secure and pre-clinical neural network diagnostic portal built to streamline skin health awareness.</p>
                </div>

                <div className="intention-grid">
                  <div className="intention-card text-center center-position-container">
                    <div className="icon-circle icon-circle-purple shadow-sm">
                      <i className="typcn typcn-eye-outline"></i>
                    </div>
                    <h5 className="font-weight-bold text-dark mb-2" style={{ fontSize: '16px' }}>{adminConfig.intention1Title}</h5>
                    <p className="text-muted small mb-0" style={{ lineHeight: '1.6' }}>
                      {adminConfig.intention1Text}
                    </p>
                  </div>

                  <div className="intention-card text-center center-position-container">
                    <div className="icon-circle icon-circle-blue shadow-sm">
                      <i className="typcn typcn-microphone-outline"></i>
                    </div>
                    <h5 className="font-weight-bold text-dark mb-2" style={{ fontSize: '16px' }}>{adminConfig.intention2Title}</h5>
                    <p className="text-muted small mb-0" style={{ lineHeight: '1.6' }}>
                      {adminConfig.intention2Text}
                    </p>
                  </div>

                  <div className="intention-card text-center center-position-container">
                    <div className="icon-circle icon-circle-teal shadow-sm">
                      <i className="typcn typcn-document-text"></i>
                    </div>
                    <h5 className="font-weight-bold text-dark mb-2" style={{ fontSize: '16px' }}>{adminConfig.intention3Title}</h5>
                    <p className="text-muted small mb-0" style={{ lineHeight: '1.6' }}>
                      {adminConfig.intention3Text}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: PATIENT SCAN HISTORY */}
            {currentView === 'history' && user && (
              <div className="card card-body pd-40 animate-fade-in" style={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.01)' }}>
                <div className="d-flex justify-content-between align-items-center mg-b-35 pd-b-15 border-bottom">
                  <div>
                    <h3 className="font-weight-bold text-dark mb-1">Your Historical Skin Scans</h3>
                    <p className="text-muted mb-0">Review previously scanned moles and neural pre-diagnosis records.</p>
                  </div>
                  <button className="btn btn-outline-purple font-weight-bold rounded-pill" onClick={() => setCurrentView('dashboard')}>
                    <i className="typcn typcn-arrow-left mr-1.5"></i> Back to Scan
                  </button>
                </div>

                {scanHistory.length === 0 ? (
                  <div className="center-position-container pd-y-50">
                    <div className="text-muted mg-b-15" style={{ fontSize: '48px' }}>
                      <i className="typcn typcn-folder-open"></i>
                    </div>
                    <h5>No scans recorded yet</h5>
                    <p className="text-muted small">Go back to the Home page and upload an image to start tracking your history.</p>
                  </div>
                ) : (
                  <div className="history-grid">
                    {scanHistory.map((scan) => (
                      <div className="history-card" key={scan.id}>
                        <div className="history-image-container">
                          {scan.image.startsWith('/img/faces') ? (
                            <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-white" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}>
                              <i className="typcn typcn-image" style={{ fontSize: '48px' }}></i>
                              <span className="small font-weight-bold opacity-80 mt-1">Mole Scan Thumbnail</span>
                            </div>
                          ) : (
                            <img src={scan.image} className="history-image" alt="Mole Scan" />
                          )}
                        </div>
                        
                        <div className="history-details">
                          <div className="d-flex justify-content-between align-items-center mg-b-12">
                            <span className="text-muted small">{scan.date}</span>
                            <span className={`badge badge-${scan.color} pd-y-4 pd-x-8`} style={{ borderRadius: '4px', fontSize: '10px' }}>{scan.risk}</span>
                          </div>
                          <h6 className="font-weight-bold text-dark mb-2" style={{ fontSize: '15px' }}>{scan.label}</h6>
                          <p className="text-dark small mb-3">Confidence Rating: <strong>{scan.confidence}</strong></p>
                          <p className="text-muted small mb-4" style={{ lineHeight: '1.5', minHeight: '44px' }}>{scan.notes}</p>
                          
                          <button className="btn btn-purple btn-sm btn-block font-weight-bold rounded-pill" onClick={handleSupportClick} style={{ padding: '10px' }}>
                            <i className="typcn typcn-microphone mr-1"></i> Speak with AI Doctor
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW: ADMIN DASHBOARD */}
            {currentView === 'admin-dashboard' && user && user.role === 'admin' && (
              <div className="animate-fade-in">
                {/* Header Section */}
                <div className="d-flex justify-content-between align-items-center mg-b-25 pd-b-15 border-bottom">
                  <div>
                    <h2 className="text-dark font-weight-bold mb-1">System Management Portal</h2>
                    <p className="text-muted mb-0">Monitor patient scans, override diagnostic database logs, and view statistical charts.</p>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge badge-success pd-y-6 pd-x-12" style={{ borderRadius: '30px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white', display: 'inline-block' }}></span>
                      LiveKit Node Active
                    </span>
                  </div>
                </div>

                {/* Sub-Navigation Tabs (Settings tab completely removed) */}
                <div className="mg-b-30">
                  <ul className="nav nav-tabs border-bottom" style={{ gap: '15px' }}>
                    <li className="nav-item" style={{ marginBottom: '-1px' }}>
                      <a 
                        href="" 
                        className={`nav-link font-weight-bold pd-y-12 pd-x-20 border-top-0 border-left-0 border-right-0 ${adminSubView === 'database' ? 'active text-purple font-weight-bold' : 'text-muted'}`} 
                        onClick={(e) => { e.preventDefault(); setAdminSubView('database'); }}
                        style={{ borderBottom: adminSubView === 'database' ? '3px solid #a855f7' : 'none', transition: 'all 0.2s' }}
                      >
                        <i className="typcn typcn-folder-open mr-1.5" style={{ fontSize: '16px' }}></i> Patients Scan Database
                      </a>
                    </li>
                    <li className="nav-item" style={{ marginBottom: '-1px' }}>
                      <a 
                        href="" 
                        className={`nav-link font-weight-bold pd-y-12 pd-x-20 border-top-0 border-left-0 border-right-0 ${adminSubView === 'logs' ? 'active text-purple font-weight-bold' : 'text-muted'}`} 
                        onClick={(e) => { e.preventDefault(); setAdminSubView('logs'); }}
                        style={{ borderBottom: adminSubView === 'logs' ? '3px solid #a855f7' : 'none', transition: 'all 0.2s' }}
                      >
                        <i className="typcn typcn-document-text mr-1.5" style={{ fontSize: '16px' }}></i> Audit Logs
                      </a>
                    </li>
                    <li className="nav-item" style={{ marginBottom: '-1px' }}>
                      <a 
                        href="" 
                        className={`nav-link font-weight-bold pd-y-12 pd-x-20 border-top-0 border-left-0 border-right-0 ${adminSubView === 'stats' ? 'active text-purple font-weight-bold' : 'text-muted'}`} 
                        onClick={(e) => { e.preventDefault(); setAdminSubView('stats'); }}
                        style={{ borderBottom: adminSubView === 'stats' ? '3px solid #a855f7' : 'none', transition: 'all 0.2s' }}
                      >
                        <i className="typcn typcn-chart-bar mr-1.5" style={{ fontSize: '16px' }}></i> Statistics
                      </a>
                    </li>
                  </ul>
                </div>

                {/* TAB CONTENT: PATIENTS SCAN DATABASE (CRUD - Manual scan register completely removed) */}
                {adminSubView === 'database' && (
                  <div className="row">
                    <div className="col-12 mb-4">
                      <div className="card pd-30" style={{ borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                        <h4 className="admin-section-title">
                          <i className="typcn typcn-folder-open text-purple"></i> Patient Scan Database
                        </h4>
                        <p className="text-muted small mg-b-20">Review uploaded mole pictures, override diagnostic annotations, or archive records.</p>
                        
                        <div className="admin-table-container">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Scan Thumbnail</th>
                                <th>Patient / Date</th>
                                <th>Neural Diagnosis Details</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {scanHistory.map((scan) => (
                                <tr key={scan.id}>
                                  <td>
                                    {scan.image.startsWith('/img/faces') ? (
                                      <div className="admin-table-img d-flex align-items-center justify-content-center text-white" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', fontSize: '12px', fontWeight: 'bold' }}>
                                        MOLE
                                      </div>
                                    ) : (
                                      <img src={scan.image} className="admin-table-img" alt="Mole Scan" />
                                    )}
                                  </td>
                                  <td>
                                    <strong className="d-block small text-dark mb-1">{scan.patientEmail || 'patient@demo.com'}</strong>
                                    <span className="small d-block text-muted">{scan.date}</span>
                                  </td>
                                  <td>
                                    <div className="d-flex align-items-center mb-1.5" style={{ gap: '10px' }}>
                                      <strong className="small text-dark">{scan.label} (Conf: {scan.confidence})</strong>
                                      <select 
                                        className="form-control-sm text-muted"
                                        style={{ fontSize: '10px', padding: '2px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                        value={scan.risk}
                                        onChange={(e) => handleUpdateScanRisk(scan.id, e.target.value)}
                                      >
                                        <option value="Low Risk">Low Risk</option>
                                        <option value="Moderate Risk">Moderate Risk</option>
                                        <option value="High Risk / Action Required">High Risk</option>
                                      </select>
                                    </div>
                                    <textarea 
                                      className="form-control form-control-sm text-muted small" 
                                      rows="2" 
                                      value={scan.notes} 
                                      onChange={(e) => handleUpdateScanNotes(scan.id, e.target.value)}
                                      style={{ fontSize: '11px', borderRadius: '8px', padding: '6px', resize: 'vertical' }}
                                    />
                                  </td>
                                  <td>
                                    <button className="btn btn-outline-danger btn-xs rounded-pill" onClick={() => handleDeleteScan(scan.id)} style={{ padding: '4px 8px', fontSize: '11px' }}>
                                      <i className="typcn typcn-trash"></i> Delete
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

                {/* TAB CONTENT: AUDIT LOGS */}
                {adminSubView === 'logs' && (
                  <div className="card pd-30" style={{ borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                    <h4 className="admin-section-title">
                      <i className="typcn typcn-document-text text-purple"></i> System Audit Logs
                    </h4>
                    <p className="text-muted small mg-b-20">Chronological history of all security, authentication, and clinical scan operations performed on the site.</p>
                    
                    <div className="admin-table-container">
                      <table className="audit-logs-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Timestamp</th>
                            <th>Trigger User</th>
                            <th>Operation Action Description</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="font-weight-bold text-muted" style={{ width: '80px' }}>#{log.id.toString().substring(log.id.toString().length - 4)}</td>
                              <td style={{ width: '180px' }}>{log.timestamp}</td>
                              <td style={{ width: '220px' }}>
                                <span className="audit-badge-user">{log.user}</span>
                              </td>
                              <td className="font-weight-bold text-dark">{log.action}</td>
                              <td style={{ width: '100px' }}>
                                <span className="badge badge-success pd-y-4 pd-x-8" style={{ borderRadius: '4px', fontSize: '10px' }}>
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

                {/* TAB CONTENT: STATISTICS */}
                {adminSubView === 'stats' && (
                  <div className="row">
                    <div className="col-lg-6 mb-4">
                      <div className="card pd-30" style={{ borderRadius: '24px', border: '1px solid #e2e8f0', height: '100%' }}>
                        <h4 className="admin-section-title">
                          <i className="typcn typcn-chart-pie text-purple"></i> Diagnosis Risk Distribution
                        </h4>
                        <p className="text-muted small mg-b-25">Relative proportions of mole scans categorized by automated risk classifiers.</p>
                        
                        <div className="stats-chart-card">
                          <div className="stats-bar-group">
                            <div className="stats-bar-label">
                              <span>Low Risk (Common / Benign Moles)</span>
                              <span className="font-weight-bold text-success">{statsTotal ? ((statsLowRisk / statsTotal) * 100).toFixed(1) : 0}% ({statsLowRisk} scans)</span>
                            </div>
                            <div className="stats-bar-outer">
                              <div className="stats-bar-inner bg-success" style={{ width: `${statsTotal ? (statsLowRisk / statsTotal) * 100 : 0}%` }}></div>
                            </div>
                          </div>

                          <div className="stats-bar-group">
                            <div className="stats-bar-label">
                              <span>Moderate Risk (Atypical Features)</span>
                              <span className="font-weight-bold text-warning">{statsTotal ? ((statsModRisk / statsTotal) * 100).toFixed(1) : 0}% ({statsModRisk} scans)</span>
                            </div>
                            <div className="stats-bar-outer">
                              <div className="stats-bar-inner bg-warning" style={{ width: `${statsTotal ? (statsModRisk / statsTotal) * 100 : 0}%` }}></div>
                            </div>
                          </div>

                          <div className="stats-bar-group mb-0">
                            <div className="stats-bar-label">
                              <span>High Risk / Melanoma Indications</span>
                              <span className="font-weight-bold text-danger">{statsTotal ? ((statsHighRisk / statsTotal) * 100).toFixed(1) : 0}% ({statsHighRisk} scans)</span>
                            </div>
                            <div className="stats-bar-outer">
                              <div className="stats-bar-inner bg-danger" style={{ width: `${statsTotal ? (statsHighRisk / statsTotal) * 100 : 0}%` }}></div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-light pd-15 border-radius-10" style={{ borderRadius: '12px' }}>
                          <span className="small d-block text-muted">Mean Classification Confidence Score</span>
                          <h3 className="font-weight-bold text-purple mb-0 mg-t-5">{avgConfidence}% Confidence</h3>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-6 mb-4">
                      <div className="card pd-30" style={{ borderRadius: '24px', border: '1px solid #e2e8f0', height: '100%' }}>
                        <h4 className="admin-section-title">
                          <i className="typcn typcn-chart-bar text-purple"></i> Daily Upload Traffic
                        </h4>
                        <p className="text-muted small">Scan uploads activity volume recorded over the current week.</p>
                        
                        <div className="stats-trend-grid">
                          <div className="stats-trend-bar-wrapper">
                            <div className="stats-trend-bar bg-purple" style={{ height: '35px' }}></div>
                            <span className="stats-trend-label">Mon</span>
                          </div>
                          <div className="stats-trend-bar-wrapper">
                            <div className="stats-trend-bar bg-purple" style={{ height: '55px' }}></div>
                            <span className="stats-trend-label">Tue</span>
                          </div>
                          <div className="stats-trend-bar-wrapper">
                            <div className="stats-trend-bar bg-purple" style={{ height: '80px' }}></div>
                            <span className="stats-trend-label">Wed</span>
                          </div>
                          <div className="stats-trend-bar-wrapper">
                            <div className="stats-trend-bar bg-purple" style={{ height: '40px' }}></div>
                            <span className="stats-trend-label">Thu</span>
                          </div>
                          <div className="stats-trend-bar-wrapper">
                            <div className="stats-trend-bar bg-purple" style={{ height: '90px' }}></div>
                            <span className="stats-trend-label">Fri</span>
                          </div>
                          <div className="stats-trend-bar-wrapper">
                            <div className="stats-trend-bar bg-purple" style={{ height: '65px' }}></div>
                            <span className="stats-trend-label">Sat</span>
                          </div>
                          <div className="stats-trend-bar-wrapper">
                            <div className="stats-trend-bar bg-primary" style={{ height: `${20 + (statsTotal * 8)}px` }}></div>
                            <span className="stats-trend-label">Sun (Live)</span>
                          </div>
                        </div>
                        <p className="text-muted small mg-t-15 mb-0 text-center">
                          Total scans processed this week: <strong className="text-dark">{statsTotal + 24}</strong> cases.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Upgraded Modern Premium Footer */}
      <div className="az-footer-custom">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <span className="footer-brand">
                <i className="typcn typcn-heart-full-outline footer-heart-pulse"></i>
                DermaScan
              </span>
              <span className="footer-brand-text">
                Deploying state-of-the-art deep neural networks and real-time audio triage support to assist in early detection and warning signs of melanoma skin atypical conditions.
              </span>
            </div>
            <div className="footer-col">
              <span className="footer-col-title">Navigation</span>
              <ul className="footer-links">
                {!user ? (
                  <>
                    <li><a href="" onClick={(e) => { e.preventDefault(); setCurrentView('login'); }}>Sign In</a></li>
                    <li><a href="" onClick={(e) => { e.preventDefault(); setCurrentView('register'); }}>Register</a></li>
                  </>
                ) : user.role === 'admin' ? (
                  <>
                    <li><a href="" onClick={(e) => { e.preventDefault(); setCurrentView('admin-dashboard'); }}>Admin Portal</a></li>
                    <li><a href="" onClick={handleLogout}>Sign Out</a></li>
                  </>
                ) : (
                  <>
                    <li><a href="" onClick={(e) => { e.preventDefault(); setCurrentView('dashboard'); }}>Home Portal</a></li>
                    <li><a href="" onClick={(e) => { e.preventDefault(); setCurrentView('history'); }}>Mole Scan History</a></li>
                    <li><a href="" onClick={handleSupportClick}>Consult AI Dermatologist</a></li>
                    <li><a href="" onClick={handleLogout}>Sign Out</a></li>
                  </>
                )}
              </ul>
            </div>
            <div className="footer-col">
              <span className="footer-col-title">Medical Disclaimer</span>
              <div className="footer-disclaimer">
                <strong>Attention Patients:</strong> DermaScan provides an instant neural classification model for informational triage purpose. It is NOT a diagnostic replacement for a certified dermatologist clinical examination. Always discuss anomalies directly with a clinical doctor.
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span className="footer-bottom-text">
              &copy; {new Date().getFullYear()} DermaScan AI. All rights reserved. Secure clinical logs.
            </span>
            <span className="footer-bottom-text">
              Powered by <strong className="text-purple">LiveKit Voice Agents</strong> & WebRTC.
            </span>
          </div>
        </div>
      </div>

      {/* Voice Assistant Modal */}
      {showSupport && <LiveKitModal setShowSupport={setShowSupport}/>}
    </div>
  )
}

export default App;