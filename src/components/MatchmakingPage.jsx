import React from "react";
import { useOutletContext } from "react-router-dom";

export default function MatchmakingPage() {
  const {
    chartData,
    formData, // Primary form state for date/time references
    partnerFormData,
    setPartnerFormData,
    partnerPlaceInput,
    setPartnerPlaceInput,
    partnerSuggestions,
    partnerSuggestionsVisible,
    handleSelectPartnerSuggestion,
    partnerManualOverride,
    setPartnerManualOverride,
    partnerGeocodingLoading,
    matchmakingResult,
    matchmakingLoading,
    handleMatchmakingSubmit
  } = useOutletContext();

  // Self-contained Markdown rendering logic
  const renderInlineFormatting = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx} style={{ color: "var(--color-gold)", fontWeight: "600" }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        return (
          <h3 key={idx} className="card-title gold-accent" style={{ marginTop: "1.75rem", fontSize: "1.25rem", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem" }}>
            {trimmed.replace("###", "").trim()}
          </h3>
        );
      } else if (trimmed.startsWith(">")) {
        return (
          <blockquote key={idx} className="scroll-quote" style={{ margin: "1rem 0", padding: "0.75rem 1rem", borderLeft: "4px solid var(--color-gold)", background: "rgba(255, 255, 255, 0.02)", fontStyle: "italic", borderRadius: "0 8px 8px 0" }}>
            {trimmed.replace(">", "").replace(/"/g, "").trim()}
          </blockquote>
        );
      } else if (trimmed.startsWith("-")) {
        const content = trimmed.substring(1).trim();
        return (
          <li key={idx} style={{ marginLeft: "1.5rem", color: "var(--text-secondary)", marginBottom: "0.5rem", listStyleType: "square" }}>
            {renderInlineFormatting(content)}
          </li>
        );
      } else if (trimmed === "") {
        return <div key={idx} style={{ height: "0.5rem" }} />;
      } else {
        return (
          <p key={idx} style={{ color: "var(--text-secondary)", lineHeight: "1.75", marginBottom: "1rem", fontSize: "0.95rem" }}>
            {renderInlineFormatting(trimmed)}
          </p>
        );
      }
    });
  };

  if (!chartData) {
    return (
      <div className="blank-slate stellar-glow" style={{ animation: "fadeIn 0.3s ease-out", textAlign: "center", padding: "3rem" }}>
        <h2 className="blank-slate-title">💝 Vedic Matchmaking (Kundali Milan)</h2>
        <p className="blank-slate-desc" style={{ maxWidth: "500px", margin: "1rem auto" }}>
          Kundali Milan evaluates the energetic compatibility between two souls using the 36-point Ashtakoota system. Enter your birth details in the sidebar first to set up your primary profile.
        </p>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <h2 className="prediction-title" style={{ marginBottom: "1rem" }}>
        Vedic Matchmaking (Kundali Milan)
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
        Evaluate compatibility between two souls using the classical Ashtakoota Milan (36-point system) and Manglik Dosha alignments.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Form & Primary Profile Reference Card */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          
          {/* Primary Native Details Box (Read only reference) */}
          <div className="glass-card" style={{ padding: "1.25rem 1.5rem", background: "rgba(212, 175, 55, 0.02)" }}>
            <h3 className="card-title gold-accent" style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
              👤 Primary Native (You)
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
              <div><strong>Name:</strong> {chartData.profile.name}</div>
              <div><strong>Gender:</strong> {chartData.profile.gender}</div>
              <div><strong>Birth Details:</strong> {formData.date} • {formData.time}</div>
              <div><strong>Moon Sign:</strong> {chartData.rashiPlacements.Moon.signDetails.signName} ({chartData.rashiPlacements.Moon.signDetails.deg.toFixed(2)}°)</div>
              <div><strong>Nakshatra:</strong> {chartData.panchanga.nakshatra}</div>
            </div>
          </div>

          {/* Partner Details Entry Form */}
          <div className="glass-card gold-border" style={{ padding: "1.5rem" }}>
            <h3 className="card-title gold-accent" style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
              💝 Partner's Birth Details
            </h3>
            
            <form onSubmit={handleMatchmakingSubmit}>
              <div className="form-group">
                <label className="form-label">Partner's Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={partnerFormData.name}
                  onChange={e => setPartnerFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter partner's full name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select 
                    className="form-select"
                    value={partnerFormData.gender}
                    onChange={e => setPartnerFormData(prev => ({ ...prev, gender: e.target.value }))}
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
                    value={partnerFormData.date}
                    onChange={e => setPartnerFormData(prev => ({ ...prev, date: e.target.value }))}
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
                    value={partnerFormData.time}
                    onChange={e => setPartnerFormData(prev => ({ ...prev, time: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group" style={{ position: "relative" }}>
                  <label className="form-label">Place of Birth</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={partnerPlaceInput}
                      onChange={e => {
                        setPartnerPlaceInput(e.target.value);
                        setPartnerManualOverride(false);
                      }}
                      placeholder="Search city..."
                      disabled={partnerManualOverride}
                      required={!partnerManualOverride}
                      style={{ paddingRight: partnerGeocodingLoading ? "2.5rem" : "1rem" }}
                    />
                    {partnerGeocodingLoading && (
                      <span style={{ position: "absolute", right: "1rem", color: "var(--color-gold)", animation: "starRotate 1.5s infinite linear", fontSize: "1.1rem" }}>
                        🌀
                      </span>
                    )}
                  </div>

                  {/* Suggestions List for Partner */}
                  {partnerSuggestionsVisible && partnerSuggestions.length > 0 && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "rgba(12, 14, 32, 0.98)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "8px",
                      marginTop: "4px",
                      zIndex: 100,
                      maxHeight: "180px",
                      overflowY: "auto",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
                      backdropFilter: "blur(12px)"
                    }}>
                      {partnerSuggestions.map((sug, idx) => (
                        <div 
                          key={idx}
                          style={{
                            padding: "0.6rem 0.8rem",
                            borderBottom: idx === partnerSuggestions.length - 1 ? "none" : "1px solid rgba(255,255,255,0.05)",
                            cursor: "pointer",
                            transition: "var(--transition-smooth)",
                            fontSize: "0.8rem",
                            color: "var(--text-primary)"
                          }}
                          onClick={() => handleSelectPartnerSuggestion(sug)}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212, 175, 55, 0.08)"; e.currentTarget.style.color = "var(--color-gold)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-primary)"; }}
                        >
                          📍 {sug.name}
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "0.4rem" }}>
                            ({sug.timezoneName})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Partner Manual Override Trigger */}
              <div style={{ marginBottom: "1rem", textAlign: "right" }}>
                <button 
                  type="button" 
                  style={{ 
                    background: "transparent", 
                    border: "none", 
                    color: "var(--color-gold)", 
                    fontSize: "0.8rem", 
                    textDecoration: "underline", 
                    cursor: "pointer" 
                  }}
                  onClick={() => {
                    setPartnerManualOverride(!partnerManualOverride);
                    if (!partnerManualOverride) {
                      setPartnerPlaceInput("");
                    }
                  }}
                >
                  {partnerManualOverride ? "✓ Switch to Autocomplete" : "🗺️ Manual Coordinates"}
                </button>
              </div>

              {/* Partner Manual Coordinates Fields */}
              {partnerManualOverride && (
                <div className="form-row" style={{ animation: "fadeIn 0.3s ease-out" }}>
                  <div className="form-group">
                    <label className="form-label">Latitude (°N)</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      className="form-input" 
                      value={partnerFormData.latitude}
                      onChange={e => setPartnerFormData(prev => ({ ...prev, latitude: e.target.value }))}
                      placeholder="e.g. 40.71"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude (°E)</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      className="form-input" 
                      value={partnerFormData.longitude}
                      onChange={e => setPartnerFormData(prev => ({ ...prev, longitude: e.target.value }))}
                      placeholder="e.g. -74.00"
                      required
                    />
                  </div>
                </div>
              )}

              {partnerManualOverride && (
                <div className="form-group" style={{ animation: "fadeIn 0.3s ease-out" }}>
                  <label className="form-label">Timezone Offset (Hours from GMT)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    className="form-input" 
                    value={partnerFormData.timezoneOffset}
                    onChange={e => setPartnerFormData(prev => ({ ...prev, timezoneOffset: e.target.value }))}
                    placeholder="e.g. -4.0"
                    required
                  />
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={matchmakingLoading} style={{ marginTop: "1rem" }}>
                {matchmakingLoading ? "Aligning Twin Horoscopes..." : "⚡ Calculate Kundali Compatibility"}
              </button>
            </form>
          </div>

        </div>

        {/* Calculations Loader */}
        {matchmakingLoading && (
          <div className="glass-card stellar-glow" style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <div className="star-spinner" style={{ fontSize: "2.5rem", animation: "starRotate 2s infinite linear" }}>✨</div>
            <h3 className="blank-slate-title" style={{ marginTop: "1.5rem" }}>Synthesizing Astro-Resonance</h3>
            <p className="blank-slate-desc" style={{ marginTop: "0.5rem" }}>
              Drawing partner Divisional Charts, matching Nakshatra biological Nadis, computing 8 Ashtakoota vectors, evaluating Martian Manglik alignments, and weaving AI guidance...
            </p>
          </div>
        )}

        {/* Step 3: Matchmaking Results Output */}
        {!matchmakingLoading && matchmakingResult && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", animation: "fadeIn 0.4s ease-out" }}>
            
            {/* Overall Compatibility Summary Card */}
            <div className="glass-card gold-border" style={{ 
              display: "grid", 
              gridTemplateColumns: "1.2fr 2fr", 
              gap: "2.5rem", 
              alignItems: "center",
              background: "linear-gradient(135deg, rgba(212, 175, 55, 0.03) 0%, rgba(10, 12, 28, 0.4) 100%)"
            }}>
              {/* Golden Score Gauge */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "1.5rem", borderRight: "1px solid var(--border-glass)" }}>
                <div style={{ position: "relative", width: "160px", height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ 
                    position: "absolute", 
                    inset: 0, 
                    borderRadius: "50%", 
                    border: "4px solid rgba(255,255,255,0.03)", 
                    boxShadow: "0 0 15px rgba(0,0,0,0.4)" 
                  }} />
                  <div style={{ 
                    position: "absolute", 
                    inset: 0, 
                    borderRadius: "50%", 
                    border: "4px solid var(--color-gold)", 
                    borderTopColor: "transparent",
                    borderLeftColor: "transparent",
                    transform: `rotate(${Math.min(360, (matchmakingResult.score / 36) * 360 - 90)}deg)`,
                    boxShadow: "0 0 20px var(--color-gold-glow)"
                  }} />
                  <div style={{ display: "flex", flexDirection: "column", fontFamily: "var(--font-sans)", alignItems: "center" }}>
                    <span style={{ fontSize: "2.5rem", fontWeight: "800", color: "var(--color-gold)", textShadow: "0 0 10px var(--color-gold-glow)" }}>
                      {matchmakingResult.score}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                      Out of 36
                    </span>
                  </div>
                </div>
                
                <h3 style={{ 
                  fontFamily: "var(--font-serif)", 
                  fontSize: "1.35rem", 
                  marginTop: "1.25rem", 
                  color: matchmakingResult.score >= 28 ? "var(--color-teal)" : (matchmakingResult.score >= 18 ? "var(--color-gold)" : "var(--color-rose)") 
                }}>
                  {matchmakingResult.score >= 28 ? "💎 Highly Auspicious" : (matchmakingResult.score >= 18 ? "🟢 Auspicious Match" : "⚠️ Frictional Node")}
                </h3>
              </div>

              {/* Summary details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", margin: 0, color: "var(--text-primary)" }}>
                    {chartData.profile.name} & {partnerFormData.name}
                  </h2>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Celestial alignment computed on {new Date().toLocaleDateString()}
                  </span>
                </div>

                {/* Placements info boxes */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
                  <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Primary Placements</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: "600" }}>🌙 {matchmakingResult.primaryPlacements.nakshatra} ({matchmakingResult.primaryPlacements.pada})</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-gold)" }}>{matchmakingResult.primaryPlacements.moonSign} • Lord {matchmakingResult.primaryPlacements.lord}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Partner Placements</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: "600" }}>🌙 {matchmakingResult.partnerPlacements.nakshatra} ({matchmakingResult.partnerPlacements.pada})</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-indigo)" }}>{matchmakingResult.partnerPlacements.moonSign} • Lord {matchmakingResult.partnerPlacements.lord}</div>
                  </div>
                </div>

                {/* Warnings and cancelations inline bullet */}
                {matchmakingResult.cancelations.length > 0 && (
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", fontSize: "0.82rem", color: "var(--color-teal)" }}>
                    <span>✓</span>
                    <span><strong>Grace cancelations:</strong> {matchmakingResult.cancelations.join(" • ")}</span>
                  </div>
                )}
                {matchmakingResult.warnings.length > 0 && (
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", fontSize: "0.82rem", color: "var(--color-rose)" }}>
                    <span>⚠️</span>
                    <span><strong>Friction notes:</strong> {matchmakingResult.warnings.join(" • ")}</span>
                  </div>
                )}
              </div>

            </div>

            {/* 8-Grid Ashtakoota Category Cards */}
            <div>
              <h3 className="card-title gold-accent" style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
                📊 Ashtakoota Milan (8-Category Breakdown)
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                Each category evaluates a vital dimension of domestic harmony, biological compatibility, mental health, and destiny alignment.
              </p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                {Object.entries(matchmakingResult.scoreBreakdown).map(([key, item]) => {
                  const isZero = item.score === 0;
                  const isMax = item.score === item.max;
                  
                  return (
                    <div key={key} className="glass-card" style={{ 
                      padding: "1.25rem", 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: "0.5rem",
                      background: isZero ? "rgba(220,53,69,0.02)" : "rgba(255, 255, 255, 0.01)",
                      border: `1px solid ${isZero ? "rgba(220,53,69,0.15)" : "var(--border-glass)"}`
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "600" }}>{item.title.split(" (")[0]}</span>
                        <span style={{ 
                          fontSize: "0.85rem", 
                          fontWeight: "700", 
                          color: isMax ? "var(--color-teal)" : (isZero ? "var(--color-rose)" : "var(--color-gold)")
                        }}>
                          {item.score} / {item.max} Pts
                        </span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "-0.2rem", fontStyle: "italic" }}>
                        {item.title.includes("(") ? item.title.match(/\(([^)]+)\)/)[1] : ""}
                      </div>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.78rem", background: "rgba(0,0,0,0.15)", padding: "0.4rem 0.6rem", borderRadius: "6px", marginTop: "0.25rem" }}>
                        <div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>Primary</div>
                          <div style={{ fontWeight: "600", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{item.primary.split(" (")[0]}</div>
                        </div>
                        <div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>Partner</div>
                          <div style={{ fontWeight: "600", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{item.partner.split(" (")[0]}</div>
                        </div>
                      </div>

                      <div style={{ 
                        fontSize: "0.8rem", 
                        fontWeight: "600", 
                        textAlign: "center",
                        marginTop: "0.4rem",
                        padding: "0.2rem",
                        borderRadius: "4px",
                        background: isZero ? "rgba(220,53,69,0.08)" : "rgba(255,255,255,0.02)",
                        color: isZero ? "var(--color-rose)" : (isMax ? "var(--color-teal)" : "var(--text-primary)")
                      }}>
                        {item.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Martian Alignment & Manglik Status Block */}
            <div className="glass-card gold-border" style={{ padding: "1.5rem" }}>
              <h3 className="card-title gold-accent" style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                🔥 Martian Harmony (Manglik Dosha Report)
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "1rem" }}>
                Evaluating placements of Mars in both natal charts to determine energy balances, passionate drives, and domestic stability.
              </p>
              
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "1rem", 
                background: "rgba(0,0,0,0.1)", 
                padding: "1rem", 
                borderRadius: "8px", 
                border: "1px solid var(--border-glass)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--color-gold)" }}>{matchmakingResult.manglikCompatibility.status}</span>
                  <span style={{ 
                    fontSize: "0.75rem", 
                    padding: "0.2rem 0.5rem", 
                    borderRadius: "4px", 
                    background: matchmakingResult.manglikCompatibility.status.includes("Auspicious") ? "rgba(0,230,175,0.1)" : "rgba(220,53,69,0.1)",
                    color: matchmakingResult.manglikCompatibility.status.includes("Auspicious") ? "var(--color-teal)" : "var(--color-rose)"
                  }}>
                    Mars Alignment
                  </span>
                </div>
                
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  {matchmakingResult.manglikCompatibility.analysis}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.8rem", marginTop: "0.5rem" }}>
                  <div>
                    <strong>{chartData.profile.name}:</strong> {matchmakingResult.primaryPlacements.isManglik ? "🔴 Manglik" : "🛡️ Non-Manglik"}
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>({matchmakingResult.primaryPlacements.manglikReason})</div>
                  </div>
                  <div>
                    <strong>{partnerFormData.name}:</strong> {matchmakingResult.partnerPlacements.isManglik ? "🔴 Manglik" : "🛡️ Non-Manglik"}
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>({matchmakingResult.partnerPlacements.manglikReason})</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Holistic Guidance Narrative */}
            <div className="glass-card gold-border" style={{ padding: "2rem" }}>
              <h3 className="card-title gold-accent" style={{ fontSize: "1.3rem", marginBottom: "0.75rem" }}>
                ✨ Holistic Guidance & Remedies (Twin-Horoscope Synthesis)
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                Comprehensive astrological analysis detailing mental, physical, biological resonance, and personalized remedies.
              </p>
              
              <div className="prediction-body" style={{ whiteSpace: "normal" }}>
                {renderMarkdown(matchmakingResult.aiSynthesis)}
              </div>
            </div>

          </div>
        )}

        {/* Empty Slate if no search made yet */}
        {!matchmakingLoading && !matchmakingResult && (
          <div className="blank-slate" style={{ padding: "4rem" }}>
            <div style={{ fontSize: "2rem" }}>💝</div>
            <h3 className="blank-slate-title" style={{ marginTop: "1rem" }}>Await Compatibility Check</h3>
            <p className="blank-slate-desc">Enter the partner's birth details above and click **"Calculate Kundali Compatibility"** to reveal mutual Ashtakoota grades, Mars matches, and holistic AI guidance.</p>
          </div>
        )}

      </div>
    </div>
  );
}
