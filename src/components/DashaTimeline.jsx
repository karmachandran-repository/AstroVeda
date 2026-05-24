import React, { useState, useEffect, useMemo } from "react";

// Planet color scheme matching planetary energies
const PLANET_COLORS = {
  Ketu: { bg: "rgba(140, 140, 140, 0.15)", border: "rgba(140, 140, 140, 0.4)", text: "#a0a0a0" },
  Venus: { bg: "rgba(255, 105, 180, 0.12)", border: "rgba(255, 105, 180, 0.4)", text: "#ff8da1" },
  Sun: { bg: "rgba(212, 175, 55, 0.15)", border: "rgba(212, 175, 55, 0.5)", text: "#d4af37" },
  Moon: { bg: "rgba(240, 248, 255, 0.15)", border: "rgba(240, 248, 255, 0.4)", text: "#e0f0ff" },
  Mars: { bg: "rgba(255, 69, 0, 0.12)", border: "rgba(255, 69, 0, 0.4)", text: "#ff6347" },
  Rahu: { bg: "rgba(162, 140, 255, 0.15)", border: "rgba(162, 140, 255, 0.4)", text: "#b39eff" },
  Jupiter: { bg: "rgba(255, 215, 0, 0.12)", border: "rgba(255, 215, 0, 0.45)", text: "#ffd700" },
  Saturn: { bg: "rgba(70, 130, 180, 0.15)", border: "rgba(70, 130, 180, 0.4)", text: "#63b3ed" },
  Mercury: { bg: "rgba(50, 205, 50, 0.12)", border: "rgba(50, 205, 50, 0.45)", text: "#48bb78" }
};

export default function DashaTimeline({ chartData }) {
  const [zoomLevel, setZoomLevel] = useState(10); // 1, 5, or 10 years
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  
  const [transitDate, setTransitDate] = useState(new Date().toISOString().split("T")[0]);
  const [transitOverlay, setTransitOverlay] = useState(null);
  const [loadingTransit, setLoadingTransit] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);

  const moonLong = chartData?.rashiPlacements?.Moon?.longitude;
  const lagnaLong = chartData?.rashiPlacements?.Lagna?.longitude;
  const birthDate = chartData?.profile?.date;

  // 1. Fetch Vimshottari Timeline based on zoom level
  useEffect(() => {
    if (moonLong === undefined || !birthDate) return;
    
    setLoadingTimeline(true);
    fetch("http://127.0.0.1:5000/api/dasha/timeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moonLongitude: moonLong,
        birthDate: birthDate,
        startDate: new Date().toISOString(),
        yearsSpan: zoomLevel
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTimeline(data.timeline);
          // Auto-select first segment
          if (data.timeline && data.timeline.length > 0) {
            setSelectedSegment(data.timeline[0]);
          }
        }
      })
      .catch(err => console.error("Error fetching dasha timeline:", err))
      .finally(() => setLoadingTimeline(false));
  }, [moonLong, birthDate, zoomLevel]);

  // 2. Fetch Transit Overlay based on Selected Transit Date
  useEffect(() => {
    if (lagnaLong === undefined || !transitDate) return;
    
    setLoadingTransit(true);
    fetch("http://127.0.0.1:5000/api/transit/overlay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lagnaLongitude: lagnaLong,
        transitDate: transitDate,
        transitTime: "12:00",
        timezoneOffset: 0.0
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTransitOverlay(data.overlay);
        }
      })
      .catch(err => console.error("Error fetching transit overlay:", err))
      .finally(() => setLoadingTransit(false));
  }, [lagnaLong, transitDate]);

  // Calculate percentage width for each timeline block
  const timelineWithWidths = useMemo(() => {
    if (!timeline || timeline.length === 0) return [];
    
    const startTimestamps = timeline.map(t => new Date(t.startDate).getTime());
    const endTimestamps = timeline.map(t => new Date(t.endDate).getTime());
    
    const minTime = Math.min(...startTimestamps);
    const maxTime = Math.max(...endTimestamps);
    const totalDuration = maxTime - minTime;
    
    return timeline.map(t => {
      const start = new Date(t.startDate).getTime();
      const end = new Date(t.endDate).getTime();
      const duration = end - start;
      const pct = totalDuration > 0 ? (duration / totalDuration) * 100 : 100;
      return {
        ...t,
        widthPct: pct
      };
    });
  }, [timeline]);

  const handleSegmentClick = (seg) => {
    setSelectedSegment(seg);
    // Set transit date to the start of this segment to evaluate transits then!
    const segStart = seg.startDate.split("T")[0];
    setTransitDate(segStart);
  };

  const activeDashaLabel = useMemo(() => {
    if (!selectedSegment) return "";
    return selectedSegment.pratyantardasha
      ? `👑 Active: ${selectedSegment.mahadasha} MD ➔ ${selectedSegment.antardasha} AD ➔ ${selectedSegment.pratyantardasha} PD`
      : `👑 Active: ${selectedSegment.mahadasha} MD ➔ ${selectedSegment.antardasha} AD`;
  }, [selectedSegment]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Header & Controls */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
        borderBottom: "1px solid var(--border-glass)",
        paddingBottom: "1rem"
      }}>
        <div>
          <h3 className="card-title gold-accent" style={{ margin: 0, fontSize: "1.25rem" }}>
            ⏳ Interactive Vimshottari Timeline & Transit Overlay
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Zoom Dasha levels and overlay real-time planetary transits onto birth chart houses
          </span>
        </div>

        {/* Zoom Selector Buttons */}
        <div style={{
          display: "flex",
          background: "rgba(0, 0, 0, 0.2)",
          padding: "0.25rem",
          borderRadius: "8px",
          border: "1px solid var(--border-glass)"
        }}>
          {[
            { label: "1 Year (PD Zoom)", value: 1 },
            { label: "5 Years (AD View)", value: 5 },
            { label: "10 Years (Full View)", value: 10 }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setZoomLevel(opt.value)}
              style={{
                background: zoomLevel === opt.value ? "rgba(212,175,55,0.15)" : "transparent",
                color: zoomLevel === opt.value ? "var(--color-gold)" : "var(--text-secondary)",
                border: "none",
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.8rem",
                transition: "var(--transition-smooth)"
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Timeline Bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <span>📅 Timeline Start: {timeline.length > 0 ? new Date(timeline[0].startDate).toLocaleDateString() : ""}</span>
          <span style={{ color: "var(--color-gold)", fontWeight: "600" }}>{activeDashaLabel}</span>
          <span>Timeline End: {timeline.length > 0 ? new Date(timeline[timeline.length - 1].endDate).toLocaleDateString() : ""}</span>
        </div>

        {loadingTimeline ? (
          <div style={{
            height: "50px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "8px",
            border: "1px solid var(--border-glass)"
          }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Loading chronological segments...</span>
          </div>
        ) : (
          <div style={{
            display: "flex",
            width: "100%",
            height: "48px",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid var(--border-glass)",
            position: "relative"
          }}>
            {timelineWithWidths.map((seg, idx) => {
              const activePlanet = seg.pratyantardasha || seg.antardasha;
              const colors = PLANET_COLORS[activePlanet] || { bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.2)", text: "#fff" };
              const isSelected = selectedSegment?.startDate === seg.startDate;
              
              return (
                <div
                  key={idx}
                  onClick={() => handleSegmentClick(seg)}
                  style={{
                    width: `${seg.widthPct}%`,
                    height: "100%",
                    background: colors.bg,
                    borderRight: idx === timeline.length - 1 ? "none" : `1px solid ${colors.border}`,
                    borderBottom: isSelected ? "3px solid var(--color-gold)" : "none",
                    boxShadow: isSelected ? "inset 0 0 10px rgba(212,175,55,0.2)" : "none",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "0.25rem",
                    transition: "var(--transition-smooth)",
                    overflow: "hidden"
                  }}
                  title={`${seg.label} (${new Date(seg.startDate).toLocaleDateString()} - ${new Date(seg.endDate).toLocaleDateString()})`}
                >
                  <strong style={{
                    color: colors.text,
                    fontSize: zoomLevel === 1 ? "0.75rem" : "0.85rem",
                    textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                    whiteSpace: "nowrap"
                  }}>
                    {zoomLevel === 1 ? seg.pratyantardasha : seg.antardasha}
                  </strong>
                  {seg.widthPct > 8 && (
                    <span style={{
                      fontSize: "0.65rem",
                      color: "rgba(255,255,255,0.4)",
                      whiteSpace: "nowrap"
                    }}>
                      {new Date(seg.startDate).toLocaleDateString(undefined, { month: "short", year: "2-digit" })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: Transit Date Selector & Overlay Comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: "2rem" }}>
        
        {/* Left Side: Selected Period details & Transit Date Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* Selected Period Info */}
          {selectedSegment && (
            <div className="glass-card" style={{
              background: "rgba(255, 255, 255, 0.01)",
              border: "1px solid var(--border-glass)",
              borderRadius: "8px",
              padding: "1rem"
            }}>
              <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", color: "var(--color-gold)" }}>
                📅 Selected Period Details
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.85rem" }}>
                <div><strong>Mahadasha (Major):</strong> {selectedSegment.mahadasha} (Duration ruler)</div>
                <div><strong>Antardasha (Sub):</strong> {selectedSegment.antardasha}</div>
                {selectedSegment.pratyantardasha && (
                  <div><strong>Pratyantardasha (Sub-Sub):</strong> {selectedSegment.pratyantardasha}</div>
                )}
                <div><strong>Start Date:</strong> {new Date(selectedSegment.startDate).toLocaleString()}</div>
                <div><strong>End Date:</strong> {new Date(selectedSegment.endDate).toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* Transit Date Form Input */}
          <div className="glass-card" style={{
            background: "rgba(255, 255, 255, 0.01)",
            border: "1px solid var(--border-glass)",
            borderRadius: "8px",
            padding: "1rem"
          }}>
            <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", color: "var(--color-gold)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              🗺️ Select Transit Date to Overlay
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: "0.78rem" }}>Transit Horizon Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={transitDate}
                  onChange={e => setTransitDate(e.target.value)}
                  style={{ borderColor: "rgba(212,175,55,0.3)" }}
                />
              </div>

              {/* Convenience Shortcuts */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => setTransitDate(new Date().toISOString().split("T")[0])}
                  className="btn-secondary"
                  style={{ flex: 1, padding: "0.35rem 0.5rem", fontSize: "0.75rem", borderColor: "rgba(212,175,55,0.2)" }}
                >
                  📍 Use Today
                </button>
                <button
                  onClick={() => setTransitDate(birthDate)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: "0.35rem 0.5rem", fontSize: "0.75rem", borderColor: "rgba(212,175,55,0.2)" }}
                >
                  👶 Use Birth Date
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Comparative Transit Placements Table */}
        <div className="glass-card" style={{
          border: "1px solid var(--border-glass)",
          borderRadius: "12px",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ margin: 0, fontSize: "1.05rem", color: "var(--color-gold)" }}>
              🪐 Transit Overlay: Birth Placements vs. Transits
            </h4>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Transit Date: <strong>{new Date(transitDate).toLocaleDateString()}</strong>
            </span>
          </div>

          {loadingTransit ? (
            <div style={{
              flex: 1,
              minHeight: "220px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Calculating planetary transits across cosmic coordinates...</span>
            </div>
          ) : !transitOverlay ? (
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "2rem" }}>
              Select a transit date to calculate overlay.
            </div>
          ) : (
            <div style={{
              maxHeight: "280px",
              overflowY: "auto",
              border: "1px solid var(--border-glass)",
              borderRadius: "8px"
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)" }}>
                    <th style={{ padding: "0.5rem 0.75rem" }}>Planet</th>
                    <th style={{ padding: "0.5rem 0.75rem" }}>Birth Placement</th>
                    <th style={{ padding: "0.5rem 0.75rem" }}>Transit Placement</th>
                    <th style={{ padding: "0.5rem 0.75rem" }}>Transit House</th>
                    <th style={{ padding: "0.5rem 0.75rem" }}>Cosmic Activation</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(transitOverlay).map(p_name => {
                    const t_data = transitOverlay[p_name];
                    const b_data = chartData.rashiPlacements[p_name];
                    
                    const isDashaActive = selectedSegment && 
                      (selectedSegment.mahadasha === p_name || 
                       selectedSegment.antardasha === p_name || 
                       selectedSegment.pratyantardasha === p_name);

                    return (
                      <tr
                        key={p_name}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          background: isDashaActive ? "rgba(212,175,55,0.02)" : "transparent",
                          color: isDashaActive ? "var(--color-gold)" : "var(--text-primary)"
                        }}
                      >
                        <td style={{ padding: "0.5rem 0.75rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span>🪐</span> {p_name}
                          {isDashaActive && <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.25rem", background: "rgba(212,175,55,0.15)", borderRadius: "4px" }}>Dasha</span>}
                        </td>
                        <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-secondary)" }}>
                          H{b_data?.house} ({b_data?.signDetails?.signName.substring(0, 3)} {Math.floor(b_data?.signDetails?.deg)}°)
                        </td>
                        <td style={{ padding: "0.5rem 0.75rem" }}>
                          {t_data.signDetails.signName.substring(0, 3)} {Math.floor(t_data.signDetails.deg)}°
                        </td>
                        <td style={{ padding: "0.5rem 0.75rem", fontWeight: "700" }}>
                          House {t_data.house}
                        </td>
                        <td 
                          style={{ padding: "0.5rem 0.75rem", fontSize: "0.78rem", color: "var(--text-muted)", maxWidth: "220px", whiteSpace: "normal" }}
                          title={t_data.interpretation}
                        >
                          {t_data.interpretation}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
