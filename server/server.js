/**
 * AstroVeda Local Express Server
 * Serves APIs for:
 * - Natal chart calculations and Shodashavargas
 * - Custom predictive synthesis ( natal + divisionals + dashas + book rules )
 * - Muhurta auspicious time planner
 * - Astrological PDF book ingestion
 * - User Profiles & History database
 */

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const { generateBirthChartData } = require("./utils/astroEngine");
const { scanMuhurtas } = require("./utils/muhurtaEngine");
const { ingestBookPDF, loadKnowledgeBase } = require("./utils/ingestionEngine");
const { generatePredictions } = require("./utils/predictionEngine");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ensure data folder and profiles database exist
const DATA_DIR = path.join(__dirname, "data");
const PROFILES_PATH = path.join(DATA_DIR, "profiles_db.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(PROFILES_PATH)) {
  fs.writeFileSync(PROFILES_PATH, JSON.stringify([], null, 2), "utf8");
}

// Multer Setup for PDF Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, `${base}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are supported."));
    }
    cb(null, true);
  }
});

// API Endpoints

// 1. Calculate Birth Chart & Predictions
app.post("/api/calculate-chart", (req, res) => {
  const { name, date, time, latitude, longitude, timezoneOffset, gender } = req.body;

  if (!name || !date || !time || latitude === undefined || longitude === undefined || timezoneOffset === undefined) {
    return res.status(400).json({ error: "Missing required birth details." });
  }

  try {
    // Parse date and time
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);
    const seconds = 0;

    // Calculate birth chart data
    const chartData = generateBirthChartData(
      name, year, month, day, hours, minutes, seconds,
      Number(latitude), Number(longitude), Number(timezoneOffset), gender
    );

    // Generate predictive reports
    const predictionsData = generatePredictions(chartData);

    return res.json({
      success: true,
      chartData,
      predictions: predictionsData
    });
  } catch (err) {
    console.error("Error calculating chart:", err);
    return res.status(500).json({ error: "Failed to process astrological calculations." });
  }
});

// 2. Scan Auspicious Muhurtas
app.post("/api/scan-muhurtas", (req, res) => {
  const { eventType, startDate, latitude, longitude, timezoneOffset } = req.body;

  if (!eventType || !startDate || latitude === undefined || longitude === undefined || timezoneOffset === undefined) {
    return res.status(400).json({ error: "Missing required parameters for Muhurta scan." });
  }

  try {
    const results = scanMuhurtas(
      eventType, startDate,
      Number(latitude), Number(longitude), Number(timezoneOffset)
    );
    return res.json({ success: true, results });
  } catch (err) {
    console.error("Error scanning Muhurtas:", err);
    return res.status(500).json({ error: "Failed to calculate Muhurtas." });
  }
});

// 3. Get Saved Profiles
app.get("/api/profiles", (req, res) => {
  try {
    const raw = fs.readFileSync(PROFILES_PATH, "utf8");
    const profiles = JSON.parse(raw);
    return res.json(profiles);
  } catch (err) {
    console.error("Error reading profiles:", err);
    return res.status(500).json({ error: "Failed to read saved profiles." });
  }
});

// 4. Save User Profile
app.post("/api/profiles/save", (req, res) => {
  const profile = req.body;

  if (!profile.name || !profile.date || !profile.time) {
    return res.status(400).json({ error: "Profile details incomplete." });
  }

  try {
    const raw = fs.readFileSync(PROFILES_PATH, "utf8");
    const profiles = JSON.parse(raw);

    // Give it a unique ID if not present
    if (!profile.id) {
      profile.id = `prof_${Date.now()}`;
    } else {
      // If it exists, update it
      const idx = profiles.findIndex(p => p.id === profile.id);
      if (idx !== -1) {
        profiles[idx] = profile;
        fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2), "utf8");
        return res.json({ success: true, message: "Profile updated successfully.", profile });
      }
    }

    profiles.push(profile);
    fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2), "utf8");
    return res.json({ success: true, message: "Profile saved successfully.", profile });
  } catch (err) {
    console.error("Error saving profile:", err);
    return res.status(500).json({ error: "Failed to save profile." });
  }
});

// 5. Ingest Astrological PDF Book
app.post("/api/ingest-book", upload.single("book"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Please upload a valid PDF book." });
  }

  const customTitle = req.body.title || req.file.originalname;

  try {
    const result = await ingestBookPDF(req.file.path, customTitle);
    
    // Clean up uploaded file once processed to save space
    fs.unlinkSync(req.file.path);

    return res.json(result);
  } catch (err) {
    console.error("Book ingestion failed:", err);
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ error: `Book ingestion failed: ${err.message}` });
  }
});

// 6. Get Ingested Books Metadata & Knowledge status
app.get("/api/ingested-books", (req, res) => {
  try {
    const kb = loadKnowledgeBase();
    return res.json({
      bookMeta: kb.book_meta || [],
      totalRulesInHouses: Object.keys(kb.planets_in_houses || {}).length,
      totalRulesInSigns: Object.keys(kb.planets_in_signs || {}).length,
      totalYogas: Object.keys(kb.yogas || {}).length
    });
  } catch (err) {
    console.error("Error fetching ingested books:", err);
    return res.status(500).json({ error: "Failed to read knowledge statistics." });
  }
});

app.listen(PORT, () => {
  console.log(`AstroVeda server running locally on http://localhost:${PORT}`);
});
