import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function PortalHeader({
  user,
  currentView,
  onNavigate,
  onLogout,
  onSupportClick,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('mobile-nav-active');
    } else {
      document.body.classList.remove('mobile-nav-active');
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!userMenuOpen) return undefined;

    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setUserMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [userMenuOpen]);

  const handleNav = (view) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  const handleLogoutClick = () => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    onLogout();
  };

  return (
    <header id="header" className="header sticky-top portal-header">
      <div className="topbar d-flex align-items-center">
        <div className="container d-flex justify-content-center justify-content-md-between">
          <div className="d-none d-md-flex align-items-center">
            <i className="bi bi-shield-check me-1"></i> Your Skin Health Matters
          </div>
          <div className="d-flex align-items-center">
            <i className="bi bi-envelope me-1"></i> Contact us: support@dermascan.com
          </div>
        </div>
      </div>

      <div className="branding d-flex align-items-center">
        <div className="container position-relative d-flex align-items-center justify-content-end">
          <Link
            to="/"
            className="logo d-flex align-items-center me-auto"
            onClick={() => user && handleNav(user.role === 'admin' ? 'admin-dashboard' : 'dashboard')}
          >
            <h1 className="sitename">DermaScan</h1>
          </Link>

          <nav id="navmenu" className={`navmenu ${mobileMenuOpen ? 'mobile-nav-show' : ''}`}>
            <ul>
              {!user ? (
                <>
                  <li>
                    <a
                      href="#login"
                      className={currentView === 'login' ? 'active' : ''}
                      onClick={(e) => { e.preventDefault(); handleNav('login'); }}
                    >
                      Sign In
                    </a>
                  </li>
                  <li>
                    <a
                      href="#register"
                      className={currentView === 'register' ? 'active' : ''}
                      onClick={(e) => { e.preventDefault(); handleNav('register'); }}
                    >
                      Register
                    </a>
                  </li>
                </>
              ) : user.role === 'admin' ? (
                <>
                  <li>
                    <a
                      href="#users"
                      className={currentView === 'admin-dashboard' ? 'active' : ''}
                      onClick={(e) => { e.preventDefault(); handleNav('admin-dashboard'); }}
                    >
                      Admin Dashboard
                    </a>
                  </li>
                  <li>
                    <a
                      href="#logout"
                      onClick={(e) => { e.preventDefault(); handleLogoutClick(); }}
                    >
                      Sign Out
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <a
                      href="#dashboard"
                      className={currentView === 'dashboard' ? 'active' : ''}
                      onClick={(e) => { e.preventDefault(); handleNav('dashboard'); }}
                    >
                      Dashboard
                    </a>
                  </li>
                  <li>
                    <a
                      href="#history"
                      className={currentView === 'history' ? 'active' : ''}
                      onClick={(e) => { e.preventDefault(); handleNav('history'); }}
                    >
                      Scan History
                    </a>
                  </li>
                  <li>
                    <a href="#ai-doctor" onClick={(e) => { e.preventDefault(); onSupportClick(); }}>
                      AI Doctor
                    </a>
                  </li>
                  <li className="d-xl-none">
                    <a
                      href="#logout"
                      onClick={(e) => { e.preventDefault(); handleLogoutClick(); }}
                    >
                      Sign Out
                    </a>
                  </li>
                </>
              )}
            </ul>
            <i
              className={`mobile-nav-toggle d-xl-none bi ${mobileMenuOpen ? 'bi-x' : 'bi-list'}`}
              onClick={() => setMobileMenuOpen((open) => !open)}
              role="button"
              aria-label="Toggle menu"
            ></i>
          </nav>

          {user ? (
            <div className="portal-user-menu ms-3" ref={userMenuRef}>
              <button
                className="cta-btn portal-user-menu__toggle border-0"
                type="button"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                onClick={() => setUserMenuOpen((open) => !open)}
              >
                <i className="bi bi-person-circle me-1" aria-hidden="true"></i>
                <span className="portal-user-menu__name">{user.name || user.email}</span>
                <i className={`bi bi-chevron-${userMenuOpen ? 'up' : 'down'} ms-1`} aria-hidden="true"></i>
              </button>
              {userMenuOpen && (
                <ul className="portal-user-menu__dropdown" role="menu">
                  {user.role !== 'admin' && (
                    <>
                      <li role="none">
                        <button className="dropdown-item" type="button" role="menuitem" onClick={() => handleNav('dashboard')}>
                          <i className="bi bi-speedometer2 me-2"></i> Dashboard
                        </button>
                      </li>
                      <li role="none">
                        <button className="dropdown-item" type="button" role="menuitem" onClick={() => handleNav('history')}>
                          <i className="bi bi-clock-history me-2"></i> Scan History
                        </button>
                      </li>
                      <li role="none"><hr className="dropdown-divider my-1" /></li>
                    </>
                  )}
                  <li role="none">
                    <button className="dropdown-item text-danger" type="button" role="menuitem" onClick={handleLogoutClick}>
                      <i className="bi bi-box-arrow-right me-2"></i> Sign Out
                    </button>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <Link className="cta-btn" to="/app" onClick={(e) => { e.preventDefault(); handleNav('login'); }}>
              Get Started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
