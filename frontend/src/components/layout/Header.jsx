import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../../config/env.js';

export default function Header({
  user: propUser,
  currentView,
  onNavigate,
  onLogout,
  onSupportClick,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Local state if not inside PortalLayout
  const [localUser, setLocalUser] = useState(null);

  useEffect(() => {
    if (!propUser) {
      const savedUser = localStorage.getItem(AUTH_USER_KEY);
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (savedUser && token) {
        setLocalUser(JSON.parse(savedUser));
      } else {
        setLocalUser(null);
      }
    }
  }, [propUser, location.pathname]);

  const user = propUser || localUser;
  const isHomepage = location.pathname === '/';

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('mobile-nav-active');
    } else {
      document.body.classList.remove('mobile-nav-active');
    }
    return () => {
      document.body.classList.remove('mobile-nav-active');
    };
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
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    if (onNavigate) {
      onNavigate(view);
    } else {
      navigate('/app', { state: { view } });
    }
  };

  const handleLogoutClick = () => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setLocalUser(null);
      navigate('/');
    }
  };

  const getHomeLink = (hash) => {
    return isHomepage ? hash : `/${hash}`;
  };

  return (
    <header id="header" className="header sticky-top portal-header">
      {/* Top Bar Info */}
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

      {/* Main Navbar */}
      <div className="branding d-flex align-items-center">
        <div className="container position-relative d-flex align-items-center justify-content-end">
          <Link
            to="/"
            className="logo d-flex align-items-center me-auto"
            onClick={() => {
              setMobileMenuOpen(false);
              setUserMenuOpen(false);
            }}
          >
            <h1 className="sitename">DermaScan</h1>
          </Link>

          <nav id="navmenu" className={`navmenu ${mobileMenuOpen ? 'mobile-nav-show' : ''}`}>
            <ul>
              {/* Marketing Sections Links */}
              <li>
                <a href={getHomeLink('#hero')} className={isHomepage && !currentView ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
                  Home
                </a>
              </li>
              <li>
                <a href={getHomeLink('#about')} onClick={() => setMobileMenuOpen(false)}>
                  About Project
                </a>
              </li>
              <li>
                <a href={getHomeLink('#features')} onClick={() => setMobileMenuOpen(false)}>
                  Features
                </a>
              </li>
              <li>
                <a href={getHomeLink('#how-it-works')} onClick={() => setMobileMenuOpen(false)}>
                  How It Works
                </a>
              </li>
              <li>
                <a href={getHomeLink('#team')} onClick={() => setMobileMenuOpen(false)}>
                  Our Team
                </a>
              </li>
              <li>
                <a href={getHomeLink('#faq')} onClick={() => setMobileMenuOpen(false)}>
                  FAQ
                </a>
              </li>
              <li>
                <a href={getHomeLink('#contact')} onClick={() => setMobileMenuOpen(false)}>
                  Contact
                </a>
              </li>

              {/* Portal Contextual Links (if logged in) */}
              {user && (
                <>
                  {user.role === 'admin' ? (
                    <li>
                      <a
                        href="#admin-dashboard"
                        className={currentView === 'admin-dashboard' ? 'active' : ''}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNav('admin-dashboard');
                        }}
                      >
                        Admin Dashboard
                      </a>
                    </li>
                  ) : (
                    <>
                      <li>
                        <a
                          href="#dashboard"
                          className={currentView === 'dashboard' ? 'active' : ''}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNav('dashboard');
                          }}
                        >
                          Dashboard
                        </a>
                      </li>
                      <li>
                        <a
                          href="#history"
                          className={currentView === 'history' ? 'active' : ''}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNav('history');
                          }}
                        >
                          Scan History
                        </a>
                      </li>
                      <li>
                        <a
                          href="#ai-doctor"
                          onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            if (onSupportClick) {
                              onSupportClick();
                            } else {
                              // If on home, redirect to portal dashboard and trigger AI Doctor
                              navigate('/app', { state: { view: 'dashboard', openSupport: true } });
                            }
                          }}
                        >
                          AI Doctor
                        </a>
                      </li>
                    </>
                  )}
                  {/* Mobile-only Logout */}
                  <li className="d-xl-none">
                    <a
                      href="#logout"
                      onClick={(e) => {
                        e.preventDefault();
                        handleLogoutClick();
                      }}
                      className="text-danger"
                    >
                      Sign Out
                    </a>
                  </li>
                </>
              )}

              {/* Logged Out Actions */}
              {!user && (
                <>
                  <li>
                    <a
                      href="#login"
                      className={currentView === 'login' ? 'active' : ''}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNav('login');
                      }}
                    >
                      Sign In
                    </a>
                  </li>
                  <li>
                    <a
                      href="#register"
                      className={currentView === 'register' ? 'active' : ''}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNav('register');
                      }}
                    >
                      Register
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

          {/* User Profile dropdown */}
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
            <Link className="cta-btn ms-3" to="/app" onClick={() => handleNav('login')}>
              Get Started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
