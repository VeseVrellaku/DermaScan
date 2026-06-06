import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './ProfileDropdown.css';

/**
 * @typedef {'admin' | 'patient' | 'doctor'} PortalRole
 */

function normalizeRole(role) {
  if (role === 'admin') return 'admin';
  if (role === 'doctor') return 'doctor';
  return 'patient';
}

/**
 * @param {{
 *   user: { name?: string, email: string, role?: string },
 *   isOpen: boolean,
 *   onToggle: () => void,
 *   onClose: () => void,
 *   onNavigate: (view: string) => void,
 *   onLogout: () => void,
 *   onSupportClick?: () => void,
 *   currentView?: string,
 * }} props
 */
export default function ProfileDropdown({
  user,
  isOpen,
  onToggle,
  onClose,
  onNavigate,
  onLogout,
  onSupportClick,
  currentView,
}) {
  const toggleRef = useRef(null);
  const dropdownRef = useRef(null);
  const firstItemRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);
  const role = normalizeRole(user?.role);

  const updateMenuPosition = () => {
    if (!toggleRef.current) return;
    const rect = toggleRef.current.getBoundingClientRect();
    setMenuStyle({
      top: rect.bottom + 8,
      right: Math.max(12, window.innerWidth - rect.right),
      minWidth: 260,
    });
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updateMenuPosition();
    } else {
      setMenuStyle(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleReposition = () => updateMenuPosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    const handleClickOutside = (event) => {
      const target = event.target;
      if (
        toggleRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
        toggleRef.current?.focus();
      }
    };

    const timeoutId = window.setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    document.addEventListener('keydown', handleEscape);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      firstItemRef.current?.focus();
    }
  }, [isOpen, menuStyle]);

  const handleToggleClick = (event) => {
    event.stopPropagation();
    onToggle();
  };

  const handleItemClick = (view) => {
    onClose();
    onNavigate(view);
  };

  const handleLogoutClick = () => {
    onClose();
    onLogout();
  };

  const isActive = (view) => currentView === view;

  const patientItems = [
    { view: 'dashboard', label: 'My Dashboard', icon: 'bi-speedometer2' },
    { view: 'history', label: 'Scan History', icon: 'bi-clock-history' },
  ];

  const doctorItems = [
    { view: 'doctor-dashboard', label: 'Doctor Dashboard', icon: 'bi-clipboard2-pulse' },
  ];

  const adminItems = [
    { view: 'admin-dashboard', label: 'Admin Dashboard', icon: 'bi-shield-lock' },
  ];

  const sharedItems = [
    { view: 'profile-settings', label: 'Profile Settings', icon: 'bi-gear' },
  ];

  let roleItems = patientItems;
  if (role === 'admin') roleItems = adminItems;
  else if (role === 'doctor') roleItems = [...patientItems, ...doctorItems];

  const dropdownMenu = isOpen && menuStyle
    ? createPortal(
        <ul
          ref={dropdownRef}
          id="profile-dropdown-menu"
          className="portal-user-menu__dropdown portal-user-menu__dropdown--portal"
          role="menu"
          style={{
            position: 'fixed',
            top: menuStyle.top,
            right: menuStyle.right,
            minWidth: menuStyle.minWidth,
          }}
        >
          {roleItems.map((item, index) => (
            <li key={item.view} role="none">
              <button
                ref={index === 0 ? firstItemRef : null}
                className={`portal-user-menu__item ${isActive(item.view) ? 'active' : ''}`}
                type="button"
                role="menuitem"
                onClick={() => handleItemClick(item.view)}
              >
                <i className={`bi ${item.icon} me-2`} aria-hidden="true"></i>
                {item.label}
              </button>
            </li>
          ))}

          {role === 'patient' && onSupportClick && (
            <li role="none">
              <button
                className="portal-user-menu__item"
                type="button"
                role="menuitem"
                onClick={() => {
                  onClose();
                  onSupportClick();
                }}
              >
                <i className="bi bi-mic me-2" aria-hidden="true"></i>
                AI Doctor
              </button>
            </li>
          )}

          {sharedItems.map((item) => (
            <li key={item.view} role="none">
              <button
                className={`portal-user-menu__item ${isActive(item.view) ? 'active' : ''}`}
                type="button"
                role="menuitem"
                onClick={() => handleItemClick(item.view)}
              >
                <i className={`bi ${item.icon} me-2`} aria-hidden="true"></i>
                {item.label}
              </button>
            </li>
          ))}

          <li role="none"><hr className="portal-user-menu__divider" /></li>

          <li role="none">
            <button
              className="portal-user-menu__item portal-user-menu__item--danger"
              type="button"
              role="menuitem"
              onClick={handleLogoutClick}
            >
              <i className="bi bi-box-arrow-right me-2" aria-hidden="true"></i>
              Logout
            </button>
          </li>
        </ul>,
        document.body,
      )
    : null;

  return (
    <div className="portal-user-menu">
      <button
        ref={toggleRef}
        className="cta-btn portal-user-menu__toggle border-0"
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="profile-dropdown-menu"
        onClick={handleToggleClick}
      >
        <i className="bi bi-person-circle me-1" aria-hidden="true"></i>
        <span className="portal-user-menu__name">{user.name || user.email}</span>
        <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} ms-1`} aria-hidden="true"></i>
      </button>
      {dropdownMenu}
    </div>
  );
}
