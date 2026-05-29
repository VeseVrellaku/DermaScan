import React, { useState, useEffect } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('mobile-nav-active');
    } else {
      document.body.classList.remove('mobile-nav-active');
    }
  }, [mobileMenuOpen]);

  // Close mobile menu when a link is clicked
  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header id="header" className="header sticky-top">
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
          <a href="/" className="logo d-flex align-items-center me-auto">
            <h1 className="sitename">DermaScan</h1>
          </a>

          <nav id="navmenu" className={`navmenu ${mobileMenuOpen ? 'mobile-nav-show' : ''}`}>
            <ul>
              <li><a href="#hero" className="active" onClick={handleLinkClick}>Home</a></li>
              <li><a href="#about" onClick={handleLinkClick}>About Project</a></li>
              <li><a href="#features" onClick={handleLinkClick}>Features</a></li>
              <li><a href="#how-it-works" onClick={handleLinkClick}>How It Works</a></li>
              <li><a href="#team" onClick={handleLinkClick}>Our Team</a></li>
              <li><a href="#faq" onClick={handleLinkClick}>FAQ</a></li>
              <li><a href="#contact" onClick={handleLinkClick}>Contact</a></li>
            </ul>
            <i 
              className={`mobile-nav-toggle d-xl-none bi ${mobileMenuOpen ? 'bi-x' : 'bi-list'}`}
              onClick={toggleMobileMenu}
            ></i>
          </nav>

          <a className="cta-btn" href="#scan">Scan Your Skin</a>
        </div>
      </div>
    </header>
  );
}
