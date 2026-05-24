import React, { useState, useMemo } from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";

export default function ShadbalaRadar({ shadbalaData }) {
  const [radarMode, setRadarMode] = useState("planets"); // "planets" or "categories"
  const [selectedPlanet, setSelectedPlanet] = useState("Sun");
  
  // Persistent active view selection: remember if the user prefers Radar or Bar charts
  const [activeView, setActiveView] = useState(localStorage.getItem("astro_veda_shadbala_chart_type") || "radar");

  // Determine the Dominant Planet (highest totalScore)
  const dominantPlanetInfo = useMemo(() => {
    if (!shadbalaData) return null;
    let dominantName = "";
    let maxScore = -1;
    
    Object.entries(shadbalaData).forEach(([p_name, data]) => {
      if (data.totalScore > maxScore) {
        maxScore = data.totalScore;
        dominantName = p_name;
      }
    });
    
    return { name: dominantName, score: maxScore, percentage: shadbalaData[dominantName].percentage };
  }, [shadbalaData]);

  // Format data for Planets Overall Radar/Bar Chart
  const planetsRadarData = useMemo(() => {
    if (!shadbalaData) return [];
    return Object.keys(shadbalaData).map(p_name => ({
      subject: p_name,
      value: shadbalaData[p_name].percentage,
      totalScore: shadbalaData[p_name].totalScore,
      breakdown: shadbalaData[p_name]
    }));
  }, [shadbalaData]);

  // Format data for Selected Planet Categories Radar/Bar Chart
  const categoriesRadarData = useMemo(() => {
    if (!shadbalaData || !selectedPlanet || !shadbalaData[selectedPlanet]) return [];
    const p_data = shadbalaData[selectedPlanet];
    return [
      { subject: "Sthana (Positional)", value: p_data.sthanaBala },
      { subject: "Dik (Directional)", value: p_data.dikBala },
      { subject: "Kala (Temporal)", value: p_data.kalaBala },
      { subject: "Cheshta (Motional)", value: p_data.cheshtaBala },
      { subject: "Naisargika (Natural)", value: p_data.naisargikaBala },
      { subject: "Drik (Aspect)", value: Math.max(0, p_data.drikBala + 30.0) } // Offset Drik to prevent negative chart rendering
    ];
  }, [shadbalaData, selectedPlanet]);

  const handleActiveViewChange = (view) => {
    setActiveView(view);
    localStorage.setItem("astro_veda_shadbala_chart_type", view);
  };

  if (!shadbalaData) {
    return (
      <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "2rem" }}>
        No Shadbala strength data calculated.
      </div>
    );
  }

  // Custom tooltips matching space-theme aesthetics
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (radarMode === "planets") {
        const b = data.breakdown;
        return (
          <div style={{
            background: "rgba(10, 12, 28, 0.95)",
            border: "1px solid var(--color-gold)",
            borderRadius: "8px",
            padding: "1rem",
            boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
            backdropFilter: "blur(12px)",
            fontSize: "0.85rem",
            color: "var(--text-primary)",
            zIndex: 1000
          }}>
            <strong style={{ color: "var(--color-gold)", fontSize: "0.95rem" }}>🪐 {data.subject} Strength</strong>
            <div style={{ margin: "0.5rem 0", height: "1px", background: "var(--border-glass)" }} />
            <div><strong>Overall Strength:</strong> {data.value}%</div>
            <div><strong>Total Score:</strong> {data.totalScore} Shastiamsas</div>
            <div style={{ margin: "0.5rem 0 0.25rem", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "1px" }}>Six-Fold Strength Components:</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem 1rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              <div>• Sthana: {b.sthanaBala}</div>
              <div>• Dik: {b.dikBala}</div>
              <div>• Kala: {b.kalaBala}</div>
              <div>• Cheshta: {b.cheshtaBala}</div>
              <div>• Naisargika: {b.naisargikaBala}</div>
              <div>• Drik: {b.drikBala}</div>
            </div>
          </div>
        );
      } else {
        // Categories breakdown tooltip
        let displayValue = data.value;
        if (data.subject.startsWith("Drik")) {
          displayValue = (data.value - 30.0).toFixed(2); // Subtract offset to show actual aspects
        }
        return (
          <div style={{
            background: "rgba(10, 12, 28, 0.95)",
            border: "1px solid var(--color-gold)",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
            backdropFilter: "blur(12px)",
            fontSize: "0.85rem",
            color: "var(--text-primary)",
            zIndex: 1000
          }}>
            <strong style={{ color: "var(--color-gold)", fontSize: "0.9rem" }}>{data.subject}</strong>
            <div style={{ margin: "0.3rem 0", height: "1px", background: "var(--border-glass)" }} />
            <div><strong>Strength Score:</strong> {displayValue} Shastiamsas</div>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* 1. Header controls & Highlight dominant planet */}
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
            🪐 Shadbala Strength Visualization (Six-Fold)
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Calculates planetary strength across six dimensional vectors
          </span>
        </div>

        {/* Highlight dominant planet */}
        {dominantPlanetInfo && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.50rem",
            background: "rgba(212, 175, 55, 0.08)",
            border: "1px solid rgba(212, 175, 55, 0.3)",
            padding: "0.4rem 0.8rem",
            borderRadius: "12px",
            boxShadow: "0 0 10px rgba(212, 175, 55, 0.15)",
            animation: "stellarPulse 2.5s infinite ease-in-out"
          }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Dominant Planet:</span>
            <strong style={{ color: "var(--color-gold)", fontSize: "0.95rem" }}>👑 {dominantPlanetInfo.name}</strong>
            <span className="score-badge strong" style={{ fontSize: "0.75rem", padding: "0.15rem 0.35rem" }}>{dominantPlanetInfo.percentage}%</span>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: "2rem", alignItems: "center" }}>
        
        {/* Left Side: Controls & Planet Checklist */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* View selector buttons */}
          <div style={{
            display: "flex",
            background: "rgba(0, 0, 0, 0.2)",
            padding: "0.25rem",
            borderRadius: "8px",
            border: "1px solid var(--border-glass)"
          }}>
            <button
              onClick={() => setRadarMode("planets")}
              style={{
                flex: 1,
                background: radarMode === "planets" ? "rgba(212,175,55,0.15)" : "transparent",
                color: radarMode === "planets" ? "var(--color-gold)" : "var(--text-secondary)",
                border: "none",
                padding: "0.5rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.82rem",
                transition: "var(--transition-smooth)"
              }}
            >
              Planetary Strength
            </button>
            <button
              onClick={() => setRadarMode("categories")}
              style={{
                flex: 1,
                background: radarMode === "categories" ? "rgba(212,175,55,0.15)" : "transparent",
                color: radarMode === "categories" ? "var(--color-gold)" : "var(--text-secondary)",
                border: "none",
                padding: "0.5rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.82rem",
                transition: "var(--transition-smooth)"
              }}
            >
              Category Breakdown
            </button>
          </div>

          {/* Persistent Toggle Switch (Radar vs Bar Chart) */}
          <div style={{
            display: "flex",
            background: "rgba(0, 0, 0, 0.2)",
            padding: "0.25rem",
            borderRadius: "8px",
            border: "1px solid var(--border-glass)"
          }}>
            <button
              onClick={() => handleActiveViewChange("radar")}
              style={{
                flex: 1,
                background: activeView === "radar" ? "rgba(212,175,55,0.15)" : "transparent",
                color: activeView === "radar" ? "var(--color-gold)" : "var(--text-secondary)",
                border: "none",
                padding: "0.45rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.80rem",
                transition: "var(--transition-smooth)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.3rem"
              }}
            >
              🕸️ Radar Chart
            </button>
            <button
              onClick={() => handleActiveViewChange("bar")}
              style={{
                flex: 1,
                background: activeView === "bar" ? "rgba(212,175,55,0.15)" : "transparent",
                color: activeView === "bar" ? "var(--color-gold)" : "var(--text-secondary)",
                border: "none",
                padding: "0.45rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.80rem",
                transition: "var(--transition-smooth)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.3rem"
              }}
            >
              📊 Bar Graph
            </button>
          </div>

          {/* Planet Selector Dropdown (visible in categories mode) */}
          {radarMode === "categories" && (
            <div style={{ animation: "fadeIn 0.3s ease-out" }}>
              <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "0.4rem" }}>Select Planet to Analyze</label>
              <select
                className="form-select"
                value={selectedPlanet}
                onChange={e => setSelectedPlanet(e.target.value)}
                style={{ borderColor: "rgba(212,175,55,0.3)" }}
              >
                {Object.keys(shadbalaData).map(p_name => (
                  <option key={p_name} value={p_name}>
                    🪐 {p_name} {dominantPlanetInfo?.name === p_name ? "(Dominant)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Planets Scores Grid */}
          <div style={{
            maxHeight: "220px",
            overflowY: "auto",
            border: "1px solid var(--border-glass)",
            borderRadius: "8px"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "0.5rem 0.75rem" }}>Planet</th>
                  <th style={{ padding: "0.5rem 0.75rem" }}>Total Score</th>
                  <th style={{ padding: "0.5rem 0.75rem" }}>Strength %</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(shadbalaData).map(([p_name, data]) => {
                  const isDom = dominantPlanetInfo?.name === p_name;
                  const isSelectedCat = radarMode === "categories" && selectedPlanet === p_name;
                  
                  return (
                    <tr
                      key={p_name}
                      onClick={() => {
                        if (radarMode === "categories") {
                          setSelectedPlanet(p_name);
                        }
                      }}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        cursor: radarMode === "categories" ? "pointer" : "default",
                        background: isSelectedCat ? "rgba(212,175,55,0.06)" : (isDom ? "rgba(212,175,55,0.02)" : "transparent"),
                        color: isSelectedCat ? "var(--color-gold)" : (isDom ? "var(--color-gold)" : "var(--text-primary)"),
                        fontWeight: (isDom || isSelectedCat) ? "700" : "400"
                      }}
                    >
                      <td style={{ padding: "0.5rem 0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span>🪐</span> {p_name}
                        {isDom && <span style={{ fontSize: "0.7rem" }}>👑</span>}
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>{data.totalScore}</td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>
                        <span className={`score-badge ${data.percentage >= 70 ? "strong" : (data.percentage >= 50 ? "supportive" : "challenging")}`} style={{ fontSize: "0.75rem", padding: "0.1rem 0.35rem" }}>
                          {data.percentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Recharts Chart Component */}
        <div style={{
          height: "360px",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "rgba(0,0,0,0.1)",
          borderRadius: "12px",
          border: "1px solid var(--border-glass)",
          padding: "1rem",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Subtle cosmic background glow in the chart wrapper */}
          <div style={{
            position: "absolute",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)",
            filter: "blur(20px)",
            pointerEvents: "none"
          }} />

          {activeView === "radar" ? (
            <ResponsiveContainer key={`radar-${activeView}-${radarMode}`} width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="80%"
                data={radarMode === "planets" ? planetsRadarData : categoriesRadarData}
              >
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis
                  dataKey="subject"
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 10, fontWeight: "500", fill: "var(--text-secondary)" }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, radarMode === "planets" ? 100 : "auto"]}
                  stroke="rgba(255,255,255,0.08)"
                  tick={{ fill: "var(--text-muted)", fontSize: 8 }}
                />
                <Radar
                  name={radarMode === "planets" ? "Planets Overall Strength" : `${selectedPlanet} Six-Fold Strength`}
                  dataKey="value"
                  stroke="var(--color-gold)"
                  fill="rgba(212,175,55,0.2)"
                  fillOpacity={0.6}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer key={`bar-${activeView}-${radarMode}`} width="100%" height="100%">
              <BarChart
                data={radarMode === "planets" ? planetsRadarData : categoriesRadarData}
                margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis 
                  dataKey="subject" 
                  stroke="var(--text-muted)" 
                  tick={{ fontSize: 9, fill: "var(--text-secondary)" }} 
                />
                <YAxis 
                  domain={[0, radarMode === "planets" ? 100 : "auto"]} 
                  stroke="var(--text-muted)" 
                  tick={{ fontSize: 9, fill: "var(--text-secondary)" }} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                >
                  {radarMode === "planets" ? (
                    planetsRadarData.map((entry, index) => {
                      const isDom = entry.subject === dominantPlanetInfo?.name;
                      return (
                        <Cell 
                          key={`cell-${index}`}
                          fill={isDom ? "rgba(212, 175, 55, 0.8)" : "rgba(212, 175, 55, 0.25)"}
                          stroke={isDom ? "var(--color-gold)" : "rgba(212, 175, 55, 0.5)"}
                          strokeWidth={isDom ? 1.5 : 1}
                        />
                      );
                    })
                  ) : (
                    categoriesRadarData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill="rgba(212, 175, 55, 0.25)"
                        stroke="var(--color-gold)"
                        strokeWidth={1}
                      />
                    ))
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

    </div>
  );
}
