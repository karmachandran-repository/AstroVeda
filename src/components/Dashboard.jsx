import React from "react";
import { useOutletContext } from "react-router-dom";
import VedicChart from "./VedicChart";
import ShadbalaRadar from "./ShadbalaRadar";
import DashaTimeline from "./DashaTimeline";

export default function Dashboard() {
  const {
    chartData,
    predictions,
    activeMD,
    setActiveMD,
    selectedVarga,
    setSelectedVarga,
    chartStyle,
    setChartStyle,
    setShowBirthModal
  } = useOutletContext();

  if (!chartData) {
    return (
      <div className="hero-two-column" style={{ animation: "fadeIn 0.5s ease-out" }}>
        
        {/* Left Column (Interactive Area): Stylized celestial star chart with orbital paths */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="celestial-container">
            <div className="celestial-background-circle"></div>
            
            {/* Outer Slow Rotating Ring */}
            <svg className="celestial-svg celestial-rotate-slow" viewBox="0 0 400 400">
              {/* Outer zodiac ring ticks */}
              <circle cx="200" cy="200" r="180" fill="none" stroke="rgba(212, 175, 55, 0.5)" strokeWidth="2" />
              <circle cx="200" cy="200" r="170" fill="none" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1.5" strokeDasharray="3, 3" />
              
              {/* Outer stars constellation lines */}
              <path d="M200 20 L200 380 M20 200 L380 200 M72 72 L328 328 M72 328 L328 72" stroke="rgba(212, 175, 55, 0.35)" strokeWidth="1.5" />
              
              {/* Star dots - dark gold/brown contrast */}
              <circle cx="200" cy="30" r="4" fill="#705634" />
              <circle cx="200" cy="370" r="4" fill="#705634" />
              <circle cx="30" cy="200" r="4" fill="#705634" />
              <circle cx="370" cy="200" r="4" fill="#705634" />
              
              <circle cx="100" cy="100" r="2.5" fill="#8b7355" opacity="0.8" />
              <circle cx="300" cy="300" r="2.5" fill="#8b7355" opacity="0.8" />
              <circle cx="100" cy="300" r="2.5" fill="#8b7355" opacity="0.8" />
              <circle cx="300" cy="100" r="2.5" fill="#8b7355" opacity="0.8" />
            </svg>
            
            {/* Inner Fast Rotating Counter Ring */}
            <svg className="celestial-svg celestial-rotate-fast" viewBox="0 0 400 400">
              <circle cx="200" cy="200" r="130" fill="none" stroke="rgba(212, 175, 55, 0.5)" strokeWidth="2" strokeDasharray="8, 4" />
              <circle cx="200" cy="200" r="110" fill="none" stroke="rgba(215, 230, 250, 0.5)" strokeWidth="2" />
              
              {/* Stylized Aspect lines */}
              <polygon points="200,90 295,255 105,255" fill="none" stroke="rgba(212, 175, 55, 0.45)" strokeWidth="1.5" />
              <polygon points="200,310 295,145 105,145" fill="none" stroke="rgba(215, 230, 250, 0.4)" strokeWidth="1.5" />
            </svg>
            
            {/* Stationary Central Ring */}
            <svg className="celestial-svg" viewBox="0 0 400 400">
              <circle cx="200" cy="200" r="75" fill="none" stroke="rgba(212, 175, 55, 0.55)" strokeWidth="2" />
              <circle cx="200" cy="200" r="70" fill="none" stroke="rgba(212, 175, 55, 0.45)" strokeWidth="1.5" strokeDasharray="2, 2" />
            </svg>
            
            {/* Draw Chart CTA Button in the center */}
            <div className="draw-chart-cta-wrapper">
              <button className="btn-draw-chart-cta stellar-glow" onClick={() => setShowBirthModal(true)}>
                Draw Astro Chart
              </button>
            </div>
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "1rem", letterSpacing: "1px", textTransform: "uppercase" }}>
            ✨ Tap circle to begin dynamic search
          </span>
        </div>

        {/* Right Column (Functional Grid): 2x2 grid of four card panels */}
        <div>
          <h3 className="card-title gold-accent" style={{ fontSize: "1.4rem", marginBottom: "1.5rem", fontFamily: "var(--font-serif)" }}>
            AstroVeda Capabilities Overview
          </h3>
          <div className="functional-grid">
            {/* Card 1: Interactive Charts */}
            <div className="feature-card" onClick={() => setShowBirthModal(true)}>
              <div className="feature-card-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="12,2 15,12 12,22 9,12"/>
                </svg>
              </div>
              <h4 className="feature-card-title">Interactive Charts</h4>
              <p className="feature-card-desc">
                Explore D1 and divisional Rashi charts across North & South Indian layouts.
              </p>
            </div>

            {/* Card 2: Muhurta Calendar */}
            <div className="feature-card" onClick={() => setShowBirthModal(true)}>
              <div className="feature-card-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <h4 className="feature-card-title">Muhurta Calendar</h4>
              <p className="feature-card-desc">
                Identify highly auspicious dates for marriage, ventures, and travel plans.
              </p>
            </div>

            {/* Card 3: Vimshottari Periods */}
            <div className="feature-card" onClick={() => setShowBirthModal(true)}>
              <div className="feature-card-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h4 className="feature-card-title">Vimshottari Periods</h4>
              <p className="feature-card-desc">
                Analyze dynamic 120-year planetary dasha periods mapped against transits.
              </p>
            </div>

            {/* Card 4: Astrological Book Ingester */}
            <div className="feature-card" onClick={() => setShowBirthModal(true)}>
              <div className="feature-card-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z"/>
                </svg>
              </div>
              <h4 className="feature-card-title">Book Ingester</h4>
              <p className="feature-card-desc">
                Ingest PDF treatises to expand local RAG databases and calculations parameters.
              </p>
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="chart-display-container" style={{ animation: "fadeIn 0.3s ease-out" }}>
      
      {/* Chart top control bars */}
      <div className="chart-header-controls">
        <div>
          <h2 className="prediction-title" style={{ margin: 0 }}>
            {chartData.profile.name}'s Horoscope
          </h2>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Julian Day: {chartData.julianDay.toFixed(4)} • Lahiri Ayanamsa: {chartData.ayanamsa.toFixed(4)}°
          </span>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          {/* Select Varga */}
          <select 
            className="form-select" 
            style={{ width: "auto" }}
            value={selectedVarga}
            onChange={e => setSelectedVarga(e.target.value)}
          >
            <option value="1">D1 - Rashi (Natal Chart)</option>
            <option value="2">D2 - Hora (Wealth & Assets)</option>
            <option value="3">D3 - Drekkana (Siblings & Actions)</option>
            <option value="4">D4 - Chaturthamsa (Property & Fortune)</option>
            <option value="7">D7 - Saptamsa (Progeny & Children)</option>
            <option value="9">D9 - Navamsa (Marriage & Dharma)</option>
            <option value="10">D10 - Dasamsa (Career & Profession)</option>
            <option value="12">D12 - Dwadasamsa (Lineage & Parents)</option>
            <option value="16">D16 - Shodasamsa (Vehicles & Desires)</option>
            <option value="20">D20 - Vimsamsa (Spiritual Endeavors)</option>
            <option value="24">D24 - Chaturvimsamsa (Higher Learning)</option>
            <option value="27">D27 - Saptavimsamsa (Intrinsic Strength)</option>
            <option value="30">D30 - Trimsamsa (Miseries & Challenges)</option>
            <option value="40">D40 - Khavedamsa (Auspicious Effects)</option>
            <option value="45">D45 - Akshavedamsa (General Character)</option>
            <option value="60">D60 - Shastiamsa (Past Life & Karma)</option>
          </select>

          {/* Toggle style style */}
          <div className="chart-layout-selector">
            <button 
              className={`layout-btn ${chartStyle === "north" ? "active" : ""}`}
              onClick={() => setChartStyle("north")}
            >
              North Indian
            </button>
            <button 
              className={`layout-btn ${chartStyle === "south" ? "active" : ""}`}
              onClick={() => setChartStyle("south")}
            >
              South Indian
            </button>
          </div>
        </div>
      </div>

      {/* Chart Visualizer */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>
        
        {/* Visual Chart */}
        <div className="chart-svg-wrapper">
          <VedicChart 
            chartPlacements={chartData.divisionalCharts[selectedVarga].placements} 
            layoutStyle={chartStyle}
            title={chartData.divisionalCharts[selectedVarga].name}
          />
        </div>

        {/* Right block: Panchanga Info Box & Active Yogas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Panchanga Box */}
          <div className="glass-card" style={{ padding: "1.25rem", background: "rgba(255, 255, 255, 0.01)" }}>
            <h3 className="card-title gold-accent" style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
              📆 Panchang Elements (Daily Astro Quality)
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.85rem" }}>
              <div><strong>Vara (Day):</strong> {chartData.panchanga.vara}</div>
              <div><strong>Yoga:</strong> {chartData.panchanga.yoga}</div>
              <div style={{ gridColumn: "span 2" }}>
                <strong>Tithi (Lunar Phase):</strong> {chartData.panchanga.tithi}
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <strong>Nakshatra (Moon Mansion):</strong> {chartData.panchanga.nakshatra}
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <strong>Karana (Lunar Half-Day):</strong> {chartData.panchanga.karana}
              </div>
            </div>
          </div>

          {/* Yogas Box */}
          <div className="glass-card" style={{ padding: "1.25rem", background: "rgba(255, 255, 255, 0.01)" }}>
            <h3 className="card-title gold-accent" style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
              🌟 Active Planetary Yogas
            </h3>
            {predictions.activeYogas.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                No primary planetary yogas detected. (Increase your ingested library books to unlock unique configurations).
              </div>
            ) : (
              <div className="yogas-container" style={{ maxHeight: "150px", overflowY: "auto" }}>
                {predictions.activeYogas.map(y => (
                  <div key={y.id} className="yoga-item-card" style={{ padding: "0.6rem 0.85rem", marginBottom: "0.5rem" }}>
                    <div className="yoga-name" style={{ fontWeight: "700", color: "var(--color-gold)", fontSize: "0.85rem" }}>👑 {y.name}</div>
                    <div className="yoga-description" style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{y.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Placements and Dashas Grid split */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "1rem" }}>
        
        {/* 1. Planetary Coordinate Degrees Table */}
        <div>
          <h3 className="card-title gold-accent" style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
            🪐 Planetary Coordinates (Sidereal)
          </h3>
          <div style={{ maxHeight: "350px", overflowY: "auto", border: "1px solid var(--border-glass)", borderRadius: "8px" }}>
            <table className="placements-table">
              <thead>
                <tr>
                  <th>Planet</th>
                  <th>Sign</th>
                  <th>Degrees</th>
                  <th>House</th>
                  <th>Nakshatra</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(chartData.rashiPlacements).map(p => (
                  <tr key={p.name}>
                    <td>
                      <span className="planet-badge">{p.name}</span>
                    </td>
                    <td>{p.signDetails.signName}</td>
                    <td>{p.signDetails.deg.toFixed(2)}°</td>
                    <td>H{p.house}</td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {p.nakshatra.name} ({p.nakshatra.pada})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Vimshottari Dasha Periods */}
        <div>
          <h3 className="card-title gold-accent" style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
            ⏳ Vimshottari Dasha (120-Year Timeline)
          </h3>
          <div className="dasha-timeline-grid" style={{ maxHeight: "350px", overflowY: "auto", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "0.75rem" }}>
            {chartData.dashas.map(md => {
              const isActive = activeMD === md.planet;
              const isMDCurrent = predictions.currentDasha.mahadasha === md.planet;

              return (
                <div key={md.planet} style={{ display: "flex", flexDirection: "column" }}>
                  <div 
                    className={`dasha-md-row ${isActive ? "active" : ""}`}
                    onClick={() => setActiveMD(isActive ? null : md.planet)}
                    style={{ borderLeft: isMDCurrent ? "3px solid var(--color-gold)" : "", cursor: "pointer", display: "flex", justifyContent: "space-between", padding: "0.5rem", borderRadius: "6px", marginBottom: "0.25rem", transition: "var(--transition-smooth)" }}
                  >
                    <div className="dasha-planet" style={{ fontWeight: isMDCurrent ? "700" : "500", fontSize: "0.88rem" }}>
                      {md.planet} Mahadasha {isMDCurrent && <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.3rem", background: "rgba(212,175,55,0.2)", borderRadius: "4px", color: "var(--color-gold)", marginLeft: "0.4rem" }}>Active</span>}
                    </div>
                    <div className="dasha-dates" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {new Date(md.startDate).getFullYear()} - {new Date(md.endDate).getFullYear()}
                    </div>
                  </div>

                  {isActive && (
                    <div className="dasha-ad-sublist" style={{ paddingLeft: "1rem", borderLeft: "1px dashed var(--border-glass)", marginBottom: "0.5rem" }}>
                      {md.antardashas.map(ad => {
                        const isADCurrent = predictions.currentDasha.mahadasha === md.planet && predictions.currentDasha.antardasha === ad.planet;
                        return (
                          <div key={ad.planet} className="dasha-ad-row" style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0.5rem", borderLeft: isADCurrent ? "2px solid var(--color-gold)" : "2px solid transparent", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                            <span style={{ fontWeight: isADCurrent ? "700" : "500", color: isADCurrent ? "var(--color-gold)" : "var(--text-primary)" }}>
                              {ad.planet} sub-period {isADCurrent && "•"}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              Ends {new Date(ad.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3. Shadbala Strength Radar Chart */}
      {chartData.shadbala && (
        <div style={{ marginTop: "2rem" }} className="glass-card gold-border">
          <ShadbalaRadar shadbalaData={chartData.shadbala} />
        </div>
      )}

      {/* 4. Zoomable Vimshottari Dasha & Transit Overlay */}
      <div style={{ marginTop: "2rem" }} className="glass-card gold-border">
        <DashaTimeline chartData={chartData} />
      </div>

    </div>
  );
}
