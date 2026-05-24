import React from "react";
import { useOutletContext } from "react-router-dom";

export default function LibraryPage() {
  const {
    libraryStats,
    ingestFile,
    setIngestFile,
    ingestTitle,
    setIngestTitle,
    ingestLoading,
    ingestStatus,
    handleBookUpload
  } = useOutletContext();

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <h2 className="prediction-title" style={{ marginBottom: "1rem" }}>
        Astrological Ingestion Library
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
        Upload astrology books in PDF format to expand AstroVeda's predictive ruleset. The parser will read the text, isolate planetary house/sign chapters, extract combinations (Yogas), and dynamically integrate them into the predictions engine!
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "2rem", alignItems: "start" }}>
        
        {/* Form Zone */}
        <div className="glass-card" style={{ padding: "1.5rem", background: "rgba(255, 255, 255, 0.01)" }}>
          <h3 className="card-title gold-accent" style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
            📁 Ingest New Book PDF
          </h3>

          <form onSubmit={handleBookUpload}>
            <div className="form-group">
              <label className="form-label">Book Custom Title</label>
              <input 
                type="text" 
                className="form-input" 
                value={ingestTitle}
                onChange={e => setIngestTitle(e.target.value)}
                placeholder="e.g. Phaladeepika Chapter 3"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Upload Book PDF File</label>
              <label className="upload-zone" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyItems: "center", padding: "2rem", border: "1px dashed var(--border-glass)", borderRadius: "10px", background: "rgba(255, 255, 255, 0.01)", cursor: "pointer", textAlign: "center" }}>
                <div className="upload-icon" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📄</div>
                <div className="upload-text" style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                  {ingestFile ? ingestFile.name : "Drag & Drop or Click to Select"}
                </div>
                <div className="upload-subtext" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Max size 25MB • Supported format: PDF</div>
                <input 
                  type="file" 
                  className="file-input" 
                  accept="application/pdf" 
                  style={{ display: "none" }}
                  onChange={e => setIngestFile(e.target.files[0])}
                />
              </label>
            </div>

            <button type="submit" className="btn-primary" disabled={ingestLoading || !ingestFile}>
              {ingestLoading ? "Ingesting..." : "⚡ Parse & Index Book"}
            </button>
          </form>

          {ingestStatus && (
            <div style={{ 
              marginTop: "1.25rem", 
              padding: "1rem", 
              borderRadius: "8px", 
              fontSize: "0.85rem",
              background: ingestStatus.type === "success" ? "rgba(40,167,69,0.1)" : (ingestStatus.type === "error" ? "rgba(220,53,69,0.1)" : "rgba(23,162,184,0.1)"),
              border: `1px solid ${ingestStatus.type === "success" ? "#28a745" : (ingestStatus.type === "error" ? "#dc3545" : "#17a2b8")}`,
              color: ingestStatus.type === "success" ? "#28a745" : (ingestStatus.type === "error" ? "#ff5252" : "#17a2b8")
            }}>
              {ingestStatus.text}
            </div>
          )}
        </div>

        {/* Library Statistics & List of books */}
        <div>
          <h3 className="card-title gold-accent" style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
            📚 Active Astrology Knowledge Base
          </h3>
          
          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div className="glass-card" style={{ padding: "0.75rem 1rem", textAlign: "center", background: "rgba(255,255,255,0.01)" }}>
              <div style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--color-gold)" }}>{libraryStats.totalRulesInHouses}</div>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)" }}>House Rules</div>
            </div>
            <div className="glass-card" style={{ padding: "0.75rem 1rem", textAlign: "center", background: "rgba(255,255,255,0.01)" }}>
              <div style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--color-teal)" }}>{libraryStats.totalRulesInSigns}</div>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Sign Rules</div>
            </div>
            <div className="glass-card" style={{ padding: "0.75rem 1rem", textAlign: "center", background: "rgba(255,255,255,0.01)" }}>
              <div style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--color-indigo)" }}>{libraryStats.totalYogas}</div>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Yoga Rules</div>
            </div>
          </div>

          <h3 className="form-label" style={{ borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.25rem", marginBottom: "0.75rem" }}>
            Ingested Publications ({libraryStats.bookMeta.length})
          </h3>

          {libraryStats.bookMeta.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
              No custom books uploaded yet. Operating under Parashara & Phaladeepika foundational defaults.
            </div>
          ) : (
            <div className="ingested-books-list" style={{ maxHeight: "250px", overflowY: "auto" }}>
              {libraryStats.bookMeta.map(b => (
                <div key={b.title} className="ingested-book-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.8rem", borderBottom: "1px solid var(--border-glass)", background: "rgba(255,255,255,0.01)" }}>
                  <div className="book-title-info">
                    📖 {b.title}
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      Ingested: {new Date(b.dateIngested).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="book-rules-count" style={{ fontSize: "0.8rem", color: "var(--color-gold)", fontWeight: "600" }}>+{b.rulesCount} Rules</span>
                </div>
              ))}
            </div>
          )}

          <div className="glass-card" style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(255,255,255,0.01)", borderStyle: "dashed" }}>
            <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              <span>💡</span>
              <span>
                <strong>Note:</strong> Custom books are parsed locally. All extracted rules are added to your local vector model. When a chart is calculated, the system performs a high-fidelity lookup on these rules for education, career, family, finance, health, and luck predictions!
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
