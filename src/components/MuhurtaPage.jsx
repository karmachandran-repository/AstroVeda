import React from "react";
import { useOutletContext } from "react-router-dom";

export default function MuhurtaPage() {
  const {
    chartData,
    muhurtaEvent,
    setMuhurtaEvent,
    muhurtaStartDate,
    setMuhurtaStartDate,
    muhurtaLoading,
    muhurtaResults,
    handleScanMuhurta
  } = useOutletContext();

  if (!chartData) {
    return (
      <div className="blank-slate stellar-glow" style={{ animation: "fadeIn 0.3s ease-out", textAlign: "center", padding: "3rem" }}>
        <h2 className="blank-slate-title">📅 Auspicious Muhurta Calculator</h2>
        <p className="blank-slate-desc" style={{ maxWidth: "500px", margin: "1rem auto" }}>
          The Muhurta Planner evaluates coordinate-specific Panchanga configurations to scan the next 90 days for auspicious times. First, enter your birth details in the sidebar to calculate your charts.
        </p>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <h2 className="prediction-title" style={{ marginBottom: "1rem" }}>
        Auspicious Muhurta Calculator
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
        Calculate highly supportive time slots based on the Panchanga (Tithi, Vara, Nakshatra, Yoga, Karana) matching your coordinates.
      </p>

      <form onSubmit={handleScanMuhurta} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1rem", alignItems: "end", background: "rgba(255,255,255,0.02)", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--border-glass)", marginBottom: "2rem" }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Select Event</label>
          <select 
            className="form-select"
            value={muhurtaEvent}
            onChange={e => setMuhurtaEvent(e.target.value)}
          >
            <option value="marriage">Vivah (Marriage Ceremony)</option>
            <option value="naming">Namkaran (Baby Naming Ceremony)</option>
            <option value="venture">Start Venture (Business/Startup)</option>
            <option value="groundbreaking">Bhumi Pujan (Groundbreaking Ceremony)</option>
            <option value="travel">Yatra (Auspicious Travel)</option>
            <option value="job">Varan (Joining a New Job/Role)</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Search Start Date</label>
          <input 
            type="date" 
            className="form-input" 
            value={muhurtaStartDate}
            onChange={e => setMuhurtaStartDate(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-primary" style={{ height: "42px", padding: "0 1.5rem" }} disabled={muhurtaLoading}>
          {muhurtaLoading ? "Scanning..." : "🔍 Find Auspicious Slots"}
        </button>
      </form>

      {/* Muhurta Scan Results */}
      {muhurtaLoading && (
        <div className="blank-slate stellar-glow" style={{ padding: "4rem" }}>
          <div style={{ fontSize: "2rem" }}>🌀</div>
          <h3 className="blank-slate-title" style={{ marginTop: "1rem" }}>Analyzing Ecliptic Coordinates</h3>
          <p className="blank-slate-desc">Scanning five elements of Panchanga for the next 90 days...</p>
        </div>
      )}

      {!muhurtaLoading && muhurtaResults.length > 0 && (
        <div className="muhurta-results-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {muhurtaResults.map(m => {
            const suitabilityClass = m.score >= 80 ? "excellent" : (m.score >= 65 ? "good" : "average");
            
            return (
              <div key={m.dateString} className={`muhurta-day-card ${suitabilityClass}`} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div className="muhurta-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="muhurta-date" style={{ fontWeight: "700" }}>{m.dateString}</div>
                  <div className={`muhurta-score ${m.score >= 80 ? "" : (m.score >= 65 ? "teal-text" : "")}`} style={{ fontWeight: "800", fontSize: "1.1rem" }}>
                    {m.score}/100
                  </div>
                </div>

                <div className={`muhurta-suitability ${suitabilityClass}`} style={{ fontSize: "0.85rem", fontWeight: "600", padding: "0.2rem 0.5rem", borderRadius: "4px", width: "fit-content", textTransform: "uppercase" }}>
                  {m.suitability}
                </div>

                <div className="muhurta-panchanga-summary" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem", fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.5rem 0", padding: "0.5rem", background: "rgba(0,0,0,0.15)", borderRadius: "6px" }}>
                  <span>Vara: {m.panchanga.vara}</span>
                  <span>Nakshatra: {m.panchanga.nakshatraName}</span>
                  <span>Tithi: {m.panchanga.tithiName}</span>
                  <span>Yoga: {m.panchanga.yoga}</span>
                  <span style={{ gridColumn: "span 2" }}>Karana: {m.panchanga.karana}</span>
                </div>

                <ul className="muhurta-bullet-info" style={{ paddingLeft: "1.2rem", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  {m.reasons.map((r, idx) => (
                    <li key={`r-${idx}`} style={{ marginBottom: "0.25rem" }}>{r}</li>
                  ))}
                  {m.warnings.map((w, idx) => (
                    <li key={`w-${idx}`} style={{ color: "var(--text-muted)", marginBottom: "0.25rem" }}>⚠️ {w}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {!muhurtaLoading && muhurtaResults.length === 0 && (
        <div className="blank-slate" style={{ padding: "4rem" }}>
          <div style={{ fontSize: "2rem" }}>📅</div>
          <h3 className="blank-slate-title" style={{ marginTop: "1rem" }}>No Muhurtas Scanned Yet</h3>
          <p className="blank-slate-desc">Select an event and click "Find Auspicious Slots" to view the Muhurta Calendar.</p>
        </div>
      )}
    </div>
  );
}
