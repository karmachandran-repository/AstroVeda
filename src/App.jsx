import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import PredictionsPage from "./components/PredictionsPage";
import ShadbalaPage from "./components/ShadbalaPage";
import MatchmakingPage from "./components/MatchmakingPage";
import MuhurtaPage from "./components/MuhurtaPage";
import LibraryPage from "./components/LibraryPage";
import SecurityPage from "./components/SecurityPage";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PRESET_CITIES = [
  { name: "New Delhi, India", lat: 28.6139, lon: 77.2090, tz: 5.5 },
  { name: "Mumbai, India", lat: 19.0760, lon: 72.8777, tz: 5.5 },
  { name: "London, UK", lat: 51.5074, lon: -0.1278, tz: 1.0 },
  { name: "New York, USA", lat: 40.7128, lon: -74.0060, tz: -4.0 },
  { name: "San Francisco, USA", lat: 37.7749, lon: -122.4194, tz: -7.0 },
  { name: "Tokyo, Japan", lat: 35.6762, lon: 139.6503, tz: 9.0 },
  { name: "Sydney, Australia", lat: -33.8688, lon: 151.2093, tz: 10.0 }
];

export default function App() {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  
  // Birth Details Form State
  const [formData, setFormData] = useState({
    name: "",
    gender: "Male",
    date: "1995-05-15",
    time: "08:30",
    cityPreset: "New Delhi, India",
    latitude: "28.6139",
    longitude: "77.2090",
    timezoneOffset: "5.5"
  });

  // Astrological Data State
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  
  // Astro Query Console State
  const [queryText, setQueryText] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [queryTimeSpan, setQueryTimeSpan] = useState(10);
  const [activeRuleIndex, setActiveRuleIndex] = useState(0);
  
  // Place Autocomplete & Geocoding State
  const [placeInput, setPlaceInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [selectedTimezoneName, setSelectedTimezoneName] = useState("");
  const [manualLocationOverride, setManualLocationOverride] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  
  // Matchmaking (Kundali Milan) State
  const [partnerFormData, setPartnerFormData] = useState({
    name: "",
    gender: "Female",
    date: "1997-07-12",
    time: "14:15",
    latitude: "40.7128",
    longitude: "-74.0060",
    timezoneOffset: "-4.0"
  });
  const [partnerPlaceInput, setPartnerPlaceInput] = useState("");
  const [partnerSuggestions, setPartnerSuggestions] = useState([]);
  const [partnerSuggestionsVisible, setPartnerSuggestionsVisible] = useState(false);
  const [partnerSelectedTimezoneName, setPartnerSelectedTimezoneName] = useState("");
  const [partnerManualOverride, setPartnerManualOverride] = useState(false);
  const [partnerGeocodingLoading, setPartnerGeocodingLoading] = useState(false);
  const [matchmakingResult, setMatchmakingResult] = useState(null);
  const [matchmakingLoading, setMatchmakingLoading] = useState(false);
  
  // Chart Display Settings
  const [chartStyle, setChartStyle] = useState("north");
  const [selectedVarga, setSelectedVarga] = useState("1"); // Default D1 (Rashi)

  // Muhurta State
  const [muhurtaEvent, setMuhurtaEvent] = useState("marriage");
  const [muhurtaStartDate, setMuhurtaStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [muhurtaLoading, setMuhurtaLoading] = useState(false);
  const [muhurtaResults, setMuhurtaResults] = useState([]);

  // Book Ingestion State
  const [ingestFile, setIngestFile] = useState(null);
  const [ingestTitle, setIngestTitle] = useState("");
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestStatus, setIngestStatus] = useState(null);
  const [libraryStats, setLibraryStats] = useState({ bookMeta: [], totalRulesInHouses: 0, totalRulesInSigns: 0, totalYogas: 0 });

  // Predictions Detail State
  const [activePredArea, setActivePredArea] = useState("education");

  // Dasha breakdown state
  const [activeMD, setActiveMD] = useState(null);

  // Session Authentication State
  const [userToken, setUserToken] = useState(localStorage.getItem("astro_veda_token") || "");
  const [currentUsername, setCurrentUsername] = useState(localStorage.getItem("astro_veda_username") || "");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login", "register", or "2fa_verify"
  const [authForm, setAuthForm] = useState({ username: "", password: "", confirmPassword: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // New Google OAuth2 & 2FA State Variables
  const [googleClientId, setGoogleClientId] = useState("");
  const [pending2faUser, setPending2faUser] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2faSetup, setShow2faSetup] = useState(false);
  const [enrollmentSecret, setEnrollmentSecret] = useState("");
  const [enrollmentQrUri, setEnrollmentQrUri] = useState("");
  const [confirmOtpCode, setConfirmOtpCode] = useState("");

  // Load saved profiles, 2FA status, and library stats on init (reactive to token changes)
  useEffect(() => {
    if (userToken) {
      fetchProfiles();
      fetch2faStatus();
    } else {
      setProfiles([]);
      setTwoFactorEnabled(false);
    }
    fetchLibraryStats();
  }, [userToken]);

  // Load Google Client ID dynamically and initialize SDK on mount
  useEffect(() => {
    const fetchAuthConfig = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.googleClientId) {
            setGoogleClientId(data.googleClientId);
            
            // Load Google SDK if not already loaded
            if (!document.getElementById("google-gsi-script")) {
              const script = document.createElement("script");
              script.id = "google-gsi-script";
              script.src = "https://accounts.google.com/gsi/client";
              script.async = true;
              script.defer = true;
              document.body.appendChild(script);
            }
          }
        }
      } catch (e) {
        console.warn("Failed to load Google Auth Config:", e);
      }
    };
    fetchAuthConfig();
  }, []);

  // Render Google Sign-in button programmatically when Auth Modal is visible
  useEffect(() => {
    if (showAuthModal && googleClientId && (authMode === "login" || authMode === "register")) {
      const timer = setTimeout(() => {
        try {
          if (window.google) {
            window.google.accounts.id.initialize({
              client_id: googleClientId,
              callback: handleGoogleLoginCallback
            });
            const container = document.getElementById("google-signin-btn");
            if (container) {
              window.google.accounts.id.renderButton(container, {
                theme: "outline",
                size: "large",
                width: 336
              });
            }
          }
        } catch (err) {
          console.error("Failed to render Google Sign-In button:", err);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showAuthModal, googleClientId, authMode]);

  const fetch2faStatus = async () => {
    if (!userToken) return;
    try {
      const response = await fetch(`${API_BASE}/api/auth/2fa/status`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${userToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTwoFactorEnabled(data.twoFactorEnabled);
      }
    } catch (err) {
      console.warn("Failed to fetch 2FA status:", err);
    }
  };

  // Debounced search logic for birth place autocomplete
  useEffect(() => {
    if (manualLocationOverride || placeInput.trim().length < 3) {
      setSuggestions([]);
      setSuggestionsVisible(false);
      return;
    }

    const timer = setTimeout(async () => {
      setGeocodingLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/search-place?query=${encodeURIComponent(placeInput)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
          setSuggestionsVisible(data.length > 0);
        }
      } catch (err) {
        console.error("Geocoding fetch failed:", err);
      } finally {
        setGeocodingLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [placeInput, manualLocationOverride]);

  const handleSelectSuggestion = (sug) => {
    setPlaceInput(sug.name);
    setSelectedTimezoneName(sug.timezoneName);
    setSuggestionsVisible(false);
    
    setFormData(prev => ({
      ...prev,
      cityPreset: "Custom",
      latitude: sug.latitude.toString(),
      longitude: sug.longitude.toString(),
      timezoneOffset: sug.defaultOffset.toString()
    }));
  };

  // Debounced search logic for partner place autocomplete
  useEffect(() => {
    if (partnerManualOverride || partnerPlaceInput.trim().length < 3) {
      setPartnerSuggestions([]);
      setPartnerSuggestionsVisible(false);
      return;
    }

    const timer = setTimeout(async () => {
      setPartnerGeocodingLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/search-place?query=${encodeURIComponent(partnerPlaceInput)}`);
        if (response.ok) {
          const data = await response.json();
          setPartnerSuggestions(data);
          setPartnerSuggestionsVisible(data.length > 0);
        }
      } catch (err) {
        console.error("Partner geocoding fetch failed:", err);
      } finally {
        setPartnerGeocodingLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [partnerPlaceInput, partnerManualOverride]);

  const handleSelectPartnerSuggestion = (sug) => {
    setPartnerPlaceInput(sug.name);
    setPartnerSelectedTimezoneName(sug.timezoneName);
    setPartnerSuggestionsVisible(false);
    
    setPartnerFormData(prev => ({
      ...prev,
      latitude: sug.latitude.toString(),
      longitude: sug.longitude.toString(),
      timezoneOffset: sug.defaultOffset.toString()
    }));
  };

  const handleMatchmakingSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!chartData) return alert("Please calculate your primary birth chart first.");
    if (!partnerFormData.name.trim()) return alert("Please enter the partner's name.");

    setMatchmakingLoading(true);
    setMatchmakingResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/matchmaking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryChartData: chartData,
          partnerDetails: {
            ...partnerFormData,
            timezoneName: partnerManualOverride ? "" : partnerSelectedTimezoneName
          }
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMatchmakingResult(data);
      } else {
        alert("Matchmaking calculation failed: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error reaching matchmaking server. Make sure the backend is active on port 5000.");
    } finally {
      setMatchmakingLoading(false);
    }
  };

  const fetchProfiles = async () => {
    if (!userToken) {
      setProfiles([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/profiles`, {
        headers: {
          "Authorization": `Bearer ${userToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      } else if (res.status === 401) {
        handleSignOut();
      }
    } catch (e) {
      console.warn("Failed to load saved profiles from local server:", e);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("astro_veda_token");
    localStorage.removeItem("astro_veda_username");
    setUserToken("");
    setCurrentUsername("");
    setProfiles([]);
    setSelectedProfileId("");
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authForm.username.trim() || !authForm.password.trim()) {
      setAuthError("Username and password are required.");
      return;
    }
    if (authMode === "register" && authForm.password !== authForm.confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }
    
    setAuthLoading(true);
    setAuthError("");
    
    const endpoint = authMode === "login" ? "login" : "register";
    try {
      const usernameLower = authForm.username.trim().toLowerCase();
      const trustedToken = localStorage.getItem(`trusted_device_${usernameLower}`);
      
      const headers = { "Content-Type": "application/json" };
      if (trustedToken && endpoint === "login") {
        headers["x-trusted-device"] = trustedToken;
      }

      const response = await fetch(`${API_BASE}/api/auth/${endpoint}`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          username: authForm.username.trim(),
          password: authForm.password.trim()
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (data.require2fa) {
          setPending2faUser(data.username);
          setAuthMode("2fa_verify");
          setOtpCode("");
          setTrustDevice(false);
        } else {
          localStorage.setItem("astro_veda_token", data.token);
          localStorage.setItem("astro_veda_username", data.username);
          setUserToken(data.token);
          setCurrentUsername(data.username);
          setShowAuthModal(false);
          setAuthForm({ username: "", password: "", confirmPassword: "" });
        }
      } else {
        setAuthError(data.detail || "Authentication failed.");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Could not reach the authentication server.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLoginCallback = async (response) => {
    setAuthLoading(true);
    setAuthError("");
    
    const headers = { "Content-Type": "application/json" };
    const lastUser = localStorage.getItem("astro_veda_username");
    if (lastUser) {
      const trustedToken = localStorage.getItem(`trusted_device_${lastUser.trim().toLowerCase()}`);
      if (trustedToken) {
        headers["x-trusted-device"] = trustedToken;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ credential: response.credential })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.require2fa) {
          setPending2faUser(data.username);
          setAuthMode("2fa_verify");
          setOtpCode("");
          setTrustDevice(false);
        } else {
          setUserToken(data.token);
          setCurrentUsername(data.username);
          setShowAuthModal(false);
          setAuthForm({ username: "", password: "", confirmPassword: "" });
        }
      } else {
        setAuthError(data.detail || "Google Sign-In failed.");
      }
    } catch (err) {
      console.error("Google auth callback failed:", err);
      setAuthError("Could not reach authentication server.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLinkedInLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/linkedin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "mock_linkedin_auth_code_12345" })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("astro_veda_token", data.token);
        localStorage.setItem("astro_veda_username", data.username);
        setUserToken(data.token);
        setCurrentUsername(data.username);
        setShowAuthModal(false);
        setAuthForm({ username: "", password: "", confirmPassword: "" });
      } else {
        setAuthError(data.detail || "LinkedIn sign-in failed.");
      }
    } catch (err) {
      console.error("LinkedIn login failed:", err);
      setAuthError("Failed to reach LinkedIn auth service.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/microsoft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "mock_microsoft_auth_code_67890" })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("astro_veda_token", data.token);
        localStorage.setItem("astro_veda_username", data.username);
        setUserToken(data.token);
        setCurrentUsername(data.username);
        setShowAuthModal(false);
        setAuthForm({ username: "", password: "", confirmPassword: "" });
      } else {
        setAuthError(data.detail || "Microsoft sign-in failed.");
      }
    } catch (err) {
      console.error("Microsoft login failed:", err);
      setAuthError("Failed to reach Microsoft auth service.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOtpVerifySubmit = async (e) => {
    if (e) e.preventDefault();
    if (otpCode.trim().length !== 6) {
      setAuthError("Please enter a valid 6-digit verification code.");
      return;
    }
    
    setAuthLoading(true);
    setAuthError("");
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/2fa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: pending2faUser,
          code: otpCode.trim(),
          trustDevice: trustDevice
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem("astro_veda_token", data.token);
        localStorage.setItem("astro_veda_username", data.username);
        setUserToken(data.token);
        setCurrentUsername(data.username);
        
        if (data.trustedDeviceToken) {
          localStorage.setItem(`trusted_device_${data.username.trim().toLowerCase()}`, data.trustedDeviceToken);
        }
        
        setShowAuthModal(false);
        setAuthForm({ username: "", password: "", confirmPassword: "" });
        setPending2faUser("");
        setOtpCode("");
        setTrustDevice(false);
      } else {
        setAuthError(data.detail || "Invalid verification code.");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Failed to verify authentication code.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSetup2fa = async () => {
    setAuthError("");
    try {
      const response = await fetch(`${API_BASE}/api/auth/2fa/setup`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${userToken}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setEnrollmentSecret(data.secret);
        setEnrollmentQrUri(data.otpauthUri);
        setShow2faSetup(true);
      } else {
        setAuthError(data.detail || "Failed to initialize 2FA setup.");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Failed to reach server for 2FA setup.");
    }
  };

  const handleConfirmEnable2fa = async () => {
    if (confirmOtpCode.trim().length !== 6) {
      setAuthError("Please enter the 6-digit confirmation code.");
      return;
    }
    setAuthError("");
    try {
      const response = await fetch(`${API_BASE}/api/auth/2fa/enable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userToken}`
        },
        body: JSON.stringify({ code: confirmOtpCode.trim() })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTwoFactorEnabled(true);
        setShow2faSetup(false);
        setConfirmOtpCode("");
      } else {
        setAuthError(data.detail || "Invalid code. Activation failed.");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Failed to reach server to enable 2FA.");
    }
  };

  const handleDisable2fa = async () => {
    if (!confirm("Are you sure you want to deactivate Two-Factor Authentication? Your account security will be lowered.")) return;
    setAuthError("");
    try {
      const response = await fetch(`${API_BASE}/api/auth/2fa/disable`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${userToken}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTwoFactorEnabled(false);
        setShow2faSetup(false);
        setEnrollmentSecret("");
        setEnrollmentQrUri("");
      } else {
        alert(data.detail || "Failed to disable 2FA.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to reach server to disable 2FA.");
    }
  };

  const fetchLibraryStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ingested-books`);
      const data = await res.json();
      setLibraryStats(data);
    } catch (e) {
      console.warn("Failed to load library statistics from local server:", e);
    }
  };

  const handleCityPresetChange = (cityName) => {
    const city = PRESET_CITIES.find(c => c.name === cityName);
    if (city) {
      setFormData(prev => ({
        ...prev,
        cityPreset: cityName,
        latitude: city.lat.toString(),
        longitude: city.lon.toString(),
        timezoneOffset: city.tz.toString()
      }));
    } else {
      setFormData(prev => ({ ...prev, cityPreset: "Custom" }));
    }
  };

  // Submit Birth Details Form to Calculate Chart
  const handleCalculate = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) return alert("Please enter a name.");

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/calculate-chart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          timezoneName: manualLocationOverride ? "" : selectedTimezoneName
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setChartData(data.chartData);
        setPredictions(data.predictions);
        
        // Auto-select first Mahadasha to inspect
        if (data.chartData.dashas.length > 0) {
          setActiveMD(data.chartData.dashas[0].planet);
        }

        // Save profile automatically
        saveProfile(formData, data.chartData);
      } else {
        alert("Failed to compute chart: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error reaching astronomical server. Please make sure the backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  // Save current details as a profile in local database (if authenticated)
  const saveProfile = async (form, chart) => {
    if (!userToken) return; // Guest mode - do not save
    
    const profileToSave = {
      name: form.name,
      gender: form.gender,
      date: form.date,
      time: form.time,
      latitude: form.latitude,
      longitude: form.longitude,
      timezoneOffset: form.timezoneOffset,
      timezoneName: selectedTimezoneName,
      panchanga: chart.panchanga
    };

    try {
      const response = await fetch(`${API_BASE}/api/profiles/save`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userToken}`
        },
        body: JSON.stringify(profileToSave)
      });
      const data = await response.json();
      if (data.success) {
        fetchProfiles();
      }
    } catch (e) {
      console.error("Failed to save profile:", e);
    }
  };

  const handleSelectProfile = (prof) => {
    setSelectedProfileId(prof.id);
    const newForm = {
      name: prof.name,
      gender: prof.gender || "Male",
      date: prof.date,
      time: prof.time,
      cityPreset: "Custom",
      latitude: prof.latitude.toString(),
      longitude: prof.longitude.toString(),
      timezoneOffset: prof.timezoneOffset.toString()
    };
    setFormData(newForm);
    setPlaceInput(prof.timezoneName ? `Coordinates resolved (${prof.timezoneName})` : "Custom coordinates");
    setSelectedTimezoneName(prof.timezoneName || "");
    setManualLocationOverride(prof.timezoneName ? false : true);
    
    // Automatically trigger calculation for the selected profile
    setLoading(true);
    fetch(`${API_BASE}/api/calculate-chart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newForm,
        timezoneName: prof.timezoneName || ""
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setChartData(data.chartData);
          setPredictions(data.predictions);
          if (data.chartData.dashas.length > 0) {
            setActiveMD(data.chartData.dashas[0].planet);
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  // Handle Predictive Query Submission
  const handleQuerySubmit = async (e) => {
    if (e) e.preventDefault();
    if (!queryText.trim()) return alert("Please enter your astro query.");
    if (!chartData) return alert("Please generate your birth chart first.");

    setQueryLoading(true);
    setQueryResult(null);
    setActiveRuleIndex(0);

    try {
      const response = await fetch(`${API_BASE}/api/query-prediction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryText,
          chartData: chartData,
          yearsSpan: parseInt(queryTimeSpan)
        })
      });
      const data = await response.json();
      if (response.ok) {
        setQueryResult(data);
      } else {
        alert("Failed to compile prediction: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error reaching astronomical query server. Ensure backend is active.");
    } finally {
      setQueryLoading(false);
    }
  };

  // Helper function to render AI synthesis markdown with dynamic style
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
          <blockquote key={idx} className="scroll-quote">
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

  // Scan Auspicious Muhurtas
  const handleScanMuhurta = async (e) => {
    e.preventDefault();
    if (!chartData) {
      return alert("Please generate your Birth Chart first so we can analyze coordinates.");
    }
    
    setMuhurtaLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/scan-muhurtas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: muhurtaEvent,
          startDate: muhurtaStartDate,
          latitude: formData.latitude,
          longitude: formData.longitude,
          timezoneOffset: formData.timezoneOffset
        })
      });
      const data = await response.json();
      if (data.success) {
        setMuhurtaResults(data.results);
      }
    } catch (err) {
      console.error(err);
      alert("Error scanning Muhurtas.");
    } finally {
      setMuhurtaLoading(false);
    }
  };

  // Upload book PDF for ingestion
  const handleBookUpload = async (e) => {
    e.preventDefault();
    if (!ingestFile) return alert("Please select a PDF file.");

    setIngestLoading(true);
    setIngestStatus({ type: "info", text: "Processing PDF... Parsing text and compiling theories. Please wait, this may take a few seconds." });
    
    const formUpload = new FormData();
    formUpload.append("book", ingestFile);
    formUpload.append("title", ingestTitle);

    try {
      const response = await fetch(`${API_BASE}/api/ingest-book`, {
        method: "POST",
        body: formUpload
      });
      const data = await response.json();
      if (data.success) {
        setIngestStatus({ 
          type: "success", 
          text: `Success! Ingested book "${data.title}" successfully. Analyzed ${data.pages} pages and indexed ${data.rulesIngested} new astrological planetary rules!` 
        });
        setIngestFile(null);
        setIngestTitle("");
        fetchLibraryStats();
      } else {
        setIngestStatus({ type: "error", text: data.error });
      }
    } catch (err) {
      setIngestStatus({ type: "error", text: "Failed to upload and ingest PDF. Check if backend is running." });
    } finally {
      setIngestLoading(false);
    }
  };

  return (
    <>
      <HashRouter>
        <Routes>
          <Route path="/" element={
            <Layout
              userToken={userToken}
              currentUsername={currentUsername}
              handleSignOut={handleSignOut}
              setShowAuthModal={setShowAuthModal}
              setAuthMode={setAuthMode}
              setAuthError={setAuthError}
              formData={formData}
              setFormData={setFormData}
              placeInput={placeInput}
              setPlaceInput={setPlaceInput}
              geocodingLoading={geocodingLoading}
              suggestionsVisible={suggestionsVisible}
              setSuggestionsVisible={setSuggestionsVisible}
              suggestions={suggestions}
              handleSelectSuggestion={handleSelectSuggestion}
              manualLocationOverride={manualLocationOverride}
              setManualLocationOverride={setManualLocationOverride}
              setSelectedTimezoneName={setSelectedTimezoneName}
              loading={loading}
              handleCalculate={handleCalculate}
              profiles={profiles}
              selectedProfileId={selectedProfileId}
              handleSelectProfile={handleSelectProfile}
              chartData={chartData}
              predictions={predictions}
              activeMD={activeMD}
              setActiveMD={setActiveMD}
              selectedVarga={selectedVarga}
              setSelectedVarga={setSelectedVarga}
              chartStyle={chartStyle}
              setChartStyle={setChartStyle}
              queryText={queryText}
              setQueryText={setQueryText}
              queryLoading={queryLoading}
              setQueryLoading={setQueryLoading}
              queryResult={queryResult}
              setQueryResult={setQueryResult}
              queryTimeSpan={queryTimeSpan}
              setQueryTimeSpan={setQueryTimeSpan}
              activeRuleIndex={activeRuleIndex}
              setActiveRuleIndex={setActiveRuleIndex}
              handleQuerySubmit={handleQuerySubmit}
              partnerFormData={partnerFormData}
              setPartnerFormData={setPartnerFormData}
              partnerPlaceInput={partnerPlaceInput}
              setPartnerPlaceInput={setPartnerPlaceInput}
              partnerSuggestions={partnerSuggestions}
              partnerSuggestionsVisible={partnerSuggestionsVisible}
              handleSelectPartnerSuggestion={handleSelectPartnerSuggestion}
              partnerManualOverride={partnerManualOverride}
              setPartnerManualOverride={setPartnerManualOverride}
              partnerGeocodingLoading={partnerGeocodingLoading}
              matchmakingResult={matchmakingResult}
              matchmakingLoading={matchmakingLoading}
              handleMatchmakingSubmit={handleMatchmakingSubmit}
              muhurtaEvent={muhurtaEvent}
              setMuhurtaEvent={setMuhurtaEvent}
              muhurtaStartDate={muhurtaStartDate}
              setMuhurtaStartDate={setMuhurtaStartDate}
              muhurtaLoading={muhurtaLoading}
              muhurtaResults={muhurtaResults}
              handleScanMuhurta={handleScanMuhurta}
              libraryStats={libraryStats}
              fetchLibraryStats={fetchLibraryStats}
              ingestFile={ingestFile}
              setIngestFile={setIngestFile}
              ingestTitle={ingestTitle}
              setIngestTitle={setIngestTitle}
              ingestLoading={ingestLoading}
              ingestStatus={ingestStatus}
              setIngestStatus={setIngestStatus}
              handleBookUpload={handleBookUpload}
              twoFactorEnabled={twoFactorEnabled}
              show2faSetup={show2faSetup}
              setShow2faSetup={setShow2faSetup}
              enrollmentSecret={enrollmentSecret}
              setEnrollmentSecret={setEnrollmentSecret}
              enrollmentQrUri={enrollmentQrUri}
              setEnrollmentQrUri={setEnrollmentQrUri}
              confirmOtpCode={confirmOtpCode}
              setConfirmOtpCode={setConfirmOtpCode}
              authError={authError}
              handleSetup2fa={handleSetup2fa}
              handleConfirmEnable2fa={handleConfirmEnable2fa}
              handleDisable2fa={handleDisable2fa}
            />
          }>
            <Route index element={<Dashboard />} />
            <Route path="query" element={<PredictionsPage />} />
            <Route path="shadbala" element={<ShadbalaPage />} />
            <Route path="matchmaking" element={<MatchmakingPage />} />
            <Route path="muhurta" element={<MuhurtaPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="security" element={<SecurityPage />} />
          </Route>
        </Routes>
      </HashRouter>

      {/* Glassmorphic Auth Modal */}
      {showAuthModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(6, 8, 20, 0.8)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          animation: "fadeIn 0.25s ease-out"
        }}>
          <div className="glass-card gold-border stellar-glow" style={{
            width: "100%",
            maxWidth: "400px",
            padding: "2rem",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 className="card-title gold-accent" style={{ margin: 0, fontSize: "1.4rem" }}>
                {authMode === "login" ? "🔑 Sign In to AstroVeda" : (authMode === "2fa_verify" ? "🛡️ 2FA Verification" : "✨ Create Cosmic Account")}
              </h3>
              <button 
                onClick={() => setShowAuthModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.3rem", cursor: "pointer" }}
              >
                ×
              </button>
            </div>
 
            {authMode === "2fa_verify" ? (
              <form onSubmit={handleOtpVerifySubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
                  🔒 Two-factor authentication is active. Enter the 6-digit verification code from your Authenticator app.
                </p>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Verification Code</label>
                  <input 
                    type="text"
                    maxLength={6}
                    pattern="\d{6}"
                    className="form-input"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 123456"
                    required
                    autoFocus
                    style={{ letterSpacing: "0.25rem", textAlign: "center", fontSize: "1.2rem", fontWeight: "700" }}
                  />
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", cursor: "pointer", color: "var(--text-secondary)" }}>
                  <input 
                    type="checkbox"
                    checked={trustDevice}
                    onChange={e => setTrustDevice(e.target.checked)}
                    style={{ cursor: "pointer" }}
                  />
                  💻 Trust this browser for 30 days
                </label>

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

                <button type="submit" className="btn-primary" disabled={authLoading || otpCode.length !== 6}>
                  {authLoading ? "Verifying..." : "⚡ Verify & Sign In"}
                </button>

                <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
                  <button 
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError("");
                      setOtpCode("");
                    }}
                    style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "0.85rem", textDecoration: "underline", cursor: "pointer" }}
                  >
                    ← Back to Login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Username</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={authForm.username}
                    onChange={e => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter your username"
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Password</label>
                  <input 
                    type="password" 
                    className="form-input"
                    value={authForm.password}
                    onChange={e => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {authMode === "register" && (
                  <div className="form-group" style={{ margin: 0, animation: "fadeIn 0.25s ease-out" }}>
                    <label className="form-label">Confirm Password</label>
                    <input 
                      type="password" 
                      className="form-input"
                      value={authForm.confirmPassword || ""}
                      onChange={e => setAuthForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                )}

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

                <button type="submit" className="btn-primary" disabled={authLoading}>
                  {authLoading ? "Verifying..." : (authMode === "login" ? "Sign In" : "Register Account")}
                </button>

                <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
                  <button 
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === "login" ? "register" : "login");
                      setAuthError("");
                    }}
                    style={{ background: "transparent", border: "none", color: "var(--color-gold)", fontSize: "0.85rem", textDecoration: "underline", cursor: "pointer" }}
                  >
                    {authMode === "login" ? "New here? Register a free account" : "Already have an account? Sign In"}
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center", marginTop: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", width: "100%", gap: "0.5rem" }}>
                    <div style={{ flex: 1, height: "1px", background: "var(--border-glass)" }} />
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>OR SIGN IN WITH</span>
                    <div style={{ flex: 1, height: "1px", background: "var(--border-glass)" }} />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
                    {googleClientId ? (
                      <div id="google-signin-btn" style={{ minHeight: "40px", display: "flex", justifyContent: "center", width: "100%" }} />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleGoogleLoginCallback({ credential: "mock_google_credential_token" })}
                        className="btn-secondary"
                        style={{
                          width: "100%",
                          padding: "0.5rem",
                          fontSize: "0.85rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          color: "#fff",
                          background: "rgba(220, 78, 65, 0.1)",
                          borderColor: "rgba(220, 78, 65, 0.3)"
                        }}
                      >
                        🔴 Sign in with Google
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleLinkedInLogin}
                      className="btn-secondary"
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        color: "#fff",
                        background: "rgba(0, 119, 181, 0.1)",
                        borderColor: "rgba(0, 119, 181, 0.3)"
                      }}
                    >
                      🔵 Sign in with LinkedIn
                    </button>

                    <button
                      type="button"
                      onClick={handleMicrosoftLogin}
                      className="btn-secondary"
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        color: "#fff",
                        background: "rgba(0, 164, 239, 0.1)",
                        borderColor: "rgba(0, 164, 239, 0.3)"
                      }}
                    >
                      ❖ Sign in with Microsoft
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
