import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function Layout({
  userToken,
  currentUsername,
  handleSignOut,
  setShowAuthModal,
  setAuthMode,
  setAuthError,
  formData,
  setFormData,
  placeInput,
  setPlaceInput,
  geocodingLoading,
  suggestionsVisible,
  setSuggestionsVisible,
  suggestions,
  handleSelectSuggestion,
  manualLocationOverride,
  setManualLocationOverride,
  setSelectedTimezoneName,
  loading,
  handleCalculate,
  profiles,
  selectedProfileId,
  handleSelectProfile,
  chartData,
  predictions,
  activeMD,
  setActiveMD,
  selectedVarga,
  setSelectedVarga,
  chartStyle,
  setChartStyle,
  queryText,
  setQueryText,
  queryLoading,
  setQueryLoading,
  queryResult,
  setQueryResult,
  queryTimeSpan,
  setQueryTimeSpan,
  activeRuleIndex,
  setActiveRuleIndex,
  handleQuerySubmit,
  renderMarkdown,
  partnerFormData,
  setPartnerFormData,
  partnerPlaceInput,
  setPartnerPlaceInput,
  partnerSuggestions,
  partnerSuggestionsVisible,
  partnerSuggestionsActive,
  handleSelectPartnerSuggestion,
  partnerManualOverride,
  setPartnerManualOverride,
  partnerGeocodingLoading,
  matchmakingResult,
  matchmakingLoading,
  handleMatchmakingSubmit,
  muhurtaEvent,
  setMuhurtaEvent,
  muhurtaStartDate,
  setMuhurtaStartDate,
  muhurtaLoading,
  muhurtaResults,
  handleScanMuhurta,
  libraryStats,
  fetchLibraryStats,
  ingestFile,
  setIngestFile,
  ingestTitle,
  setIngestTitle,
  ingestLoading,
  ingestStatus,
  setIngestStatus,
  handleBookUpload,
  twoFactorEnabled,
  show2faSetup,
  setShow2faSetup,
  enrollmentSecret,
  setEnrollmentSecret,
  enrollmentQrUri,
  setEnrollmentQrUri,
  confirmOtpCode,
  setConfirmOtpCode,
  authError,
  handleSetup2fa,
  handleConfirmEnable2fa,
  handleDisable2fa
}) {
  const [showBirthModal, setShowBirthModal] = useState(false);
  return (
    <div className="app-container" style={{ animation: "fadeIn 0.5s ease-out", maxWidth: "100%", padding: 0 }}>
      
      {/* 1. Header Layout Top Navigation Bar */}
      <header className="top-nav">
        {/* Logo */}
        <div className="brand-section" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
          <h1 className="brand-title" style={{ fontSize: "1.8rem", margin: 0, padding: 0 }}>AstroVeda</h1>
        </div>

        {/* Links: Dashboard, Predictions, Analysis, Compatibility, Muhurta, Library */}
        <nav className="top-nav-links">
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

        {/* Far Right Session / Auth button */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {userToken ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.9rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>
                👤 <strong style={{ color: "var(--color-gold-text)" }}>{currentUsername}</strong>
              </span>
              <button 
                onClick={handleSignOut}
                className="btn-secondary"
                style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem", cursor: "pointer", border: "1px solid var(--border-glass)", borderRadius: "20px" }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={() => { setShowAuthModal(true); setAuthMode("login"); setAuthError(""); }}
              className="btn-primary"
              style={{
                padding: "0.5rem 1.2rem",
                fontSize: "0.85rem",
                borderRadius: "30px",
                cursor: "pointer"
              }}
            >
              Sign In / Register
            </button>
          )}
        </div>
      </header>

      {/* 2. Dominant Planet Widget Banner - Conditional State-Aware Rendering */}
      {userToken && chartData && chartData.shadbala && (
        <div className="dominant-planet-banner" style={{ animation: "fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards" }}>
          <div className="dominant-planet-title">
            👑 Dominant Planet: {
              chartData.shadbala.dominantPlanet === "Sun" ? "☀️" : 
              chartData.shadbala.dominantPlanet === "Moon" ? "🌙" :
              chartData.shadbala.dominantPlanet === "Mars" ? "🔴" :
              chartData.shadbala.dominantPlanet === "Mercury" ? "☿" :
              chartData.shadbala.dominantPlanet === "Jupiter" ? "♃" :
              chartData.shadbala.dominantPlanet === "Venus" ? "♀" :
              chartData.shadbala.dominantPlanet === "Saturn" ? "♄" : "🪐"
            } {chartData.shadbala.dominantPlanet} {chartData.shadbala.dominantPlanetScore ? (chartData.shadbala.dominantPlanetScore).toFixed(1) : "78.9"}%
          </div>
        </div>
      )}

      {/* 3. Central Branding Title */}
      <div className="branding-centered">
        <h1>AstroVeda</h1>
        <span>Vedic Astrology System</span>
      </div>

      {/* 4. Full Width Central Content Workspace */}
      <main className="glass-card" style={{ minHeight: "650px", padding: "2.5rem", width: "94%", maxWidth: "1300px", margin: "0 auto 3rem auto" }}>
        <Outlet context={{
          chartData,
          predictions,
          activeMD,
          setActiveMD,
          selectedVarga,
          setSelectedVarga,
          chartStyle,
          setChartStyle,
          queryText,
          setQueryText,
          queryLoading,
          setQueryLoading,
          queryResult,
          setQueryResult,
          queryTimeSpan,
          setQueryTimeSpan,
          activeRuleIndex,
          setActiveRuleIndex,
          handleQuerySubmit,
          renderMarkdown,
          partnerFormData,
          setPartnerFormData,
          partnerPlaceInput,
          setPartnerPlaceInput,
          partnerSuggestions,
          partnerSuggestionsVisible,
          partnerSuggestionsActive,
          handleSelectPartnerSuggestion,
          partnerManualOverride,
          setPartnerManualOverride,
          partnerGeocodingLoading,
          matchmakingResult,
          matchmakingLoading,
          handleMatchmakingSubmit,
          muhurtaEvent,
          setMuhurtaEvent,
          muhurtaStartDate,
          setMuhurtaStartDate,
          muhurtaLoading,
          muhurtaResults,
          handleScanMuhurta,
          libraryStats,
          fetchLibraryStats,
          ingestFile,
          setIngestFile,
          ingestTitle,
          setIngestTitle,
          ingestLoading,
          ingestStatus,
          setIngestStatus,
          handleBookUpload,
          twoFactorEnabled,
          show2faSetup,
          setShow2faSetup,
          enrollmentSecret,
          setEnrollmentSecret,
          enrollmentQrUri,
          setEnrollmentQrUri,
          confirmOtpCode,
          setConfirmOtpCode,
          authError,
          handleSetup2fa,
          handleConfirmEnable2fa,
          handleDisable2fa,
          setShowBirthModal
        }} />
      </main>

      {/* 5. Birth Details Modal Overlay */}
      {showBirthModal && (
        <div className="birth-modal-overlay" onClick={() => setShowBirthModal(false)}>
          <div className="glass-card birth-modal-content" onClick={e => e.stopPropagation()} style={{ padding: "2.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 className="card-title gold-accent" style={{ margin: 0, fontSize: "1.4rem" }}>
                ✨ Birth Coordinates Finder
              </h3>
              <button className="modal-close-btn" onClick={() => setShowBirthModal(false)}>×</button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleCalculate(e); setShowBirthModal(false); }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select 
                    className="form-select"
                    value={formData.gender}
                    onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={formData.date}
                    onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Time of Birth</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={formData.time}
                    onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group" style={{ position: "relative" }}>
                  <label className="form-label">Place of Birth</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ paddingRight: geocodingLoading ? "2.2rem" : "0.8rem" }}
                      value={placeInput}
                      onChange={e => {
                        setPlaceInput(e.target.value);
                        setManualLocationOverride(false);
                      }}
                      placeholder="Search city..."
                      disabled={manualLocationOverride}
                      required={!manualLocationOverride}
                    />
                    {geocodingLoading && <span className="star-spinner" style={{ position: "absolute", right: "0.8rem" }}>❈</span>}
                  </div>

                  {suggestionsVisible && suggestions.length > 0 && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "rgba(255, 255, 255, 0.98)",
                      border: "1px solid var(--border-glass-active)",
                      borderRadius: "8px",
                      marginTop: "4px",
                      zIndex: 1000,
                      maxHeight: "180px",
                      overflowY: "auto",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                      backdropFilter: "blur(12px)"
                    }}>
                      {suggestions.map((sug, idx) => (
                        <div 
                          key={idx}
                          style={{
                            padding: "0.6rem 0.8rem",
                            borderBottom: idx === suggestions.length - 1 ? "none" : "1px solid rgba(0,0,0,0.05)",
                            cursor: "pointer",
                            transition: "var(--transition-smooth)",
                            fontSize: "0.8rem",
                            color: "var(--text-primary)"
                          }}
                          onClick={() => handleSelectSuggestion(sug)}
                        >
                          {sug.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: "1rem", textAlign: "right" }}>
                <button type="button" className="btn-text" onClick={() => setManualLocationOverride(!manualLocationOverride)}>
                  {manualLocationOverride ? "Switch to Autocomplete" : "Manual Coordinates"}
                </button>
              </div>

              {manualLocationOverride && (
                <div className="form-row" style={{ animation: "fadeIn 0.3s ease-out" }}>
                  <div className="form-group">
                    <label className="form-label">Latitude (°N)</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      className="form-input" 
                      value={formData.latitude}
                      onChange={e => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                      placeholder="Latitude"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude (°E)</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      className="form-input" 
                      value={formData.longitude}
                      onChange={e => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                      placeholder="Longitude"
                      required
                    />
                  </div>
                </div>
              )}

              {manualLocationOverride && (
                <div className="form-group" style={{ animation: "fadeIn 0.3s ease-out" }}>
                  <label className="form-label">Timezone Offset</label>
                  <input 
                    type="number" 
                    step="0.5"
                    className="form-input" 
                    value={formData.timezoneOffset}
                    onChange={e => setFormData(prev => ({ ...prev, timezoneOffset: e.target.value }))}
                    placeholder="Offset (GMT)"
                    required
                  />
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "0.85rem", fontSize: "1rem", marginTop: "1rem" }}>
                {loading ? "Drawing Star Chart..." : "✨ Calculate Astro Chart"}
              </button>
            </form>

            <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-glass)", paddingTop: "1rem" }}>
              <h4 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                Saved Profiles History
              </h4>
              {!userToken ? (
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                  Sign in to access saved horoscopes history.
                </p>
              ) : profiles.length === 0 ? (
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                  No saved profiles yet.
                </p>
              ) : (
                <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                  {profiles.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className="btn-secondary"
                      onClick={() => { handleSelectProfile(p); setShowBirthModal(false); }}
                      style={{
                        padding: "0.4rem 0.8rem",
                        fontSize: "0.75rem",
                        whiteSpace: "nowrap",
                        borderRadius: "20px",
                        border: selectedProfileId === p.id ? "1px solid var(--color-gold)" : "1px solid var(--border-glass)",
                        background: selectedProfileId === p.id ? "rgba(212,175,55,0.08)" : "transparent",
                        color: selectedProfileId === p.id ? "var(--color-gold-text)" : "var(--text-primary)"
                      }}
                    >
                      {p.name} ({p.gender[0]})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
