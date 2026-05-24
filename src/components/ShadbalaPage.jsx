import React from "react";
import { useOutletContext } from "react-router-dom";
import ShadbalaRadar from "./ShadbalaRadar";

export default function ShadbalaPage() {
  const { chartData } = useOutletContext();

  if (!chartData) {
    return (
      <div className="blank-slate stellar-glow" style={{ textAlign: "center", padding: "3rem" }}>
        <h2 className="blank-slate-title">🪐 Shadbala Planetary Strength</h2>
        <p className="blank-slate-desc" style={{ maxWidth: "500px", margin: "1rem auto" }}>
          Shadbala calculates the six sources of astrological strength for all 9 planets (Sun through Ketu). Enter your birth details in the sidebar to calculate your planetary strengths.
        </p>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <ShadbalaRadar shadbalaData={chartData.shadbala} />
    </div>
  );
}
