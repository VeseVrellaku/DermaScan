import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../../config/env.js';
import ProfileDropdown from '../portal/ProfileDropdown';

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
  const isPortal = location.pathname.startsWith('/app');

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

  const getHomeLink = (hash) => (isHomepage ? hash : `/${hash}`);

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
            onClick={() => {
              setMobileMenuOpen(false);
              setUserMenuOpen(false);
            }}
          >
            <h1 className="sitename">DermaScan</h1>
          </Link>

          <nav id="navmenu" className={`navmenu ${mobileMenuOpen ? 'mobile-nav-show' : ''}`}>
            <ul>
              <li>
                <a href={getHomeLink('#hero')} className={isHomepage && !currentView ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
                  Home
                </a>
              </li>
              <li>
                <a href={getHomeLink('#about')} onClick={() => setMobileMenuOpen(false)}>About Project</a>
              </li>
              <li>
                <a href={getHomeLink('#features')} onClick={() => setMobileMenuOpen(false)}>Features</a>
              </li>
              <li>
                <a href={getHomeLink('#how-it-works')} onClick={() => setMobileMenuOpen(false)}>How It Works</a>
              </li>
              <li>
                <a href={getHomeLink('#team')} onClick={() => setMobileMenuOpen(false)}>Our Team</a>
              </li>
              <li>
                <a href={getHomeLink('#faq')} onClick={() => setMobileMenuOpen(false)}>FAQ</a>
              </li>
              <li>
                <a href={getHomeLink('#contact')} onClick={() => setMobileMenuOpen(false)}>Contact</a>
              </li>

              {!user && (
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
            <div className="ms-3">
              <ProfileDropdown
                user={user}
                isOpen={userMenuOpen}
                onToggle={() => setUserMenuOpen((open) => !open)}
                onClose={() => setUserMenuOpen(false)}
                onNavigate={handleNav}
                onLogout={handleLogoutClick}
                onSupportClick={isPortal ? onSupportClick : () => navigate('/app', { state: { view: 'dashboard', openSupport: true } })}
                currentView={currentView}
              />
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
