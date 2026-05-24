import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

export default function PredictionsPage() {
  const {
    chartData,
    predictions,
    queryText,
    setQueryText,
    queryLoading,
    queryResult,
    queryTimeSpan,
    setQueryTimeSpan,
    activeRuleIndex,
    setActiveRuleIndex,
    handleQuerySubmit
  } = useOutletContext();

  const [activePredArea, setActivePredArea] = useState("education");

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
          <h3 key={idx} className="card-title gold-accent" style={{ marginTop: "1.75rem", fontSize: "1.2rem", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem" }}>
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
        <h2 className="blank-slate-title">🔮 Astro Query Console</h2>
        <p className="blank-slate-desc" style={{ maxWidth: "500px", margin: "1rem auto" }}>
          The Query Console allows you to ask direct predictive questions about your career, finance, marriage, or studies. First, enter your birth details in the sidebar to draw your natal chart.
        </p>
      </div>
    );
  }

  return (
    <div className="prediction-content-wrapper" style={{ animation: "fadeIn 0.3s ease-out" }}>
      
      {/* Astro Query Console Card */}
      <div className="glass-card gold-border" style={{ marginBottom: "2rem" }}>
        <h2 className="prediction-title" style={{ fontSize: "1.6rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          🔮 Astro Query Console
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "1.5rem", lineHeight: "1.6" }}>
          Ask the Astro Oracle a natural language question. The RAG engine will match domain categories, scan your 120-year Vimshottari Dasha, filter classical Divisional Chart house strengths (D2, D9, D10, D20, D24, D30), retrieve supportive classical rules from the 2,391 library index, and formulate a Compassionate & Classical AI synthesis.
        </p>

        <form onSubmit={handleQuerySubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "1rem", alignItems: "end" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Your Astrological Query</label>
              <input 
                type="text" 
                className="form-input" 
                value={queryText}
                onChange={e => setQueryText(e.target.value)}
                placeholder="e.g., When will my career take off? Will my marriage be happy?"
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Predictive Horizon</label>
              <select 
                className="form-select"
                value={queryTimeSpan}
                onChange={e => setQueryTimeSpan(parseInt(e.target.value))}
              >
                <option value="2">2 Years (Short-term)</option>
                <option value="5">5 Years (Mid-term)</option>
                <option value="10">10 Years (Decade Outlook)</option>
              </select>
            </div>
          </div>

          {/* Suggestion pills */}
          <div style={{ marginTop: "1rem" }}>
            <span className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.4rem" }}>Suggested Queries:</span>
            <div className="query-suggestion-box" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              <button 
                type="button" 
                className="suggestion-pill"
                style={{ padding: "0.4rem 0.8rem", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-glass)", borderRadius: "20px", fontSize: "0.8rem", color: "var(--text-secondary)", cursor: "pointer", transition: "var(--transition-smooth)" }}
                onClick={() => setQueryText("When will my career take off?")}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-glass)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                💼 Career Promotion & Work
              </button>
              <button 
                type="button" 
                className="suggestion-pill"
                style={{ padding: "0.4rem 0.8rem", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-glass)", borderRadius: "20px", fontSize: "0.8rem", color: "var(--text-secondary)", cursor: "pointer", transition: "var(--transition-smooth)" }}
                onClick={() => setQueryText("Will my marriage be happy and supportive?")}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-glass)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                ❤️ Spousal Harmony & Marriage
              </button>
              <button 
                type="button" 
                className="suggestion-pill"
                style={{ padding: "0.4rem 0.8rem", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-glass)", borderRadius: "20px", fontSize: "0.8rem", color: "var(--text-secondary)", cursor: "pointer", transition: "var(--transition-smooth)" }}
                onClick={() => setQueryText("When will my financial assets and wealth grow?")}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-glass)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                💰 Wealth & Hora Prosperity
              </button>
              <button 
                type="button" 
                className="suggestion-pill"
                style={{ padding: "0.4rem 0.8rem", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-glass)", borderRadius: "20px", fontSize: "0.8rem", color: "var(--text-secondary)", cursor: "pointer", transition: "var(--transition-smooth)" }}
                onClick={() => setQueryText("How will my academic studies and higher degrees align?")}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-glass)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                🎓 Studies & Degree Exams
              </button>
              <button 
                type="button" 
                className="suggestion-pill"
                style={{ padding: "0.4rem 0.8rem", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-glass)", borderRadius: "20px", fontSize: "0.8rem", color: "var(--text-secondary)", cursor: "pointer", transition: "var(--transition-smooth)" }}
                onClick={() => setQueryText("Is there a favorable period for physical vitality and healing?")}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-glass)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                🩺 Health & Trimsamsa Recovery
              </button>
              <button 
                type="button" 
                className="suggestion-pill"
                style={{ padding: "0.4rem 0.8rem", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-glass)", borderRadius: "20px", fontSize: "0.8rem", color: "var(--text-secondary)", cursor: "pointer", transition: "var(--transition-smooth)" }}
                onClick={() => setQueryText("When will divine grace and luck guide my spiritual path?")}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-glass)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                ✨ Spiritual Fortune & Luck
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={queryLoading} style={{ marginTop: "1rem" }}>
            {queryLoading ? "Consulting Astro Oracle..." : "⚡ Consult the Astro Oracle"}
          </button>
        </form>
      </div>

      {/* Loader Card */}
      {queryLoading && (
        <div className="glass-card stellar-glow" style={{ textAlign: "center", padding: "4rem 2rem", marginBottom: "2rem" }}>
          <div className="star-spinner" style={{ fontSize: "2rem", animation: "starRotate 2s infinite linear" }}>✨</div>
          <h3 className="blank-slate-title" style={{ marginTop: "1.5rem" }}>Aligning Ecliptic Spheres</h3>
          <p className="blank-slate-desc" style={{ marginTop: "0.5rem" }}>
            Mapping keyword vectors, classifying divisional targets, scanning chronological Vimshottari Dasha nodes, indexing rules from the RAG library, and compiling your compassionate narrative...
          </p>
        </div>
      )}

      {/* Astro Query Results Dashboard */}
      {!queryLoading && queryResult && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginBottom: "3rem" }}>
          
          {/* Results Container Card */}
          <div className="glass-card gold-border">
            
            {/* Header with badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 className="prediction-title" style={{ fontSize: "1.5rem", margin: 0 }}>
                  Astro Oracle's Synthesis
                </h2>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  Query: "{queryResult.query}"
                </span>
              </div>
              <span className="score-badge strong" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
                Domain: {queryResult.domainTitle}
              </span>
            </div>

            {/* Chronological Timeline Scanner */}
            <div style={{ marginBottom: "2.5rem" }}>
              <h3 className="card-title gold-accent" style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
                ⏳ Vimshottari Timeline & Support Calibration
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                We examine chronological periods (historical past, present, and future triggers) and map divisional lords to score planetary support (0-100).
              </p>

              <div className="timeline-flow" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* 1. Historical Calibration Periods */}
                {queryResult.historicalPeriods && queryResult.historicalPeriods.map((p, idx) => {
                  const scoreClass = p.score >= 70 ? "strong" : (p.score >= 50 ? "supportive" : "challenging");
                  return (
                    <div key={`hist-${idx}`} className="timeline-node historical" style={{ display: "flex", gap: "1rem" }}>
                      <div className="timeline-marker" style={{ fontSize: "1.2rem", padding: "0.2rem" }} title="Historical Calibration">⏳</div>
                      <div className="timeline-content-card" style={{ flex: 1, background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-glass)", padding: "1rem", borderRadius: "8px" }}>
                        <div className="timeline-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                          <span className="timeline-period-title" style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                            {p.mahadasha}-{p.antardasha} Period
                            <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.35rem", background: "rgba(162,140,255,0.15)", color: "var(--color-indigo)", borderRadius: "4px", fontWeight: "normal", marginLeft: "0.5rem" }}>Past Calibration</span>
                          </span>
                          <span className={`score-badge ${scoreClass}`}>
                            Score: {p.score}/100 ({p.support})
                          </span>
                        </div>
                        <div className="timeline-dates-span" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                          {new Date(p.startDate).toLocaleDateString()} to {new Date(p.endDate).toLocaleDateString()}
                        </div>
                        <p className="timeline-period-desc" style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          <strong>Past Calibration:</strong> {p.analysis} Verify if this period in your past brought supportive transitions, actions, or events matching this domain.
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* 2. Present Period */}
                {queryResult.currentPeriod && (() => {
                  const p = queryResult.currentPeriod;
                  const scoreClass = p.score >= 70 ? "strong" : (p.score >= 50 ? "supportive" : "challenging");
                  return (
                    <div className="timeline-node current" style={{ display: "flex", gap: "1rem" }}>
                      <div className="timeline-marker" style={{ fontSize: "1.2rem", padding: "0.2rem" }} title="Current Period">🌟</div>
                      <div className="timeline-content-card" style={{ flex: 1, background: "rgba(212, 175, 55, 0.02)", border: "1px solid var(--border-glass-active)", padding: "1rem", borderRadius: "8px", boxShadow: "0 0 15px rgba(212, 175, 55, 0.05)" }}>
                        <div className="timeline-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                          <span className="timeline-period-title" style={{ color: "var(--color-gold)", fontWeight: "700", fontSize: "0.95rem" }}>
                            {p.mahadasha}-{p.antardasha} Period
                            <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.35rem", background: "rgba(212,175,55,0.2)", color: "var(--color-gold)", borderRadius: "4px", marginLeft: "0.5rem", fontWeight: "normal" }}>Active Now</span>
                          </span>
                          <span className={`score-badge ${scoreClass}`}>
                            Score: {p.score}/100 ({p.support})
                          </span>
                        </div>
                        <div className="timeline-dates-span" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                          Running until {new Date(p.endDate).toLocaleDateString()}
                        </div>
                        <p className="timeline-period-desc" style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          <strong>Oracle's Present Assessment:</strong> {p.analysis}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Future Trigger Periods */}
                {queryResult.futurePeriods && queryResult.futurePeriods.map((p, idx) => {
                  const scoreClass = p.score >= 70 ? "strong" : (p.score >= 50 ? "supportive" : "challenging");
                  return (
                    <div key={`fut-${idx}`} className="timeline-node future" style={{ display: "flex", gap: "1rem" }}>
                      <div className="timeline-marker" style={{ fontSize: "1.2rem", padding: "0.2rem" }} title="Future Forecast">📅</div>
                      <div className="timeline-content-card" style={{ flex: 1, background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-glass)", padding: "1rem", borderRadius: "8px" }}>
                        <div className="timeline-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                          <span className="timeline-period-title" style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                            {p.mahadasha}-{p.antardasha} Period
                            <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.35rem", background: "rgba(0,230,175,0.1)", color: "var(--color-teal)", borderRadius: "4px", fontWeight: "normal", marginLeft: "0.5rem" }}>Upcoming Activation</span>
                          </span>
                          <span className={`score-badge ${scoreClass}`}>
                            Score: {p.score}/100 ({p.support})
                          </span>
                        </div>
                        <div className="timeline-dates-span" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                          From {new Date(p.startDate).toLocaleDateString()} to {new Date(p.endDate).toLocaleDateString()}
                        </div>
                        <p className="timeline-period-desc" style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          <strong>Oracle's Forecast:</strong> {p.analysis}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Classical Attributions Rule Carousel */}
            {queryResult.retrievedRules && queryResult.retrievedRules.length > 0 && (
              <div className="rules-carousel-wrapper" style={{ marginBottom: "2.5rem", background: "rgba(10, 12, 28, 0.3)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "1.5rem" }}>
                <h3 className="card-title gold-accent" style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>
                  📜 Ancient Classical Attributions (RAG Rules)
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "1rem" }}>
                  Supporting shlokas and combinations retrieved from our 2,391 classical libraries.
                </p>

                <div className="carousel-slide-content" style={{ minHeight: "80px", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem 0" }}>
                  <blockquote style={{ fontSize: "1.1rem", fontStyle: "italic", color: "var(--text-secondary)", lineHeight: "1.6", margin: 0, fontFamily: "var(--font-serif)", textAlign: "center" }}>
                    "{queryResult.retrievedRules[activeRuleIndex]}"
                  </blockquote>
                </div>

                <div className="carousel-controls" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
                  <button 
                    type="button" 
                    className="carousel-nav-btn"
                    style={{ background: "transparent", border: "none", color: "var(--color-gold)", cursor: "pointer", fontSize: "1.2rem" }}
                    onClick={() => setActiveRuleIndex(prev => (prev === 0 ? queryResult.retrievedRules.length - 1 : prev - 1))}
                  >
                    ◀
                  </button>
                  <div className="carousel-dots" style={{ display: "flex", gap: "0.5rem" }}>
                    {queryResult.retrievedRules.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`carousel-dot ${idx === activeRuleIndex ? "active" : ""}`}
                        style={{ width: "8px", height: "8px", borderRadius: "50%", background: idx === activeRuleIndex ? "var(--color-gold)" : "var(--border-glass)", cursor: "pointer" }}
                        onClick={() => setActiveRuleIndex(idx)}
                      />
                    ))}
                  </div>
                  <button 
                    type="button" 
                    className="carousel-nav-btn"
                    style={{ background: "transparent", border: "none", color: "var(--color-gold)", cursor: "pointer", fontSize: "1.2rem" }}
                    onClick={() => setActiveRuleIndex(prev => (prev === queryResult.retrievedRules.length - 1 ? 0 : prev + 1))}
                  >
                    ▶
                  </button>
                </div>
              </div>
            )}

            {/* AI Narrative Section */}
            <div style={{ marginTop: "2rem" }}>
              <h3 className="card-title gold-accent" style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
                ✨ Holistic Guidance & Remedies (Compassionate & Classical)
              </h3>
              <div className="prediction-body" style={{ whiteSpace: "normal" }}>
                {renderMarkdown(queryResult.aiSynthesis)}
              </div>
            </div>

          </div>
        </div>
      )}

      <hr className="gold-divider" style={{ border: "none", borderTop: "1px solid var(--border-glass)", margin: "3rem 0", opacity: 0.4 }} />

      <h2 className="prediction-title" style={{ marginBottom: "1rem", fontSize: "1.6rem" }}>
        📊 Foundational Divisional Reports
      </h2>
      
      {/* Predictions Tabs */}
      <div className="predictions-area-tabs" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {predictions.predictionsList.map(p => {
          const areaKey = p.title.split(",")[0].toLowerCase().trim();
          let normKey = "education";
          if (areaKey.includes("career")) normKey = "career";
          else if (areaKey.includes("family")) normKey = "family";
          else if (areaKey.includes("finance")) normKey = "finance";
          else if (areaKey.includes("health")) normKey = "health";
          else if (areaKey.includes("luck")) normKey = "luck";

          return (
            <button 
              key={p.title}
              className={`pred-tab-btn ${activePredArea === normKey ? "active" : ""}`}
              style={{
                background: activePredArea === normKey ? "var(--color-gold)" : "rgba(10, 12, 28, 0.4)",
                color: activePredArea === normKey ? "var(--bg-deep)" : "var(--text-secondary)",
                border: "1px solid var(--border-glass)",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.85rem",
                transition: "var(--transition-smooth)"
              }}
              onClick={() => setActivePredArea(normKey)}
            >
              {p.title.split(",")[0]}
            </button>
          );
        })}
      </div>

      {/* Show selected prediction text */}
      {(() => {
        const targetPred = predictions.predictionsList.find(p => {
          const areaKey = p.title.split(",")[0].toLowerCase().trim();
          if (activePredArea === "education" && areaKey.includes("education")) return true;
          if (activePredArea === "career" && areaKey.includes("career")) return true;
          if (activePredArea === "family" && areaKey.includes("family")) return true;
          if (activePredArea === "finance" && areaKey.includes("finance")) return true;
          if (activePredArea === "health" && areaKey.includes("health")) return true;
          if (activePredArea === "luck" && areaKey.includes("luck")) return true;
          return false;
        });

        if (!targetPred) return null;

        return (
          <div className="glass-card gold-border" style={{ animation: "fadeIn 0.3s ease-out" }}>
            <h3 className="prediction-title" style={{ fontSize: "1.4rem" }}>
              {targetPred.title}
            </h3>
            <div className="prediction-meta" style={{ display: "flex", gap: "1.5rem", fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.5rem 0 1rem" }}>
              <div>Strength: <strong style={{ color: "var(--color-gold)" }}>{targetPred.strength}</strong></div>
              <div>Varga reference: <span className="prediction-badge-ref" style={{ background: "rgba(162,140,255,0.1)", color: "var(--color-indigo)", padding: "0.1rem 0.3rem", borderRadius: "4px" }}>{targetPred.divisionalChartRef}</span></div>
            </div>
            <div className="prediction-body" style={{ fontSize: "0.95rem", lineHeight: "1.75", color: "var(--text-secondary)" }}>
              {targetPred.text}
            </div>
          </div>
        );
      })()}

    </div>
  );
}
