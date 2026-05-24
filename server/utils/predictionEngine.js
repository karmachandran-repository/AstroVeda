/**
 * AstroVeda Predictive Analysis Engine
 * Synthesizes planetary positions (D1), Shodashavargas (16 Divisional Charts),
 * Vimshottari Dasha periods, and the ingested Book Knowledge Base to construct
 * highly intelligent, personalized predictions across 6 critical life areas.
 */

const { loadKnowledgeBase } = require("./ingestionEngine");

// Maps planetary rulers to their positive/negative characteristics
const PLANET_NAMES = {
  Sun: "Sun (Soul, Authority, Life Force)",
  Moon: "Moon (Mind, Emotion, Nurturing)",
  Mars: "Mars (Energy, Courage, Action)",
  Mercury: "Mercury (Intellect, Speech, Commerce)",
  Jupiter: "Jupiter (Wisdom, Grace, Expansion)",
  Venus: "Venus (Love, Luxury, Arts)",
  Saturn: "Saturn (Discipline, Karma, Longevity)",
  Rahu: "Rahu (Ambition, Innovation, Obsession)",
  Ketu: "Ketu (Spirituality, Liberation, Intuition)"
};

// Check if a specific planetary yoga is present in the natal chart
function detectYogas(chartData) {
  const yogas = [];
  const rashi = chartData.rashiPlacements;

  // 1. Budhaditya Yoga (Sun and Mercury conjunct in same sign)
  if (rashi.Sun && rashi.Mercury) {
    if (rashi.Sun.signDetails.signNum === rashi.Mercury.signDetails.signNum) {
      yogas.push({
        id: "Budhaditya_Yoga",
        name: "Budhaditya Yoga",
        description: "Formed by the conjunction of Sun and Mercury. It indicates exceptional intelligence, sharp analytical skills, excellent communication, and recognition in professional and academic circles."
      });
    }
  }

  // 2. Gaja Kesari Yoga (Jupiter in an angle (1, 4, 7, 10 house) from Moon)
  if (rashi.Moon && rashi.Jupiter) {
    const moonHouse = rashi.Moon.house;
    const jupHouse = rashi.Jupiter.house;
    let diff = jupHouse - moonHouse + 1;
    if (diff <= 0) diff += 12;
    // Check if Jupiter is 1st, 4th, 7th, or 10th from Moon
    if ([1, 4, 7, 10].includes(diff)) {
      yogas.push({
        id: "Gaja_Kesari_Yoga",
        name: "Gaja Kesari Yoga",
        description: "Formed when Jupiter is in an angular house from the Moon. It brings profound wisdom, wealth, leadership opportunities, high status, protection from adversaries, and stable long-term success."
      });
    }
  }

  // 3. Chandra Mangala Yoga (Moon and Mars conjunct in same sign)
  if (rashi.Moon && rashi.Mars) {
    if (rashi.Moon.signDetails.signNum === rashi.Mars.signDetails.signNum) {
      yogas.push({
        id: "Chandra_Mangala_Yoga",
        name: "Chandra Mangala Yoga",
        description: "Formed by the conjunction of Moon and Mars. It represents a powerful business mind, relentless earning capacity, success in lands or real estate, and a competitive drive for financial growth."
      });
    }
  }

  return yogas;
}

// Find current running Dasha
function getCurrentDasha(dashas, date = new Date()) {
  const time = date.getTime();
  
  // Find matching Mahadasha
  const currentMD = dashas.find(md => {
    return time >= md.startDate.getTime() && time <= md.endDate.getTime();
  });

  if (!currentMD) return { mahadasha: "Unknown", antardasha: "Unknown" };

  // Find matching Antardasha
  const currentAD = currentMD.antardashas.find(ad => {
    return time >= ad.startDate.getTime() && time <= ad.endDate.getTime();
  });

  return {
    mahadasha: currentMD.planet,
    antardasha: currentAD ? currentAD.planet : "Unknown",
    mdEnd: currentMD.endDate.toISOString().split("T")[0],
    adEnd: currentAD ? currentAD.endDate.toISOString().split("T")[0] : ""
  };
}

// Main predictions generator
function generatePredictions(chartData) {
  const kb = loadKnowledgeBase();
  const yogas = detectYogas(chartData);
  const currentDasha = getCurrentDasha(chartData.dashas);
  const rashi = chartData.rashiPlacements;
  const divisions = chartData.divisionalCharts;

  // Helper to fetch rules from DB
  const getRule = (category, key) => {
    const rules = kb[category]?.[key] || [];
    return rules.length > 0 ? rules[Math.floor(Math.random() * rules.length)] : null;
  };

  // Build the prediction for each area
  const predictions = {};

  // ==================== 1. EDUCATION (5th House, D24, Mercury/Jupiter) ====================
  let eduText = "";
  const eduHouseSign = getHouseSign(chartData, 5);
  const mercuryHouse = rashi.Mercury.house;
  const mercurySign = rashi.Mercury.signDetails.signName;
  const mercuryVarga = divisions["24"].placements.Mercury; // D24 placement
  const mercuryVargaHouse = mercuryVarga.house;

  // Get matching ingested rules
  const mercuryHouseRule = getRule("planets_in_houses", `Mercury_${mercuryHouse}`);
  const jup5Rule = rashi.Jupiter.house === 5 ? getRule("planets_in_houses", "Jupiter_5") : null;
  const merc5Rule = rashi.Mercury.house === 5 ? getRule("planets_in_houses", "Mercury_5") : null;

  eduText += `Your academic and intellectual potential is governed by the 5th House of your Natal chart, which falls in the sign of **${eduHouseSign}**. `;
  eduText += `Mercury, the planet of intellect, is placed in your **${mercuryHouse} house** in the sign of **${mercurySign}**. `;
  
  if (merc5Rule) {
    eduText += `\n\n**Classical Theory on your placement:** ${merc5Rule}\n\n`;
  } else if (mercuryHouseRule) {
    eduText += `\n\n**Signification of Mercury Placement:** ${mercuryHouseRule}\n\n`;
  }

  if (jup5Rule) {
    eduText += `Jupiter (the grand preceptor) is placed in your 5th house: ${jup5Rule} `;
  }

  // Analyze D24 (Chaturvimsamsa)
  eduText += `In your **D24 Chaturvimsamsa Chart** (governing education and skill acquisition), Mercury is situated in the **${mercuryVargaHouse} house** in **${mercuryVarga.signName}**. `;
  if (mercuryVargaHouse === 1 || mercuryVargaHouse === 5 || mercuryVargaHouse === 9 || mercuryVargaHouse === 10) {
    eduText += `This strong positioning in a trine or angle in the D24 chart points to high academic capability, deep focus, and successful mastery of professional certifications or advanced higher degrees.`;
  } else {
    eduText += `This placement suggests that your educational journey requires practical skill development and focus, rather than purely theoretical or conventional classrooms. You will find success in specialised technical or logical streams.`;
  }

  // Budhaditya connection
  const budhaditya = yogas.find(y => y.id === "Budhaditya_Yoga");
  if (budhaditya) {
    eduText += `\n\nYour education is profoundly blessed by the **Budhaditya Yoga** present in your horoscope. This conjunction of the Sun and Mercury illuminates your cognitive faculties, granting excellent memory, high academic honors, and strong analytical skills.`;
  }

  predictions.education = {
    title: "Education, Intellect & Learning",
    text: eduText,
    strength: (mercuryHouse === 1 || mercuryHouse === 5 || mercuryHouse === 9 || mercuryHouse === 10 || mercuryHouse === 11) ? "Strong" : "Moderate",
    divisionalChartRef: "D24 Chaturvimsamsa (Intellectual Achievements)"
  };

  // ==================== 2. CAREER (10th House, D10, Saturn/Sun/Rahu) ====================
  let careerText = "";
  const careerHouseSign = getHouseSign(chartData, 10);
  const saturnHouse = rashi.Saturn.house;
  const saturnSign = rashi.Saturn.signDetails.signName;
  const saturnVarga = divisions["10"].placements.Saturn; // D10 Career placement
  const satVargaHouse = saturnVarga.house;

  const saturnHouseRule = getRule("planets_in_houses", `Saturn_${saturnHouse}`);
  const sun10Rule = rashi.Sun.house === 10 ? getRule("planets_in_houses", "Sun_10") : null;
  const rahu10Rule = rashi.Rahu.house === 10 ? getRule("planets_in_houses", "Rahu_10") : null;

  careerText += `Your professional trajectory and social status are defined by the 10th house, which is situated in **${careerHouseSign}** in your Natal chart. `;
  careerText += `Saturn, the significator of profession and karma, resides in the **${saturnHouse} house** in **${saturnSign}**. `;
  
  if (saturnHouseRule) {
    careerText += `\n\n**Classical Signification:** ${saturnHouseRule}\n\n`;
  }

  if (sun10Rule) {
    careerText += `Furthermore, your Sun resides in the 10th house: ${sun10Rule} `;
  }
  if (rahu10Rule) {
    careerText += `Rahu in the 10th house adds unique flair: ${rahu10Rule} `;
  }

  // Analyze D10 (Dasamsa)
  careerText += `Looking deeper into your **D10 Dasamsa Chart** (the key divisional chart for career success), Saturn is situated in the **${satVargaHouse} house** in the sign of **${saturnVarga.signName}**. `;
  if (satVargaHouse === 1 || satVargaHouse === 10 || satVargaHouse === 11) {
    careerText += `This placement is highly supportive, indicating robust career growth, eventual administrative authority, management capability, and a legacy of professional achievements built over time.`;
  } else {
    careerText += `This placement suggests that career progression will occur through hard work, continuous adaptions, and service. Steady perseverance will pay off, with significant breakthroughs arriving after age 30.`;
  }

  // Dasha impact
  if (currentDasha.mahadasha === "Saturn" || currentDasha.mahadasha === "Sun") {
    careerText += `\n\n**Current Planetary Period Impact:** You are currently in the major planetary period (Mahadasha) of **${currentDasha.mahadasha}** (until ${currentDasha.mdEnd}). Since this planet is heavily tied to your professional houses, this is a pivotal time for career actions, structural changes, and seeking leadership advancements.`;
  }

  predictions.career = {
    title: "Career, Status & Profession",
    text: careerText,
    strength: (saturnHouse === 3 || saturnHouse === 6 || saturnHouse === 10 || saturnHouse === 11) ? "High Stability" : "Growth via Effort",
    divisionalChartRef: "D10 Dasamsa (Career & Status)"
  };

  // ==================== 3. FAMILY & MARRIAGE (2nd/7th House, D9, Venus/Jupiter) ====================
  let familyText = "";
  const marriageSign = getHouseSign(chartData, 7);
  const venusHouse = rashi.Venus.house;
  const venusSign = rashi.Venus.signDetails.signName;
  const venusVarga = divisions["9"].placements.Venus; // D9 Navamsa placement
  const venVargaHouse = venusVarga.house;

  const venusHouseRule = getRule("planets_in_houses", `Venus_${venusHouse}`);
  const venus7Rule = rashi.Venus.house === 7 ? getRule("planets_in_houses", "Venus_7") : null;

  familyText += `Your primary partnerships, marriage, and family life are governed by your 7th house, falling in the sign of **${marriageSign}**. `;
  familyText += `Venus, the planet of love and domestic comforts, is located in the **${venusHouse} house** in **${venusSign}**. `;

  if (venus7Rule) {
    familyText += `\n\n**Ingested Theory for your placement:** ${venus7Rule}\n\n`;
  } else if (venusHouseRule) {
    familyText += `\n\n**Venus Signification:** ${venusHouseRule}\n\n`;
  }

  // Analyze D9 (Navamsa)
  familyText += `Examining the **D9 Navamsa Chart** (the primary indicator of marital destiny and spouse's character), Venus is placed in the **${venVargaHouse} house** in **${venusVarga.signName}**. `;
  if (venVargaHouse === 1 || venVargaHouse === 4 || venVargaHouse === 5 || venVargaHouse === 7 || venVargaHouse === 9) {
    familyText += `This highly favorable D9 layout ensures a supportive, loving, and aesthetically-inclined spouse. You will experience mutual growth, shared luxury, and deep harmony in family matters.`;
  } else {
    familyText += `This placement suggests that relationship harmony will require conscious compromises, effective communication, and setting aside personal egos. Mutual respect will create a solid family foundation.`;
  }

  predictions.family = {
    title: "Family Life, Marriage & Partners",
    text: familyText,
    strength: (venusHouse === 2 || venusHouse === 4 || venusHouse === 7 || venusHouse === 9 || venusHouse === 11) ? "Highly Harmonious" : "Requires Balance",
    divisionalChartRef: "D9 Navamsa (Marital Destiny & Spouse)"
  };

  // ==================== 4. FINANCE (2nd/11th House, D2, Jupiter/Venus) ====================
  let financeText = "";
  const wealthSign = getHouseSign(chartData, 2);
  const jupiterHouse = rashi.Jupiter.house;
  const jupiterSign = rashi.Jupiter.signDetails.signName;
  const jupiterVarga = divisions["2"].placements.Jupiter; // D2 Hora placement (Sun or Moon)

  const jupiterHouseRule = getRule("planets_in_houses", `Jupiter_${jupiterHouse}`);
  const moon2Rule = rashi.Moon.house === 2 ? getRule("planets_in_houses", "Moon_2") : null;
  const jup11Rule = rashi.Jupiter.house === 11 ? getRule("planets_in_houses", "Jupiter_11") : null;

  financeText += `Your wealth, assets, and accumulated resources are ruled by the 2nd house of **${wealthSign}** in your natal chart. `;
  financeText += `Jupiter, the significator of gold and finance (Dhana Karaka), is located in the **${jupiterHouse} house** in the sign of **${jupiterSign}**. `;

  if (jup11Rule) {
    financeText += `\n\n**Classical Theory on your placement:** ${jup11Rule}\n\n`;
  } else if (jupiterHouseRule) {
    financeText += `\n\n**Jupiter Placement Signification:** ${jupiterHouseRule}\n\n`;
  }
  if (moon2Rule) {
    financeText += `Additionally, your Moon occupies the 2nd house: ${moon2Rule} `;
  }

  // Analyze D2 (Hora)
  const horaLord = (jupiterVarga.signNum === 4) ? "Sun (Solar/Leo Hora)" : "Moon (Lunar/Cancer Hora)";
  financeText += `In your **D2 Hora Chart** (the exclusive divisional chart for wealth allocation), Jupiter falls in the **${horaLord}**. `;
  if (jupiterVarga.signNum === 4) {
    financeText += `Being in the Solar Hora, wealth is attained through active enterprise, leadership roles, government connections, and personal initiative. You must actively direct your financial plans.`;
  } else {
    financeText += `Being in the Lunar Hora, wealth is built through steady savings, family assets, liquid investments, service-oriented businesses, and intuitive partnerships. Reinvestment is highly favorable.`;
  }

  // Chandra Mangala connection
  const cmYoga = yogas.find(y => y.id === "Chandra_Mangala_Yoga");
  if (cmYoga) {
    financeText += `\n\nYour chart is blessed with **Chandra Mangala Yoga**, indicating excellent financial reflexes, business intelligence, and a natural knack for spotting lucrative properties and asset investments.`;
  }

  predictions.finance = {
    title: "Finance, Wealth & Assets",
    text: financeText,
    strength: (jupiterHouse === 2 || jupiterHouse === 5 || jupiterHouse === 9 || jupiterHouse === 11) ? "Affluent & Stable" : "Steady Accumulation",
    divisionalChartRef: "D2 Hora (Wealth Significations)"
  };

  // ==================== 5. HEALTH (6th/8th House, D30, Saturn/Mars) ====================
  let healthText = "";
  const healthSign = getHouseSign(chartData, 6);
  const marsHouse = rashi.Mars.house;
  const marsSign = rashi.Mars.signDetails.signName;
  const saturnVargaD30 = divisions["30"].placements.Saturn; // D30 placement
  const satVargaD30House = saturnVargaD30.house;

  const mars6Rule = rashi.Mars.house === 6 ? getRule("planets_in_houses", "Mars_6") : null;
  const sat6Rule = rashi.Saturn.house === 6 ? getRule("planets_in_houses", "Saturn_6") : null;

  healthText += `Your daily vitality, biological resistance, and recovery potential are observed from the 6th house, which is situated in **${healthSign}**. `;
  healthText += `Mars, representing immune response and physical energy, is placed in the **${marsHouse} house** in **${marsSign}**. `;

  if (mars6Rule) {
    healthText += `\n\n**Classical Signification:** ${mars6Rule}\n\n`;
  }
  if (sat6Rule) {
    healthText += `Furthermore, Saturn in the 6th house gives unique protections: ${sat6Rule} `;
  }

  // Analyze D30 (Trimsamsa)
  healthText += `Analyzing your **D30 Trimsamsa Chart** (the key divisional chart representing miseries, disease recovery, and structural vulnerabilities), Saturn is placed in the **${satVargaD30House} house** in **${saturnVargaD30.signName}**. `;
  if (satVargaD30House === 6 || satVargaD30House === 8 || satVargaD30House === 12) {
    healthText += `This placement suggests that maintaining health will require a highly disciplined lifestyle, balanced nutrition, and structured sleep patterns. Watch out for joint pain, bone mineral deficiencies, or digestive issues under stress.`;
  } else {
    healthText += `This placement is highly protective, ensuring quick recovery from illnesses, strong biological resistance, and a long, healthy life backed by physical stamina.`;
  }

  predictions.health = {
    title: "Health, Vitality & Well-being",
    text: healthText,
    strength: (marsHouse === 3 || marsHouse === 6 || rashi.Sun.house === 1) ? "Robust Resistance" : "Requires Disciplined Care",
    divisionalChartRef: "D30 Trimsamsa (Miseries & Ill-health)"
  };

  // ==================== 6. LUCK & LUCK PLACEMENT (9th House, D20, Jupiter) ====================
  let luckText = "";
  const luckSign = getHouseSign(chartData, 9);
  const jupHouse = rashi.Jupiter.house;
  const jupSign = rashi.Jupiter.signDetails.signName;
  const jupVargaD20 = divisions["20"].placements.Jupiter; // D20 placement
  const jupVargaD20House = jupVargaD20.house;

  const jupiter9Rule = rashi.Jupiter.house === 9 ? getRule("planets_in_houses", "Jupiter_9") : null;

  luckText += `Your spiritual grace, general fortune, and divine protection (Bhagya) flow from the 9th house, positioned in **${luckSign}** in your Natal chart. `;
  luckText += `Jupiter, the planet of grace and higher wisdom, is placed in the **${jupHouse} house** in the sign of **${jupSign}**. `;

  if (jupiter9Rule) {
    luckText += `\n\n**Classical Text Signification:** ${jupiter9Rule}\n\n`;
  }

  // Analyze D20 (Vimsamsa)
  luckText += `In your **D20 Vimsamsa Chart** (focusing on spiritual growth, meditative progress, and divine blessings), Jupiter is situated in the **${jupVargaD20House} house** in **${jupVargaD20.signName}**. `;
  if (jupVargaD20House === 1 || jupVargaD20House === 5 || jupVargaD20House === 9 || jupVargaD20House === 10) {
    luckText += `This highly spiritual alignment indicates strong ancestral blessings, natural inclination toward philosophy, high moral values, and protection from negative transits. Things will fall into place automatically at the right moment.`;
  } else {
    luckText += `This alignment indicates that your luck is earned through conscious deeds (Karma), charity, and devotion. Practices like mindfulness, service, and yoga will unlock massive positive energy in your life.`;
  }

  predictions.luck = {
    title: "Luck, Fortune & Spirituality",
    text: luckText,
    strength: (jupHouse === 1 || jupHouse === 5 || jupHouse === 9 || jupHouse === 11) ? "Abundant & Protected" : "Acquired through Merits",
    divisionalChartRef: "D20 Vimsamsa (Spiritual Alignment)"
  };

  // Compile full predictions list
  return {
    currentDasha,
    activeYogas: yogas,
    predictionsList: Object.values(predictions)
  };
}

// Maps 1-based house number to the sign name in the natal chart
function getHouseSign(chartData, houseNum) {
  const lagnaSignNum = Math.floor(chartData.rashiPlacements.Lagna.longitude / 30) % 12;
  const houseSignNum = (lagnaSignNum + houseNum - 1) % 12;
  const ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  return ZODIAC_SIGNS[houseSignNum];
}

module.exports = {
  generatePredictions
};
