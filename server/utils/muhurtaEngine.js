/**
 * AstroVeda Muhurta & Panchanga Selection Engine
 * Evaluates upcoming dates to find highly auspicious times (Muhurtas)
 * for events like Marriage, Baby Naming, Starting a Venture, and Groundbreaking.
 */

const { calculatePlanets, getJulianDay, ZODIAC_SIGNS } = require("./astroEngine");

// Helper to check suitability of Nakshatra
const SUITABLE_NAKSHATRAS = {
  marriage: [4, 5, 10, 11, 12, 13, 14, 15, 17, 19, 21, 22, 26, 27], // Rohini, Mriga, Magha, Uttara Phalguni, Hasta, Chitra, Swati, Anuradha, Mula, Uttara Ashadha, Shravana, Dhanishta, Uttara Bhadrapada, Revati
  naming: [1, 4, 5, 7, 8, 11, 12, 13, 14, 15, 17, 21, 22, 23, 24, 26, 27], // Ashwini, Rohini, Mriga, Punarvasu, Pushya, Uttara Phalguni, Hasta, Chitra, Swati, Anuradha, Uttara Ashadha, Shravana, Dhanishta, Shatabhisha, Uttara Bhadrapada, Revati
  venture: [1, 4, 5, 7, 8, 11, 12, 13, 14, 17, 21, 22, 23, 27], // Ashwini, Rohini, Mriga, Punarvasu, Pushya, Uttara Phalguni, Hasta, Chitra, Anuradha, Uttara Ashadha, Shravana, Dhanishta, Revati
  groundbreaking: [4, 5, 12, 14, 17, 21, 23, 24, 26] // Rohini, Mrigashira, Uttara Phalguni, Chitra, Anuradha, Uttara Ashadha, Dhanishta, Shatabhisha, Uttara Bhadrapada
};

// Inauspicious Yogas to avoid
const INAUSPICIOUS_YOGAS = [
  "Vishkumbha", "Atiganda", "Shula", "Ganda", "Vyaghata", "Vajra", "Vyatipata", "Parigha", "Vaidhriti"
];

// Inauspicious Karanas to avoid
const INAUSPICIOUS_KARANAS = [
  "Vishti (Bhadra)"
];

// Inauspicious Rikta Tithis to avoid
const RIKTA_TITHIS = [4, 9, 14, 19, 24, 29]; // Chaturthi, Navami, Chaturdashi of both pakshas

// Maps 1-indexed day of week (Sunday=0, Monday=1...) to suitability for each event
const VARA_SUITABILITY = {
  marriage: { 0: 0.5, 1: 0.9, 2: 0.2, 3: 0.8, 4: 0.9, 5: 0.9, 6: 0.3 }, // Favor Mon, Wed, Thu, Fri
  naming: { 0: 0.7, 1: 0.9, 2: 0.2, 3: 0.9, 4: 1.0, 5: 0.9, 6: 0.4 }, // Favor Mon, Wed, Thu, Fri
  venture: { 0: 0.9, 1: 0.9, 2: 0.3, 3: 0.9, 4: 1.0, 5: 0.9, 6: 0.5 }, // Sunday, Mon, Wed, Thu, Fri are great
  groundbreaking: { 0: 0.4, 1: 0.9, 2: 0.1, 3: 0.9, 4: 1.0, 5: 0.9, 6: 0.2 } // Mon, Wed, Thu, Fri
};

// Main Nakshatras list
const NAKSHATRAS_LIST = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
  "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

// Main Yogas list
const YOGAS_LIST = [
  "Vishkumbha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti",
  "Shula", "Ganda", "Vridhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata",
  "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
];

const TITHI_NAMES = [
  "Prathama (1)", "Dwitiya (2)", "Tritiya (3)", "Chaturthi (4)", "Panchami (5)", "Shasthi (6)", "Saptami (7)", "Ashtami (8)",
  "Navami (9)", "Dashami (10)", "Ekadashi (11)", "Dwadashi (12)", "Trayodashi (13)", "Chaturdashi (14)", "Purnima (15)"
];

function calculateDayPanchanga(dateObj, lat, lon, tzOffset) {
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  // Standardize to noon birth (12:00:00 PM) for daily Panchanga calculations
  const jd = getJulianDay(year, month, day, 12, 0, 0, tzOffset);

  const { planets } = calculatePlanets(jd);

  // 1. Vara (Day of week)
  const dayOfWeek = dateObj.getDay(); // 0=Sunday, 1=Monday...
  const VARAS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const vara = VARAS[dayOfWeek];

  // 2. Nakshatra (based on Moon's position)
  const moonSidLong = planets.Moon.sidereal;
  const nakspan = 13.333333; // 13 deg 20 min
  const nakIndex = Math.floor(moonSidLong / nakspan) % 27;
  const nakName = NAKSHATRAS_LIST[nakIndex];
  const nakNum = nakIndex + 1;

  // 3. Tithi (based on Moon-Sun angle difference)
  let diff = planets.Moon.sidereal - planets.Sun.sidereal;
  if (diff < 0) diff += 360;
  const tithiNum = Math.floor(diff / 12) + 1;
  const tithiType = (tithiNum <= 15) ? "Shukla Paksha" : "Krishna Paksha";
  const tithiIdx = (tithiNum <= 15) ? tithiNum : tithiNum - 15;
  const tithiName = (tithiNum === 30) ? "Amavasya" : (tithiNum === 15 ? "Purnima" : TITHI_NAMES[tithiIdx - 1]);

  // 4. Yoga (Sum of Sun and Moon longitude)
  const yogaSum = (planets.Sun.sidereal + planets.Moon.sidereal) % 360;
  const yogaIndex = Math.floor(yogaSum / nakspan) % 27;
  const yoga = YOGAS_LIST[yogaIndex];

  // 5. Karana
  const karanaNum = Math.floor(diff / 6) + 1;
  const KARANAS = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti (Bhadra)", "Shakuni", "Chatushpada", "Naga", "Kintughna"];
  let karana = "";
  if (karanaNum === 1) karana = "Kintughna";
  else if (karanaNum >= 58) {
    if (karanaNum === 58) karana = "Shakuni";
    else if (karanaNum === 59) karana = "Chatushpada";
    else karana = "Naga";
  } else {
    karana = KARANAS[(karanaNum - 2) % 7];
  }

  return {
    date: dateObj,
    dayOfWeek,
    vara,
    nakshatraNum: nakNum,
    nakshatraName: nakName,
    tithiNum,
    tithiName: `${tithiType} ${tithiName}`,
    yoga,
    karana
  };
}

/**
 * Scans a 30-day window starting from startCalendarDate and computes Muhurta scores
 * for the selected life event.
 */
function scanMuhurtas(eventType, startCalendarDate, lat, lon, tzOffset) {
  const results = [];
  const start = new Date(startCalendarDate);

  // Scan next 30 days
  for (let i = 0; i < 30; i++) {
    const scanDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const pan = calculateDayPanchanga(scanDate, lat, lon, tzOffset);

    // Compute Muhurta suitability score (out of 100)
    let score = 50; // Starting baseline
    const reasons = [];
    const warnings = [];

    // 1. Evaluate Vara (Day of the Week)
    const varaWeight = VARA_SUITABILITY[eventType]?.[pan.dayOfWeek] ?? 0.5;
    score += (varaWeight - 0.5) * 30; // Vara shifts score by up to +/- 15 points
    if (varaWeight >= 0.9) {
      reasons.push(`${pan.vara} is an excellent day of the week for this event.`);
    } else if (varaWeight <= 0.3) {
      warnings.push(`${pan.vara} is generally considered inauspicious or weak for starting this event.`);
    }

    // 2. Evaluate Nakshatra
    const isNakSuitable = SUITABLE_NAKSHATRAS[eventType]?.includes(pan.nakshatraNum) ?? false;
    if (isNakSuitable) {
      score += 25;
      reasons.push(`Nakshatra ${pan.nakshatraName} is highly compatible and auspicious for this action.`);
    } else {
      score -= 20;
      warnings.push(`Nakshatra ${pan.nakshatraName} is not classical or supportive for this activity.`);
    }

    // 3. Evaluate Tithi
    const isRikta = RIKTA_TITHIS.includes(pan.tithiNum);
    const isAmavasya = (pan.tithiNum === 30);
    const isAuspiciousTithi = [2, 3, 5, 7, 10, 11, 12, 13, 15].includes(pan.tithiNum % 15 || 15);

    if (isRikta) {
      score -= 25;
      warnings.push(`Avoided Rikta Tithi (empty day) of ${pan.tithiName}.`);
    } else if (isAmavasya) {
      score -= 30;
      warnings.push(`Amavasya (No Moon) is avoided for constructive, auspicious events.`);
    } else if (isAuspiciousTithi) {
      score += 15;
      reasons.push(`${pan.tithiName} is a highly favorable and productive lunar phase.`);
    }

    // 4. Evaluate Yoga
    const isYogaBad = INAUSPICIOUS_YOGAS.includes(pan.yoga);
    if (isYogaBad) {
      score -= 15;
      warnings.push(`Avoid inauspicious astrological combination: ${pan.yoga} Yoga.`);
    } else {
      score += 5;
    }

    // 5. Evaluate Karana
    const isKaranaBad = INAUSPICIOUS_KARANAS.includes(pan.karana);
    if (isKaranaBad) {
      score -= 20;
      warnings.push(`Bhadra/Vishti Karana is active, which is avoided for starting auspicious tasks.`);
    } else {
      score += 5;
    }

    // Normalise score between 0 and 100
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Categorise suitability
    let suitability = "Average";
    if (score >= 80) suitability = "Excellent (Highly Auspicious)";
    else if (score >= 65) suitability = "Good (Favorable)";
    else if (score < 45) suitability = "Unfavorable (Avoid)";

    results.push({
      dateString: scanDate.toISOString().split("T")[0],
      panchanga: pan,
      score,
      suitability,
      reasons,
      warnings
    });
  }

  // Sort by score descending (so best options appear first)
  return results.sort((a, b) => b.score - a.score);
}

module.exports = {
  scanMuhurtas,
  calculateDayPanchanga
};
