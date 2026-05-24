import React, { useState } from "react";

// Planet abbreviations
const PLANET_ABBREVIATIONS = {
  Lagna: "ASC",
  Sun: "Su",
  Moon: "Mo",
  Mars: "Ma",
  Mercury: "Me",
  Jupiter: "Ju",
  Venus: "Ve",
  Saturn: "Sa",
  Rahu: "Ra",
  Ketu: "Ke"
};

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

export default function VedicChart({ chartPlacements, layoutStyle = "north", title = "Natal Rashi Chart" }) {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: "" });

  if (!chartPlacements || Object.keys(chartPlacements).length === 0) {
    return <div className="blank-slate">No chart data available.</div>;
  }

  // Pre-process placements: group planets by sign / house
  const housePlanets = {};
  const signPlanets = {};

  for (let i = 1; i <= 12; i++) {
    housePlanets[i] = [];
  }
  for (let i = 0; i < 12; i++) {
    signPlanets[i] = [];
  }

  Object.keys(chartPlacements).forEach(key => {
    const p = chartPlacements[key];
    
    // Check if it's from D1 (contains .house and .signDetails)
    // or from other divisional charts (contains .house and .signNum)
    let houseNum = p.house;
    let signNum = p.signDetails ? p.signDetails.signNum : p.signNum;
    
    const formattedPlanet = {
      id: key,
      name: p.name,
      abbr: PLANET_ABBREVIATIONS[p.name] || p.name.substring(0, 2),
      details: p
    };

    if (houseNum) {
      housePlanets[houseNum].push(formattedPlanet);
    }
    if (signNum !== undefined) {
      signPlanets[signNum].push(formattedPlanet);
    }
  });

  const handleMouseMove = (e, planet) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + 15;
    const y = e.clientY - rect.top + 15;

    let content = "";
    if (planet.details.signDetails) {
      // D1 details
      const sd = planet.details.signDetails;
      const nk = planet.details.nakshatra;
      content = `
        <strong>${planet.name}</strong><br/>
        House: ${planet.details.house}<br/>
        Sign: ${sd.signName} (${sd.deg.toFixed(2)}°)<br/>
        Nakshatra: ${nk.name} (Pada ${nk.pada})<br/>
        Ruler: ${nk.ruler}
      `;
    } else {
      // Divisional placement
      content = `
        <strong>${planet.name}</strong><br/>
        Varga Sign: ${planet.details.signName}<br/>
        Varga House: ${planet.details.house}
      `;
    }

    setTooltip({ visible: true, x, y, content });
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, content: "" });
  };

  // 1. North Indian Style SVG Calculation
  const renderNorthChart = () => {
    const lagna = chartPlacements.Lagna;
    const lagnaSign = lagna.signDetails ? lagna.signDetails.signNum : lagna.signNum;

    // Houses coords & text locations in a 400x400 SVG box
    // Diamonds and Triangles
    const paths = {
      1: "M 200 200 L 100 100 L 200 0 L 300 100 Z", // 1st house
      2: "M 200 0 L 100 100 L 0 0 Z",               // 2nd house
      3: "M 0 0 L 100 100 L 0 200 Z",               // 3rd house
      4: "M 0 200 L 100 100 L 200 200 L 100 300 Z", // 4th house
      5: "M 0 200 L 100 300 L 0 400 Z",             // 5th house
      6: "M 0 400 L 100 300 L 200 400 Z",           // 6th house
      7: "M 200 200 L 100 300 L 200 400 L 300 300 Z", // 7th house
      8: "M 200 400 L 300 300 L 400 400 Z",           // 8th house
      9: "M 400 400 L 300 300 L 400 200 Z",           // 9th house
      10: "M 400 200 L 300 300 L 200 200 L 300 100 Z", // 10th house
      11: "M 400 200 L 300 100 L 400 0 Z",             // 11th house
      12: "M 400 0 L 300 100 L 200 0 Z"                // 12th house
    };

    // Locations for Sign Number
    const signCoords = {
      1: { x: 200, y: 130 },
      2: { x: 130, y: 70 },
      3: { x: 70, y: 130 },
      4: { x: 130, y: 200 },
      5: { x: 70, y: 270 },
      6: { x: 130, y: 330 },
      7: { x: 200, y: 270 },
      8: { x: 270, y: 330 },
      9: { x: 330, y: 270 },
      10: { x: 270, y: 200 },
      11: { x: 330, y: 130 },
      12: { x: 270, y: 70 }
    };

    // Planet placement areas inside houses
    const planetCoords = {
      1: { x: 200, y: 70 },
      2: { x: 130, y: 35 },
      3: { x: 35, y: 100 },
      4: { x: 100, y: 200 },
      5: { x: 35, y: 300 },
      6: { x: 130, y: 370 },
      7: { x: 200, y: 330 },
      8: { x: 270, y: 370 },
      9: { x: 370, y: 300 },
      10: { x: 300, y: 200 },
      11: { x: 370, y: 100 },
      12: { x: 270, y: 35 }
    };

    return (
      <svg viewBox="0 0 400 400" className="astro-chart-svg" width="400" height="400">
        {/* Draw outer border */}
        <rect x="0" y="0" width="400" height="400" fill="none" stroke="var(--border-glass)" strokeWidth="4" />
        
        {/* Draw diagonal boundary lines */}
        <line x1="0" y1="0" x2="400" y2="400" className="chart-line" />
        <line x1="400" y1="0" x2="0" y2="400" className="chart-line" />
        
        {/* Draw inner diamond */}
        <line x1="200" y1="0" x2="0" y2="200" className="chart-line highlight" />
        <line x1="0" y1="200" x2="200" y2="400" className="chart-line highlight" />
        <line x1="200" y1="400" x2="400" y2="200" className="chart-line highlight" />
        <line x1="400" y1="200" x2="200" y2="0" className="chart-line highlight" />

        {/* Draw house numbers & sign numbers */}
        {Object.keys(paths).map(hKey => {
          const houseIndex = Number(hKey);
          // Vedic sign inside this house = (lagnaSign + houseIndex - 1) % 12 + 1 (1-indexed zodiac)
          const signIndex = (lagnaSign + houseIndex - 1) % 12;
          const signTextVal = signIndex + 1; // 1-12
          const sC = signCoords[houseIndex];

          return (
            <g key={houseIndex}>
              {/* Sign indicator */}
              <text x={sC.x} y={sC.y} textAnchor="middle" alignmentBaseline="middle" className="chart-rashi-number">
                {signTextVal}
              </text>
              {/* House index tag (tiny indicator in corner of houses) */}
              <text 
                x={houseIndex === 1 ? 200 : (houseIndex === 4 ? 20 : (houseIndex === 7 ? 200 : (houseIndex === 10 ? 380 : signCoords[houseIndex].x)))} 
                y={houseIndex === 1 ? 165 : (houseIndex === 4 ? 165 : (houseIndex === 7 ? 235 : (houseIndex === 10 ? 235 : signCoords[houseIndex].y - 20)))}
                textAnchor="middle" 
                className="chart-text-house"
              >
                H{houseIndex}
              </text>
            </g>
          );
        })}

        {/* Draw planets inside each house */}
        {Object.keys(housePlanets).map(hKey => {
          const houseIndex = Number(hKey);
          const planetsInH = housePlanets[houseIndex];
          const origin = planetCoords[houseIndex];

          return (
            <g key={houseIndex}>
              {planetsInH.map((p, idx) => {
                // Arrange planets in vertical stack if multiple in same house
                const row = Math.floor(idx / 3);
                const col = idx % 3;
                const px = origin.x + (col - 1) * 22;
                const py = origin.y + (row - 0.5) * 18;

                return (
                  <text
                    key={p.id}
                    x={px}
                    y={py}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    className="chart-text-planet"
                    style={{ 
                      fill: p.id === "Lagna" ? "var(--color-gold)" : (p.id === "Rahu" || p.id === "Ketu" ? "var(--color-rose)" : "var(--text-primary)"),
                      fontWeight: p.id === "Lagna" ? "800" : "600"
                    }}
                    onMouseMove={(e) => handleMouseMove(e, p)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {p.abbr}
                  </text>
                );
              })}
            </g>
          );
        })}
      </svg>
    );
  };

  // 2. South Indian Style SVG Calculation
  const renderSouthChart = () => {
    // 12 boxes layout starting from Aries clockwise
    // Map of box coordinates (4x4 grid):
    // 0,0: Pisces (12) | 0,1: Aries (1) | 0,2: Taurus (2) | 0,3: Gemini (3)
    // 1,0: Aquarius (11) | 1,1: Empty | 1,2: Empty | 1,3: Cancer (4)
    // 2,0: Capricorn (10) | 2,1: Empty | 2,2: Empty | 2,3: Leo (5)
    // 3,0: Sagittarius (9) | 3,1: Scorpio (8) | 3,2: Libra (7) | 3,3: Virgo (6)
    
    // Index map of Sign number (0-11 representing Aries to Pisces) to Grid index [row, col]
    const signToGrid = {
      0: [0, 1], // Aries
      1: [0, 2], // Taurus
      2: [0, 3], // Gemini
      3: [1, 3], // Cancer
      4: [2, 3], // Leo
      5: [3, 3], // Virgo
      6: [3, 2], // Libra
      7: [3, 1], // Scorpio
      8: [3, 0], // Sagittarius
      9: [2, 0], // Capricorn
      10: [1, 0], // Aquarius
      11: [0, 0]  // Pisces
    };

    const boxWidth = 100;
    const boxHeight = 100;

    const lagna = chartPlacements.Lagna;
    const lagnaSign = lagna.signDetails ? lagna.signDetails.signNum : lagna.signNum;

    return (
      <svg viewBox="0 0 400 400" className="astro-chart-svg" width="400" height="400">
        {/* Draw outer border */}
        <rect x="0" y="0" width="400" height="400" fill="none" stroke="var(--border-glass)" strokeWidth="4" />

        {/* Draw grid lines */}
        {/* Horizontal */}
        <line x1="0" y1="100" x2="400" y2="100" className="chart-line" />
        <line x1="0" y1="200" x2="400" y2="200" className="chart-line" />
        <line x1="0" y1="300" x2="400" y2="300" className="chart-line" />
        
        {/* Vertical */}
        <line x1="100" y1="0" x2="100" y2="400" className="chart-line" />
        <line x1="200" y1="0" x2="200" y2="400" className="chart-line" />
        <line x1="300" y1="0" x2="300" y2="400" className="chart-line" />

        {/* Clear center */}
        <rect x="101" y="101" width="198" height="198" fill="var(--bg-space)" />
        <text x="200" y="200" textAnchor="middle" alignmentBaseline="middle" style={{ fill: "var(--color-gold)", fontStyle: "italic", fontSize: "14px", fontFamily: "var(--font-serif)" }}>
          {title}
        </text>

        {/* Render signs and their planets */}
        {ZODIAC_SIGNS.map((signName, idx) => {
          const [row, col] = signToGrid[idx];
          const xOrigin = col * boxWidth;
          const yOrigin = row * boxHeight;
          const isLagnaSign = (idx === lagnaSign);

          const planetsInSign = signPlanets[idx] || [];

          return (
            <g key={idx}>
              {/* Sign label in corner of box */}
              <text x={xOrigin + 8} y={yOrigin + 18} style={{ fill: "var(--text-muted)", fontSize: "10px", fontWeight: "bold" }}>
                {signName.substring(0, 3).toUpperCase()}
              </text>

              {/* Ascendant marker inside the box */}
              {isLagnaSign && (
                <>
                  <line x1={xOrigin} y1={yOrigin + boxHeight} x2={xOrigin + boxWidth} y2={yOrigin} stroke="var(--color-gold)" strokeWidth="1" strokeDasharray="2,2" />
                  <text x={xOrigin + 80} y={yOrigin + 18} style={{ fill: "var(--color-gold)", fontSize: "9px", fontWeight: "800" }}>
                    ASC
                  </text>
                </>
              )}

              {/* Render planets in this sign box */}
              {planetsInSign.map((p, pIdx) => {
                // Arrange inside 3x3 cells within box (leaving top free)
                const gridX = pIdx % 3;
                const gridY = Math.floor(pIdx / 3);
                
                const px = xOrigin + 18 + gridX * 32;
                const py = yOrigin + 42 + gridY * 22;

                return (
                  <text
                    key={p.id}
                    x={px}
                    y={py}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    className="chart-text-planet"
                    style={{ 
                      fill: p.id === "Lagna" ? "var(--color-gold)" : (p.id === "Rahu" || p.id === "Ketu" ? "var(--color-rose)" : "var(--text-primary)"),
                      fontWeight: p.id === "Lagna" ? "800" : "600",
                      fontSize: "12px"
                    }}
                    onMouseMove={(e) => handleMouseMove(e, p)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {p.abbr}
                  </text>
                );
              })}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
      {layoutStyle === "north" ? renderNorthChart() : renderSouthChart()}

      {/* Dynamic hover tooltip portal */}
      {tooltip.visible && (
        <div 
          className="astro-tooltip"
          style={{ 
            left: `${tooltip.x}px`, 
            top: `${tooltip.y}px`
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  );
}
