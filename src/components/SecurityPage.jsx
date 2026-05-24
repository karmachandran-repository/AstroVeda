import React from "react";
import { useOutletContext } from "react-router-dom";

export default function SecurityPage() {
  const {
    userToken,
    twoFactorEnabled,
    show2faSetup,
    setShow2faSetup,
    enrollmentSecret,
    enrollmentQrUri,
    confirmOtpCode,
    setConfirmOtpCode,
    authError,
    handleSetup2fa,
    handleConfirmEnable2fa,
    handleDisable2fa
  } = useOutletContext();

  if (!userToken) {
    return (
      <div className="blank-slate stellar-glow" style={{ animation: "fadeIn 0.3s ease-out", textAlign: "center", padding: "3rem" }}>
        <h2 className="blank-slate-title">🔒 Security Settings</h2>
        <p className="blank-slate-desc" style={{ maxWidth: "500px", margin: "1rem auto" }}>
          Please sign in to your AstroVeda account to configure two-factor authentication (2FA) and manage account credentials.
        </p>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <h2 className="prediction-title" style={{ marginBottom: "1rem" }}>
        🔒 Security Settings
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
        Configure Time-Based One-Time Password (TOTP) Two-Factor Authentication (2FA) to protect your saved birth profiles and query logs.
      </p>

      <div className="glass-card gold-border" style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
        <h3 className="card-title gold-accent" style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>🛡️</span> Two-Factor Authentication (2FA)
        </h3>

        {/* 2FA Status Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem",
            borderRadius: "8px",
            background: twoFactorEnabled ? "rgba(40,167,69,0.06)" : "rgba(220,53,69,0.06)",
            border: `1px solid ${twoFactorEnabled ? "rgba(40,167,69,0.2)" : "rgba(220,53,69,0.2)"}`
          }}>
            <div>
              <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Current Status</span>
              <div style={{ 
                fontSize: "1.1rem", 
                fontWeight: "700", 
                color: twoFactorEnabled ? "var(--color-teal)" : "var(--color-rose)",
                marginTop: "0.25rem"
              }}>
                {twoFactorEnabled ? "🟢 Active & Protecting Account" : "🔴 Deactivated (Insecure)"}
              </div>
            </div>

            {!twoFactorEnabled && !show2faSetup && (
              <button 
                type="button" 
                onClick={handleSetup2fa} 
                className="btn-primary" 
                style={{ width: "auto", margin: 0, padding: "0.5rem 1.25rem" }}
              >
                ⚡ Setup 2FA
              </button>
            )}

            {twoFactorEnabled && (
              <button 
                type="button" 
                onClick={handleDisable2fa} 
                className="btn-secondary" 
                style={{ width: "auto", margin: 0, padding: "0.5rem 1.25rem", borderColor: "rgba(220,53,69,0.4)", color: "var(--color-rose)", background: "rgba(220,53,69,0.05)" }}
              >
                Disable 2FA
              </button>
            )}
          </div>

          {/* 2FA Enrollment Wizard */}
          {show2faSetup && !twoFactorEnabled && (
            <div style={{
              padding: "1.5rem",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.01)",
              border: "1px solid var(--border-glass)",
              animation: "fadeIn 0.3s ease-out",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem"
            }}>
              <h4 style={{ margin: 0, fontSize: "1.05rem", color: "var(--color-gold)" }}>
                Step 1: Scan this QR Code
              </h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
                Open your preferred Authenticator app (e.g., Google Authenticator, Microsoft Authenticator, Authy, or Duo Security) and scan the QR code below.
              </p>

              {enrollmentQrUri && (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: "#fff",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  width: "fit-content",
                  margin: "0 auto",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
                }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(enrollmentQrUri)}`}
                    alt="2FA QR Code"
                    style={{ width: "180px", height: "180px" }}
                  />
                  <span style={{ fontSize: "0.72rem", color: "#666", fontFamily: "var(--font-mono)", wordBreak: "break-all", maxWidth: "200px", textAlign: "center" }}>
                    Secret Key: {enrollmentSecret}
                  </span>
                </div>
              )}

              <hr style={{ border: "none", borderTop: "1px solid var(--border-glass)", margin: 0 }} />

              <h4 style={{ margin: 0, fontSize: "1.05rem", color: "var(--color-gold)" }}>
                Step 2: Enter Verification Code
              </h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
                Enter the dynamic 6-digit verification code generated by your Authenticator app to finalize setup.
              </p>

              <div className="form-group" style={{ margin: 0 }}>
                <input 
                  type="text"
                  maxLength={6}
                  pattern="\d{6}"
                  className="form-input"
                  value={confirmOtpCode}
                  onChange={e => setConfirmOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 123456"
                  style={{ letterSpacing: "0.25rem", textAlign: "center", fontSize: "1.1rem", fontWeight: "700" }}
                />
              </div>

              {authError && (
                <div style={{
                  padding: "0.75rem",
                  borderRadius: "6px",
                  background: "rgba(220,53,69,0.1)",
                  border: "1px solid #dc3545",
                  color: "#ff5252",
                  fontSize: "0.85rem",
                  textAlign: "center"
                }}>
                  ⚠️ {authError}
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem" }}>
                <button 
                  type="button" 
                  onClick={handleConfirmEnable2fa} 
                  className="btn-primary" 
                  style={{ flex: 1, margin: 0 }}
                  disabled={confirmOtpCode.length !== 6}
                >
                  Verify & Activate
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShow2faSetup(false); setConfirmOtpCode(""); }} 
                  className="btn-secondary" 
                  style={{ flex: 1, margin: 0 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
