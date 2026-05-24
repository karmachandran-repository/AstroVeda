/**
 * AstroVeda Astronomical & Vedic Astrology Calculation Engine
 * Calculates: Julian Days, Lahiri Ayanamsa, Sidereal Time, Planetary Longitudes,
 * Lagna (Ascendant), 16 Divisional Charts (Shodashavargas), and Vimshottari Dasha.
 */

// Math utilities
const { sin, cos, tan, asin, acos, atan, atan2, PI } = Math;
const D2R = PI / 180;
const R2D = 180 / PI;

// Normalizes an angle to 0 - 360 degrees
function norm360(angle) {
  let a = angle % 360;
  if (a < 0) a += 360;
  return a;
}

// Convert Date, Time, and Timezone to Julian Day
function getJulianDay(year, month, day, hours, minutes, seconds, timezoneOffsetHours) {
  // Convert local time to UTC
  let utcHours = hours - timezoneOffsetHours;
  let utcMinutes = minutes;
  let utcSeconds = seconds;

  // Create Date object in UTC
  let date = new Date(Date.UTC(year, month - 1, day, utcHours, utcMinutes, utcSeconds));
  
  let Y = date.getUTCFullYear();
  let M = date.getUTCMonth() + 1;
  let D = date.getUTCDate();
  let H = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  if (M <= 2) {
    Y -= 1;
    M += 12;
  }

  let A = Math.floor(Y / 100);
  let B = 2 - A + Math.floor(A / 4);
  let JD = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + H / 24 + B - 1524.5;
  return JD;
}

// Calculates Lahiri Ayanamsa for a given Julian Day
// Accurate Lahiri: 23.857092 degrees at J2000.0 (JD 2451545.0)
function getLahiriAyanamsa(jd) {
  const T = (jd - 2451545.0) / 36525;
  // Lahiri ayanamsa formula with secular rate
  return norm360(23.857092 + 1.39697127 * T + 0.0003086 * T * T);
}

// Calculates Obliquity of Ecliptic
function getObliquity(jd) {
  const T = (jd - 2451545.0) / 36525;
  return (23.4392911 - 0.013004166 * T - 0.0000001639 * T * T + 0.0000005036 * T * T * T);
}

// Calculates Sidereal Time at Greenwich and Local Sidereal Time (LST)
function getSiderealTime(jd, longitude) {
  const T = (jd - 2451545.0) / 36525;
  // Greenwich Mean Sidereal Time in degrees
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000;
  gmst = norm360(gmst);
  // Local Sidereal Time in degrees
  const lst = norm360(gmst + longitude);
  return { gmst, lst };
}

// Keplerian orbital elements at J2000.0 and their century rates (JPL 1800-2050 AD)
const PLANET_ELEMENTS = {
  Mercury: {
    a0: 0.38709927,  adot: 0.00000037,
    e0: 0.20563593,  edot: 0.00001906,
    i0: 7.00497902,  idot: -0.00594749,
    L0: 252.25032350, Ldot: 149472.67411175,
    p0: 77.45779628,  pdot: 0.16047689,
    o0: 48.33076593,  odot: -0.12534081
  },
  Venus: {
    a0: 0.72333566,  adot: 0.00000390,
    e0: 0.00677672,  edot: -0.00004107,
    i0: 3.39467605,  idot: -0.00078890,
    L0: 181.97909950, Ldot: 58517.81538729,
    p0: 131.60246718, pdot: 0.00268329,
    o0: 76.67984255,  odot: -0.27769418
  },
  EarthSun: { // Serves as the Earth's orbit, from which we derive the Sun's geocentric position
    a0: 1.00000261,  adot: 0.00000562,
    e0: 0.01671123,  edot: -0.00004392,
    i0: -0.00001531, idot: -0.01294668,
    L0: 100.46457166, Ldot: 35999.37244981,
    p0: 102.93768193, pdot: 0.32327364,
    o0: 0.0,         odot: 0.0
  },
  Mars: {
    a0: 1.52371034,  adot: 0.00001847,
    e0: 0.09339410,  edot: 0.00007882,
    i0: 1.84969142,  idot: -0.00813131,
    L0: -4.55343205,  Ldot: 19140.30268499,
    p0: -23.94362959, pdot: 0.44441088,
    o0: 49.55953891,  odot: -0.29257343
  },
  Jupiter: {
    a0: 5.20288700,  adot: -0.00011607,
    e0: 0.04838624,  edot: -0.00013253,
    i0: 1.30439695,  idot: -0.00183714,
    L0: 34.39644051,  Ldot: 3034.74612775,
    p0: 14.72847983,  pdot: 0.21252668,
    o0: 100.47390909, odot: 0.20469106
  },
  Saturn: {
    a0: 9.53667594,  adot: -0.00125060,
    e0: 0.05386179,  edot: -0.00050991,
    i0: 2.48599187,  idot: 0.00193609,
    L0: 49.95424423,  Ldot: 1222.49362201,
    p0: 92.59887831,  pdot: -0.41897216,
    o0: 113.66242448, odot: -0.28867794
  },
  Uranus: {
    a0: 19.18916464, adot: -0.00196176,
    e0: 0.04725744,  edot: -0.00004397,
    i0: 0.77263783,  idot: -0.00242939,
    L0: 313.23810451, Ldot: 428.48202785,
    p0: 170.95427630, pdot: 0.40805281,
    o0: 74.01692503,  odot: 0.04240589
  },
  Neptune: {
    a0: 30.06992276, adot: 0.00026291,
    e0: 0.00859048,  edot: 0.00005105,
    i0: 1.77004347,  idot: 0.00035372,
    L0: -55.12002969, Ldot: 218.45945325,
    p0: 44.96476227,  pdot: -0.32241464,
    o0: 131.78422574, odot: -0.00508664
  }
};

// Solves Kepler's Equation: E - e*sin(E) = M
function solveKepler(M, e) {
  let Mrad = norm360(M) * D2R;
  let E = Mrad; // Initial guess
  let tol = 1e-7;
  for (let i = 0; i < 200; i++) {
    let dM = Mrad - (E - e * sin(E));
    let dE = dM / (1 - e * cos(E));
    E += dE;
    if (Math.abs(dE) < tol) break;
  }
  return E;
}

// Computes Heliocentric Ecliptic coordinates (x, y, z) for a planet
function getHeliocentricCoords(planetName, jd) {
  const T = (jd - 2451545.0) / 36525;
  const el = PLANET_ELEMENTS[planetName];
  if (!el) return { x: 0, y: 0, z: 0 };

  const a = el.a0 + el.adot * T;
  const e = el.e0 + el.edot * T;
  const i = norm360(el.i0 + el.idot * T) * D2R;
  const L = norm360(el.L0 + el.Ldot * T);
  const p = norm360(el.p0 + el.pdot * T) * D2R;
  const o = norm360(el.o0 + el.odot * T) * D2R;
  const w = p - o; // Argument of perihelion

  // Mean anomaly
  const M = L - norm360(el.p0 + el.pdot * T);
  
  // Solve Kepler's equation
  const E = solveKepler(M, e);

  // Position in orbital plane
  const xp = a * (cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * sin(E);

  // Rotate to J2000 ecliptic plane
  const x = xp * (cos(w) * cos(o) - sin(w) * sin(o) * cos(i)) + yp * (-sin(w) * cos(o) - cos(w) * sin(o) * cos(i));
  const y = xp * (cos(w) * sin(o) + sin(w) * cos(o) * cos(i)) + yp * (-sin(w) * sin(o) + cos(w) * cos(o) * cos(i));
  const z = xp * (sin(w) * sin(i)) + yp * (cos(w) * sin(i));

  return { x, y, z, r: Math.sqrt(x*x + y*y + z*z) };
}

// Compute Geocentric Ecliptic Longitude of Moon using Meeus' simplified model
function getMoonLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;

  // Mean arguments (in degrees)
  const Lprime = norm360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841);
  const D = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868);
  const M = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + T * T * T / 24490000);
  const Mprime = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T * T * T / 69699);
  const F = norm360(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T - T * T * T / 3526000);

  // Convert to radians
  const Dr = D * D2R;
  const Mr = M * D2R;
  const Mprimer = Mprime * D2R;
  const Fr = F * D2R;

  // Trig perturbation terms for Longitude (degrees)
  let dL = 6.289 * sin(Mprimer);
  dL += 1.274 * sin(2 * Dr - Mprimer);
  dL += 0.658 * sin(2 * Dr);
  dL += 0.214 * sin(2 * Mprimer);
  dL -= 0.186 * sin(Mr);
  dL -= 0.114 * sin(2 * Fr);
  dL -= 0.058 * sin(Mprimer - 2 * Dr);
  dL += 0.057 * sin(Mprimer + 2 * Dr);
  dL += 0.053 * sin(Mprimer + Mr);
  dL += 0.046 * sin(2 * Dr - Mr);
  dL += 0.041 * sin(Mprimer - Mr);
  dL -= 0.035 * sin(Dr);
  dL -= 0.016 * sin(2 * Fr + Mprimer);
  dL += 0.015 * sin(2 * Dr - 2 * Fr);
  dL += 0.014 * sin(2 * Dr + Mr);

  const moonLong = norm360(Lprime + dL);
  return moonLong;
}

// Compute Geocentric Ecliptic Longitude of Rahu (Mean Node) and Ketu
function getNodes(jd) {
  const T = (jd - 2451545.0) / 36525;
  const rahu = norm360(125.044522 - 1934.136261 * T + 0.0020754 * T * T + T * T * T / 467441);
  const ketu = norm360(rahu + 180);
  return { rahu, ketu };
}

// Main planetary coordinates function
// Computes Tropical & Sidereal (Lahiri) Geocentric Ecliptic Longitudes
function calculatePlanets(jd) {
  const ayanamsa = getLahiriAyanamsa(jd);

  // Earth heliocentric coordinates (essential to get geocentric Sun)
  const earth = getHeliocentricCoords("EarthSun", jd);

  // 1. Sun (apparent geocentric position is exactly opposite to Earth's heliocentric position)
  const sunLongTrop = norm360(atan2(-earth.y, -earth.x) * R2D);
  const sunLongSid = norm360(sunLongTrop - ayanamsa);

  const planets = {
    Sun: { tropical: sunLongTrop, sidereal: sunLongSid },
    Moon: { tropical: 0, sidereal: 0 } // Computed next
  };

  // 2. Moon
  const moonLongTrop = getMoonLongitude(jd);
  planets.Moon = { tropical: moonLongTrop, sidereal: norm360(moonLongTrop - ayanamsa) };

  // 3. Other planets
  const planetKeys = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];
  planetKeys.forEach(name => {
    const coords = getHeliocentricCoords(name, jd);
    // Geocentric vector = Heliocentric Planet - Heliocentric Earth
    const gx = coords.x - earth.x;
    const gy = coords.y - earth.y;
    
    const trop = norm360(atan2(gy, gx) * R2D);
    planets[name] = {
      tropical: trop,
      sidereal: norm360(trop - ayanamsa)
    };
  });

  // 4. Rahu & Ketu
  const nodes = getNodes(jd);
  planets.Rahu = { tropical: nodes.rahu, sidereal: norm360(nodes.rahu - ayanamsa) };
  planets.Ketu = { tropical: nodes.ketu, sidereal: norm360(nodes.ketu - ayanamsa) };

  return { planets, ayanamsa };
}

// Calculate the Ascendant (Lagna) in degrees
function calculateLagna(jd, latitude, longitude) {
  const { lst } = getSiderealTime(jd, longitude);
  const eps = getObliquity(jd);
  const ayanamsa = getLahiriAyanamsa(jd);

  const lstRad = lst * D2R;
  const epsRad = eps * D2R;
  const latRad = latitude * D2R;

  // standard formulas for ascendant
  let lagnaTrop = atan2(-cos(lstRad), sin(lstRad) * cos(epsRad) + tan(latRad) * sin(epsRad)) * R2D;
  lagnaTrop = norm360(lagnaTrop);
  const lagnaSid = norm360(lagnaTrop - ayanamsa);

  return { tropical: lagnaTrop, sidereal: lagnaSid };
}

// Rashi zodiac signs (Vedic names)
const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

// Returns the sign number (0-11) and degrees inside that sign (0-30)
function getSignDetails(long) {
  const signNum = Math.floor(long / 30) % 12;
  const deg = long % 30;
  return { signNum, signName: ZODIAC_SIGNS[signNum], deg };
}

// Vedic Divisional Charts calculation engine (Shodashavargas)
function calculateDivisionalChart(planetLong, lagnaLong, division) {
  // We use sidereal positions
  const getVargaPlacement = (long) => {
    const signNum = Math.floor(long / 30) % 12;
    const degInSign = long % 30;
    let vargaSign = 0;

    switch (division) {
      case 1: // D1 - Rashi
        vargaSign = signNum;
        break;

      case 2: // D2 - Hora (Divided in 2 parts of 15 deg)
        // Odd signs: 0-15 -> Leo (4), 15-30 -> Cancer (3)
        // Even signs: 0-15 -> Cancer (3), 15-30 -> Leo (4)
        if (signNum % 2 === 0) { // Even sign (Vedic count is 1-indexed, but 0-indexed Aries is odd)
          // 0-indexed: Even numbers (0,2,4,6,8,10) correspond to Aries, Gemini... (Odd in Vedic count!)
          // 0=Aries, 1=Taurus, 2=Gemini...
          // So 0-indexed Even is Odd sign (Aries, Gemini), and 0-indexed Odd is Even sign (Taurus, Cancer).
          // Let's use Vedic standard: 1-indexed Sign = (signNum + 1)
          const vedicSign = signNum + 1;
          const isOdd = (vedicSign % 2 !== 0);
          if (isOdd) {
            vargaSign = (degInSign < 15) ? 4 : 3; // Leo (4) or Cancer (3)
          } else {
            vargaSign = (degInSign < 15) ? 3 : 4; // Cancer (3) or Leo (4)
          }
        } else {
          const vedicSign = signNum + 1;
          const isOdd = (vedicSign % 2 !== 0);
          if (isOdd) {
            vargaSign = (degInSign < 15) ? 4 : 3;
          } else {
            vargaSign = (degInSign < 15) ? 3 : 4;
          }
        }
        break;

      case 3: // D3 - Drekkana (Divided in 3 parts of 10 deg)
        // 0-10: Same sign
        // 10-20: 5th sign
        // 20-30: 9th sign
        if (degInSign < 10) {
          vargaSign = signNum;
        } else if (degInSign < 20) {
          vargaSign = (signNum + 4) % 12;
        } else {
          vargaSign = (signNum + 8) % 12;
        }
        break;

      case 4: // D4 - Chaturthamsa (Divided in 4 parts of 7.5 deg)
        // 1st: Same, 2nd: 4th sign, 3rd: 7th sign, 4th: 10th sign
        const q4 = Math.floor(degInSign / 7.5);
        vargaSign = (signNum + q4 * 3) % 12;
        break;

      case 7: // D7 - Saptamsa (7 parts of 4.2857 deg)
        const q7 = Math.floor(degInSign / (30 / 7));
        const isVedicOddD7 = ((signNum + 1) % 2 !== 0);
        if (isVedicOddD7) {
          vargaSign = (signNum + q7) % 12;
        } else {
          // Starts from 7th sign from signNum
          vargaSign = (signNum + 6 + q7) % 12;
        }
        break;

      case 9: // D9 - Navamsa (9 parts of 3.3333 deg)
        const q9 = Math.floor(degInSign / (30 / 9));
        // Fiery signs (Aries, Leo, Sag) -> start from Aries (0)
        // Earthy signs (Tau, Vir, Cap) -> start from Capricorn (9)
        // Airy signs (Gem, Lib, Aqu) -> start from Libra (6)
        // Watery signs (Can, Sco, Pis) -> start from Cancer (3)
        let startSignD9 = 0;
        const sTypeD9 = signNum % 4; // 0=Aries (Fiery), 1=Taurus (Earthy), 2=Gemini (Airy), 3=Cancer (Watery)
        if (sTypeD9 === 0) startSignD9 = 0; // Aries
        else if (sTypeD9 === 1) startSignD9 = 9; // Capricorn
        else if (sTypeD9 === 2) startSignD9 = 6; // Libra
        else if (sTypeD9 === 3) startSignD9 = 3; // Cancer

        vargaSign = (startSignD9 + q9) % 12;
        break;

      case 10: // D10 - Dasamsa (10 parts of 3 deg)
        const q10 = Math.floor(degInSign / 3.0);
        const isVedicOddD10 = ((signNum + 1) % 2 !== 0);
        if (isVedicOddD10) {
          vargaSign = (signNum + q10) % 12;
        } else {
          // Starts from 9th sign from signNum
          vargaSign = (signNum + 8 + q10) % 12;
        }
        break;

      case 12: // D12 - Dwadasamsa (12 parts of 2.5 deg)
        const q12 = Math.floor(degInSign / 2.5);
        vargaSign = (signNum + q12) % 12;
        break;

      case 16: // D16 - Shodasamsa (16 parts of 1.875 deg)
        const q16 = Math.floor(degInSign / 1.875);
        // Moveable (Aries, Can, Lib, Cap) -> Aries (0)
        // Fixed (Tau, Leo, Sco, Aqu) -> Leo (4)
        // Dual (Gem, Vir, Sag, Pis) -> Sagittarius (8)
        let startD16 = 0;
        const sTypeD16 = signNum % 3; // 0=Moveable (Aries), 1=Fixed (Taurus), 2=Dual (Gemini)
        // Note: 0-Aries (Moveable), 1-Taurus (Fixed), 2-Gemini (Dual), 3-Cancer (Moveable)...
        if (sTypeD16 === 0) startD16 = 0; // Aries
        else if (sTypeD16 === 1) startD16 = 4; // Leo
        else if (sTypeD16 === 2) startD16 = 8; // Sag

        vargaSign = (startD16 + q16) % 12;
        break;

      case 20: // D20 - Vimsamsa (20 parts of 1.5 deg)
        const q20 = Math.floor(degInSign / 1.5);
        // Moveable -> Aries (0)
        // Fixed -> Sagittarius (8)
        // Dual -> Leo (4)
        let startD20 = 0;
        const sTypeD20 = signNum % 3;
        if (sTypeD20 === 0) startD20 = 0; // Aries
        else if (sTypeD20 === 1) startD20 = 8; // Sagittarius
        else if (sTypeD20 === 2) startD20 = 4; // Leo
        vargaSign = (startD20 + q20) % 12;
        break;

      case 24: // D24 - Chaturvimsamsa / Siddhamsa (24 parts of 1.25 deg)
        const q24 = Math.floor(degInSign / 1.25);
        // Odd signs -> starts from Leo (4)
        // Even signs -> starts from Cancer (3)
        const isVedicOddD24 = ((signNum + 1) % 2 !== 0);
        let startD24 = isVedicOddD24 ? 4 : 3;
        vargaSign = (startD24 + q24) % 12;
        break;

      case 27: // D27 - Saptavimsamsa / Nakshatramsa (27 parts of 1.1111 deg)
        const q27 = Math.floor(degInSign / (30 / 27));
        // Fiery -> Aries (0)
        // Earthy -> Cancer (3)
        // Airy -> Libra (6)
        // Watery -> Capricorn (9)
        let startD27 = 0;
        const sTypeD27 = signNum % 4;
        if (sTypeD27 === 0) startD27 = 0;
        else if (sTypeD27 === 1) startD27 = 3;
        else if (sTypeD27 === 2) startD27 = 6;
        else if (sTypeD27 === 3) startD27 = 9;
        vargaSign = (startD27 + q27) % 12;
        break;

      case 30: // D30 - Trimsamsa ( unequal parts )
        // Odd signs:
        // 0-5 -> Aries (0)
        // 5-10 -> Aquarius (10)
        // 10-18 -> Sagittarius (8)
        // 18-25 -> Gemini (2)
        // 25-30 -> Taurus (1)
        // Even signs:
        // 0-5 -> Taurus (1)
        // 5-12 -> Gemini (2)
        // 12-20 -> Sagittarius (8)
        // 20-25 -> Aquarius (10)
        // 25-30 -> Aries (0)
        const isVedicOddD30 = ((signNum + 1) % 2 !== 0);
        if (isVedicOddD30) {
          if (degInSign < 5) vargaSign = 0;
          else if (degInSign < 10) vargaSign = 10;
          else if (degInSign < 18) vargaSign = 8;
          else if (degInSign < 25) vargaSign = 2;
          else vargaSign = 1;
        } else {
          if (degInSign < 5) vargaSign = 1;
          else if (degInSign < 12) vargaSign = 2;
          else if (degInSign < 20) vargaSign = 8;
          else if (degInSign < 25) vargaSign = 10;
          else vargaSign = 0;
        }
        break;

      case 40: // D40 - Khavedamsa (40 parts of 0.75 deg)
        const q40 = Math.floor(degInSign / 0.75);
        // Odd signs -> Aries (0)
        // Even signs -> Libra (6)
        const isVedicOddD40 = ((signNum + 1) % 2 !== 0);
        let startD40 = isVedicOddD40 ? 0 : 6;
        vargaSign = (startD40 + q40) % 12;
        break;

      case 45: // D45 - Akshavedamsa (45 parts of 0.6667 deg)
        const q45 = Math.floor(degInSign / (30 / 45));
        // Moveable -> Aries (0)
        // Fixed -> Leo (4)
        // Dual -> Sagittarius (8)
        let startD45 = 0;
        const sTypeD45 = signNum % 3;
        if (sTypeD45 === 0) startD45 = 0;
        else if (sTypeD45 === 1) startD45 = 4;
        else if (sTypeD45 === 2) startD45 = 8;
        vargaSign = (startD45 + q45) % 12;
        break;

      case 60: // D60 - Shastiamsa (60 parts of 0.5 deg)
        const q60 = Math.floor(degInSign / 0.5);
        vargaSign = (signNum + q60) % 12;
        break;

      default:
        vargaSign = signNum;
    }
    return vargaSign;
  };

  return {
    planetSign: getVargaPlacement(planetLong),
    lagnaSign: getVargaPlacement(lagnaLong)
  };
}

// Standard Nakshatras names and rulers
const NAKSHATRAS = [
  { name: "Ashwini", ruler: "Ketu" },
  { name: "Bharani", ruler: "Venus" },
  { name: "Krittika", ruler: "Sun" },
  { name: "Rohini", ruler: "Moon" },
  { name: "Mrigashira", ruler: "Mars" },
  { name: "Ardra", ruler: "Rahu" },
  { name: "Punarvasu", ruler: "Jupiter" },
  { name: "Pushya", ruler: "Saturn" },
  { name: "Ashlesha", ruler: "Mercury" },
  { name: "Magha", ruler: "Ketu" },
  { name: "Purva Phalguni", ruler: "Venus" },
  { name: "Uttara Phalguni", ruler: "Sun" },
  { name: "Hasta", ruler: "Moon" },
  { name: "Chitra", ruler: "Mars" },
  { name: "Swati", ruler: "Rahu" },
  { name: "Vishakha", ruler: "Jupiter" },
  { name: "Anuradha", ruler: "Saturn" },
  { name: "Jyeshtha", ruler: "Mercury" },
  { name: "Mula", ruler: "Ketu" },
  { name: "Purva Ashadha", ruler: "Venus" },
  { name: "Uttara Ashadha", ruler: "Sun" },
  { name: "Shravana", ruler: "Moon" },
  { name: "Dhanishta", ruler: "Mars" },
  { name: "Shatabhisha", ruler: "Rahu" },
  { name: "Purva Bhadrapada", ruler: "Jupiter" },
  { name: "Uttara Bhadrapada", ruler: "Saturn" },
  { name: "Revati", ruler: "Mercury" }
];

// Returns Nakshatra details based on absolute sidereal longitude
function getNakshatra(long) {
  // A Nakshatra spans exactly 13 degrees 20 minutes (13.333333 degrees)
  const span = 13 + 20 / 60;
  const index = Math.floor(long / span) % 27;
  const remDeg = long % span;
  
  // Calculate Pada (Quarter) - each Pada spans 3 degrees 20 minutes (3.33333 degrees)
  const pada = Math.floor(remDeg / (3 + 20 / 60)) + 1;
  
  return {
    nakshatraNum: index + 1,
    name: NAKSHATRAS[index].name,
    ruler: NAKSHATRAS[index].ruler,
    pada
  };
}

// Calculates the 12 houses based on Lagna (Equal House system - standard in Vedic astrology)
function getHouses(lagnaLong) {
  const lagnaSign = Math.floor(lagnaLong / 30) % 12;
  const houses = [];
  for (let i = 0; i < 12; i++) {
    // House i (0-11, representing 1st to 12th house)
    // In Vedic Equal house, the Lagna sign is the 1st house, next sign is 2nd house...
    const houseSign = (lagnaSign + i) % 12;
    houses.push({
      houseNum: i + 1,
      signNum: houseSign,
      signName: ZODIAC_SIGNS[houseSign]
    });
  }
  return houses;
}

// Maps a planet's sign placement to its house number (1-12)
function getPlanetHouse(planetLong, lagnaLong) {
  const pSign = Math.floor(planetLong / 30) % 12;
  const lSign = Math.floor(lagnaLong / 30) % 12;
  let house = pSign - lSign + 1;
  if (house <= 0) house += 12;
  return house;
}

// Vimshottari Dasha periods in years
const DASHA_PERIODS = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17
};

const DASHA_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];

// Calculates Vimshottari Dasha major (Mahadasha) and minor (Antardasha) periods starting from birth date
function getVimshottariDasha(moonSiderealLong, birthDateObj) {
  // Calculate birth Nakshatra placement
  const nakspan = 13 + 20/60; // 13.3333
  const nakIdx = Math.floor(moonSiderealLong / nakspan) % 27;
  const remDeg = moonSiderealLong % nakspan;
  
  // Starting ruler
  const startingRuler = NAKSHATRAS[nakIdx].ruler;
  const startOrderIdx = DASHA_ORDER.indexOf(startingRuler);

  // Fraction of Nakshatra elapsed
  const fractionElapsed = remDeg / nakspan;
  const totalRulerYears = DASHA_PERIODS[startingRuler];
  
  // Balance of Dasha at birth
  const dashaBalancedYears = totalRulerYears * (1 - fractionElapsed);

  let currentYear = birthDateObj.getFullYear();
  let currentMonth = birthDateObj.getMonth();
  let currentDay = birthDateObj.getDate();

  // Create running calendar dates
  let currentDate = new Date(currentYear, currentMonth, currentDay);
  
  // Setup periods list
  const dashaTimeline = [];
  
  // Start from birth, first dasha balance
  let runningDate = new Date(currentDate.getTime());
  
  // Add first balanced dasha
  let balanceDays = dashaBalancedYears * 365.25;
  runningDate.setTime(runningDate.getTime() + balanceDays * 24 * 60 * 60 * 1000);
  
  dashaTimeline.push({
    planet: startingRuler,
    startDate: new Date(currentDate.getTime()),
    endDate: new Date(runningDate.getTime())
  });

  // Cycle through remaining dashas to populate 120-year cycle
  let orderIdx = (startOrderIdx + 1) % 9;
  for (let i = 0; i < 9; i++) {
    const planet = DASHA_ORDER[orderIdx];
    const durationYears = DASHA_PERIODS[planet];
    
    let prevDate = new Date(runningDate.getTime());
    runningDate.setTime(runningDate.getTime() + durationYears * 365.25 * 24 * 60 * 60 * 1000);
    
    dashaTimeline.push({
      planet,
      startDate: prevDate,
      endDate: new Date(runningDate.getTime())
    });
    
    orderIdx = (orderIdx + 1) % 9;
  }

  // Calculate Antardashas (sub-periods) for each Mahadasha
  dashaTimeline.forEach(md => {
    const mdDurationMs = md.endDate.getTime() - md.startDate.getTime();
    const mdPlanet = md.planet;
    const mdYears = DASHA_PERIODS[mdPlanet];
    
    const antardashas = [];
    let subStartOrder = DASHA_ORDER.indexOf(mdPlanet);
    let subRunningTime = md.startDate.getTime();

    for (let k = 0; k < 9; k++) {
      const subPlanet = DASHA_ORDER[(subStartOrder + k) % 9];
      const subYears = DASHA_PERIODS[subPlanet];
      // Fraction of Mahadasha = subYears / 120
      const subDurationMs = mdDurationMs * (subYears / 120);

      antardashas.push({
        planet: subPlanet,
        startDate: new Date(subRunningTime),
        endDate: new Date(subRunningTime + subDurationMs)
      });
      subRunningTime += subDurationMs;
    }
    
    md.antardashas = antardashas;
  });

  return dashaTimeline;
}

// Compile everything into a comprehensive Vedic Chart Report
function generateBirthChartData(name, year, month, day, hours, minutes, seconds, lat, lon, timezoneOffset, gender) {
  const jd = getJulianDay(year, month, day, hours, minutes, seconds, timezoneOffset);
  const { planets, ayanamsa } = calculatePlanets(jd);
  const lagna = calculateLagna(jd, lat, lon);

  // Add Lagna details
  const rashiPlanets = {
    Lagna: {
      name: "Lagna",
      longitude: lagna.sidereal,
      signDetails: getSignDetails(lagna.sidereal),
      nakshatra: getNakshatra(lagna.sidereal),
      house: 1
    }
  };

  // Populate planetary details
  Object.keys(planets).forEach(pKey => {
    const sidLong = planets[pKey].sidereal;
    rashiPlanets[pKey] = {
      name: pKey,
      longitude: sidLong,
      signDetails: getSignDetails(sidLong),
      nakshatra: getNakshatra(sidLong),
      house: getPlanetHouse(sidLong, lagna.sidereal)
    };
  });

  // Calculate 16 Shodashavargas
  const divisionalCharts = {};
  const vargas = [
    { num: 1, name: "D1 - Rashi (Lagna/Natal)" },
    { num: 2, name: "D2 - Hora (Wealth)" },
    { num: 3, name: "D3 - Drekkana (Siblings/Actions)" },
    { num: 4, name: "D4 - Chaturthamsa (Property/Luck)" },
    { num: 7, name: "D7 - Saptamsa (Children)" },
    { num: 9, name: "D9 - Navamsa (Spouse/Dharma)" },
    { num: 10, name: "D10 - Dasamsa (Career/Profession)" },
    { num: 12, name: "D12 - Dwadasamsa (Parents)" },
    { num: 16, name: "D16 - Shodasamsa (Vehicles/Comforts)" },
    { num: 20, name: "D20 - Vimsamsa (Spirituality/Progress)" },
    { num: 24, name: "D24 - Chaturvimsamsa (Education/Learning)" },
    { num: 27, name: "D27 - Saptavimsamsa (Strengths)" },
    { num: 30, name: "D30 - Trimsamsa (Miseries/Evil)" },
    { num: 40, name: "D40 - Khavedamsa (Auspicious Effects)" },
    { num: 45, name: "D45 - Akshavedamsa (Character/General Well-being)" },
    { num: 60, name: "D60 - Shastiamsa (Past Life/Karma)" }
  ];

  vargas.forEach(v => {
    const chartPlacements = {};
    // Calculate Lagna sign for this varga
    const lDiv = calculateDivisionalChart(lagna.sidereal, lagna.sidereal, v.num);
    chartPlacements.Lagna = {
      name: "Lagna",
      signNum: lDiv.lagnaSign,
      signName: ZODIAC_SIGNS[lDiv.lagnaSign]
    };

    // Calculate planets for this varga
    Object.keys(planets).forEach(pKey => {
      const pDiv = calculateDivisionalChart(planets[pKey].sidereal, lagna.sidereal, v.num);
      chartPlacements[pKey] = {
        name: pKey,
        signNum: pDiv.planetSign,
        signName: ZODIAC_SIGNS[pDiv.planetSign],
        // Compute house number relative to the Lagna of THIS varga
        house: (pDiv.planetSign - lDiv.lagnaSign + 1 <= 0) ? pDiv.planetSign - lDiv.lagnaSign + 1 + 12 : pDiv.planetSign - lDiv.lagnaSign + 1
      };
    });

    divisionalCharts[v.num] = {
      vargaId: v.num,
      name: v.name,
      placements: chartPlacements
    };
  });

  // Calculate Vimshottari Dashas
  const birthDate = new Date(year, month - 1, day);
  const dashas = getVimshottariDasha(planets.Moon.sidereal, birthDate);

  // Panchanga elements
  // 1. Vara (Day of week)
  const dayIndex = birthDate.getDay();
  const VARAS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const vara = VARAS[dayIndex];

  // 2. Nakshatra (based on Moon's position)
  const moonNak = getNakshatra(planets.Moon.sidereal);

  // 3. Tithi (Lunar day, based on angle difference between Moon and Sun)
  // Tithi spans 12 degrees of difference.
  let diff = planets.Moon.sidereal - planets.Sun.sidereal;
  if (diff < 0) diff += 360;
  const tithiNum = Math.floor(diff / 12) + 1;
  // 1-15: Shuklapaksha (Waxing), 16-30: Krishnapaksha (Waning)
  const tithiType = (tithiNum <= 15) ? "Shukla Paksha" : "Krishna Paksha";
  const tithiIndex = (tithiNum <= 15) ? tithiNum : tithiNum - 15;
  const TITHI_NAMES = [
    "Prathama", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shasthi", "Saptami", "Ashtami",
    "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima/Amavasya"
  ];
  const tithiName = TITHI_NAMES[tithiIndex - 1] || ((tithiNum === 30) ? "Amavasya" : "Purnima");

  // 4. Yoga (Sum of Sun and Moon longitude / 13.33333 degrees)
  let yogaSum = norm360(planets.Sun.sidereal + planets.Moon.sidereal);
  const yogaIndex = Math.floor(yogaSum / (13 + 20/60)) % 27;
  const YOGAS = [
    "Vishkumbha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti",
    "Shula", "Ganda", "Vridhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata",
    "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
  ];
  const yoga = YOGAS[yogaIndex];

  // 5. Karana (Half a tithi = 6 degrees difference)
  const karanaNum = Math.floor(diff / 6) + 1;
  const KARANAS = [
    "Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti (Bhadra)", 
    "Shakuni", "Chatushpada", "Naga", "Kintughna"
  ];
  let karanaName = "";
  if (karanaNum === 1) {
    karanaName = "Kintughna"; // First half of 1st tithi
  } else if (karanaNum >= 58) {
    // Fixed Karanas at the end of lunar cycle
    if (karanaNum === 58) karanaName = "Shakuni";
    else if (karanaNum === 59) karanaName = "Chatushpada";
    else karanaName = "Naga";
  } else {
    // 7 repeating karanas
    const repIdx = (karanaNum - 2) % 7;
    karanaName = KARANAS[repIdx];
  }

  const panchanga = {
    vara,
    tithi: `${tithiType} ${tithiName} (Tithi #${tithiNum})`,
    nakshatra: `${moonNak.name} (Pada ${moonNak.pada})`,
    yoga,
    karana: karanaName
  };

  return {
    profile: { name, birthDate, gender, latitude: lat, longitude: lon, timezoneOffset },
    julianDay: jd,
    ayanamsa,
    panchanga,
    rashiPlacements: rashiPlanets,
    divisionalCharts,
    dashas
  };
}

module.exports = {
  getJulianDay,
  calculatePlanets,
  calculateLagna,
  generateBirthChartData,
  ZODIAC_SIGNS
};
