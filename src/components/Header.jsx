import React, { useState } from "react";
import { NavLink } from "react-router-dom";

export default function Header({
  userToken,
  currentUsername,
  handleSignOut,
  setShowAuthModal,
  setAuthMode,
  setAuthError
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="top-nav">
      <div className="top-nav-main-row">
        {/* Left Side: Logo */}
        <div className="brand-section">
          <NavLink to="/" end className="brand-logo-link" onClick={closeMobileMenu}>
            <h1 className="brand-title">AstroVeda</h1>
          </NavLink>
        </div>

        {/* Center: Desktop Navigation Links (Hidden on mobile) */}
        <nav className="top-nav-links desktop-only">
          <NavLink to="/" end className={({ isActive }) => `top-nav-link ${isActive ? "active" : ""}`}>
            Dashboard
          </NavLink>
          <NavLink to="/query" className={({ isActive }) => `top-nav-link ${isActive ? "active" : ""}`}>
            Predictions
          </NavLink>
          <NavLink to="/shadbala" className={({ isActive }) => `top-nav-link ${isActive ? "active" : ""}`}>
            Analysis
          </NavLink>
          <NavLink to="/matchmaking" className={({ isActive }) => `top-nav-link ${isActive ? "active" : ""}`}>
            Compatibility
          </NavLink>
          <NavLink to="/muhurta" className={({ isActive }) => `top-nav-link ${isActive ? "active" : ""}`}>
            Muhurta
          </NavLink>
          <NavLink to="/library" className={({ isActive }) => `top-nav-link ${isActive ? "active" : ""}`}>
            Library
          </NavLink>
          {userToken && (
            <NavLink to="/security" className={({ isActive }) => `top-nav-link ${isActive ? "active" : ""}`}>
              Security
            </NavLink>
          )}
        </nav>

        {/* Right Side: Auth Widget + Hamburger Menu Button */}
        <div className="top-nav-right">
          {/* Auth Widget (Compact style) */}
          <div className="auth-widget-wrapper">
            {userToken ? (
              <div className="user-profile-widget">
                <span className="user-profile-name">
                  👤 <strong className="user-bold-name">{currentUsername}</strong>
                </span>
                <button 
                  onClick={() => { handleSignOut(); closeMobileMenu(); }}
                  className="btn-secondary btn-auth-compact"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setShowAuthModal(true); setAuthMode("login"); setAuthError(""); closeMobileMenu(); }}
                className="btn-primary btn-auth-compact"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Hamburger Menu Icon Button (Visible only on mobile/tablet) */}
          <button 
            className="hamburger-btn" 
            onClick={toggleMobileMenu} 
            aria-label="Toggle Navigation Menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Mobile Side-Drawer / Dropdown Menu */}
      <div className={`mobile-menu-drawer ${isMobileMenuOpen ? "open" : ""}`}>
        <nav className="mobile-nav-links">
          <NavLink to="/" end className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`} onClick={closeMobileMenu}>
            Dashboard
          </NavLink>
          <NavLink to="/query" className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`} onClick={closeMobileMenu}>
            Predictions
          </NavLink>
          <NavLink to="/shadbala" className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`} onClick={closeMobileMenu}>
            Analysis
          </NavLink>
          <NavLink to="/matchmaking" className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`} onClick={closeMobileMenu}>
            Compatibility
          </NavLink>
          <NavLink to="/muhurta" className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`} onClick={closeMobileMenu}>
            Muhurta
          </NavLink>
          <NavLink to="/library" className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`} onClick={closeMobileMenu}>
            Library
          </NavLink>
          {userToken && (
            <NavLink to="/security" className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`} onClick={closeMobileMenu}>
              Security
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
