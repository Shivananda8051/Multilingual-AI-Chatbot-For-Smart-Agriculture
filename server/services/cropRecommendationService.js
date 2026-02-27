/**
 * Crop Recommendation Service
 * Provides intelligent crop recommendations based on various factors
 */

const axios = require('axios');
const mandiPriceService = require('./mandiPriceService');

// Crop database with growing conditions
const CROP_DATABASE = {
  // Cereals
  rice: {
    name: 'Rice',
    nameHi: 'चावल',
    season: ['kharif'],
    waterRequirement: 'high',
    soilTypes: ['clay', 'loamy', 'alluvial'],
    temperature: { min: 20, max: 35, optimal: 25 },
    rainfall: { min: 1000, max: 2000 },
    growingPeriod: '120-150 days',
    states: ['West Bengal', 'Punjab', 'Uttar Pradesh', 'Andhra Pradesh', 'Tamil Nadu', 'Bihar'],
    profitability: 'medium',
    difficulty: 'medium'
  },
  wheat: {
    name: 'Wheat',
    nameHi: 'गेहूं',
    season: ['rabi'],
    waterRequirement: 'medium',
    soilTypes: ['loamy', 'clay loam', 'alluvial'],
    temperature: { min: 10, max: 25, optimal: 20 },
    rainfall: { min: 400, max: 750 },
    growingPeriod: '120-150 days',
    states: ['Punjab', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan'],
    profitability: 'medium',
    difficulty: 'easy'
  },
  maize: {
    name: 'Maize',
    nameHi: 'मक्का',
    season: ['kharif', 'rabi'],
    waterRequirement: 'medium',
    soilTypes: ['loamy', 'sandy loam', 'alluvial'],
    temperature: { min: 18, max: 32, optimal: 25 },
    rainfall: { min: 500, max: 1000 },
    growingPeriod: '90-120 days',
    states: ['Karnataka', 'Madhya Pradesh', 'Bihar', 'Andhra Pradesh', 'Rajasthan'],
    profitability: 'medium',
    difficulty: 'easy'
  },
  // Pulses
  chickpea: {
    name: 'Chickpea (Chana)',
    nameHi: 'चना',
    season: ['rabi'],
    waterRequirement: 'low',
    soilTypes: ['loamy', 'clay loam', 'black'],
    temperature: { min: 15, max: 30, optimal: 24 },
    rainfall: { min: 400, max: 600 },
    growingPeriod: '90-120 days',
    states: ['Madhya Pradesh', 'Rajasthan', 'Maharashtra', 'Uttar Pradesh', 'Karnataka'],
    profitability: 'high',
    difficulty: 'easy'
  },
  pigeon_pea: {
    name: 'Pigeon Pea (Arhar)',
    nameHi: 'अरहर',
    season: ['kharif'],
    waterRequirement: 'low',
    soilTypes: ['loamy', 'sandy loam', 'red'],
    temperature: { min: 18, max: 35, optimal: 28 },
    rainfall: { min: 600, max: 1000 },
    growingPeriod: '150-180 days',
    states: ['Maharashtra', 'Uttar Pradesh', 'Madhya Pradesh', 'Karnataka', 'Gujarat'],
    profitability: 'high',
    difficulty: 'easy'
  },
  // Oilseeds
  soybean: {
    name: 'Soybean',
    nameHi: 'सोयाबीन',
    season: ['kharif'],
    waterRequirement: 'medium',
    soilTypes: ['loamy', 'clay loam', 'black'],
    temperature: { min: 20, max: 35, optimal: 28 },
    rainfall: { min: 600, max: 1000 },
    growingPeriod: '90-120 days',
    states: ['Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Karnataka'],
    profitability: 'high',
    difficulty: 'medium'
  },
  groundnut: {
    name: 'Groundnut',
    nameHi: 'मूंगफली',
    season: ['kharif', 'rabi'],
    waterRequirement: 'medium',
    soilTypes: ['sandy loam', 'loamy', 'red'],
    temperature: { min: 20, max: 35, optimal: 28 },
    rainfall: { min: 500, max: 750 },
    growingPeriod: '100-130 days',
    states: ['Gujarat', 'Andhra Pradesh', 'Tamil Nadu', 'Karnataka', 'Rajasthan'],
    profitability: 'high',
    difficulty: 'medium'
  },
  mustard: {
    name: 'Mustard',
    nameHi: 'सरसों',
    season: ['rabi'],
    waterRequirement: 'low',
    soilTypes: ['loamy', 'sandy loam', 'alluvial'],
    temperature: { min: 10, max: 25, optimal: 18 },
    rainfall: { min: 250, max: 400 },
    growingPeriod: '110-140 days',
    states: ['Rajasthan', 'Uttar Pradesh', 'Haryana', 'Madhya Pradesh', 'Gujarat'],
    profitability: 'medium',
    difficulty: 'easy'
  },
  // Vegetables
  tomato: {
    name: 'Tomato',
    nameHi: 'टमाटर',
    season: ['kharif', 'rabi', 'summer'],
    waterRequirement: 'medium',
    soilTypes: ['loamy', 'sandy loam', 'red'],
    temperature: { min: 15, max: 30, optimal: 22 },
    rainfall: { min: 400, max: 600 },
    growingPeriod: '90-120 days',
    states: ['Andhra Pradesh', 'Karnataka', 'Madhya Pradesh', 'Odisha', 'Gujarat'],
    profitability: 'high',
    difficulty: 'medium'
  },
  onion: {
    name: 'Onion',
    nameHi: 'प्याज',
    season: ['kharif', 'rabi'],
    waterRequirement: 'medium',
    soilTypes: ['loamy', 'sandy loam', 'alluvial'],
    temperature: { min: 13, max: 30, optimal: 20 },
    rainfall: { min: 350, max: 550 },
    growingPeriod: '120-150 days',
    states: ['Maharashtra', 'Karnataka', 'Madhya Pradesh', 'Gujarat', 'Bihar'],
    profitability: 'high',
    difficulty: 'medium'
  },
  potato: {
    name: 'Potato',
    nameHi: 'आलू',
    season: ['rabi'],
    waterRequirement: 'medium',
    soilTypes: ['sandy loam', 'loamy', 'alluvial'],
    temperature: { min: 15, max: 25, optimal: 20 },
    rainfall: { min: 300, max: 500 },
    growingPeriod: '90-120 days',
    states: ['Uttar Pradesh', 'West Bengal', 'Bihar', 'Gujarat', 'Punjab'],
    profitability: 'high',
    difficulty: 'medium'
  },
  // Cash Crops
  cotton: {
    name: 'Cotton',
    nameHi: 'कपास',
    season: ['kharif'],
    waterRequirement: 'medium',
    soilTypes: ['black', 'loamy', 'alluvial'],
    temperature: { min: 20, max: 40, optimal: 30 },
    rainfall: { min: 500, max: 1000 },
    growingPeriod: '150-180 days',
    states: ['Gujarat', 'Maharashtra', 'Telangana', 'Andhra Pradesh', 'Punjab'],
    profitability: 'high',
    difficulty: 'medium'
  },
  sugarcane: {
    name: 'Sugarcane',
    nameHi: 'गन्ना',
    season: ['kharif'],
    waterRequirement: 'high',
    soilTypes: ['loamy', 'clay loam', 'alluvial'],
    temperature: { min: 20, max: 40, optimal: 30 },
    rainfall: { min: 1000, max: 1500 },
    growingPeriod: '300-365 days',
    states: ['Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat'],
    profitability: 'high',
    difficulty: 'hard'
  }
};

// Season mapping based on month
function getCurrentSeason(month) {
  if (month >= 6 && month <= 9) return 'kharif'; // June - September
  if (month >= 10 || month <= 2) return 'rabi';   // October - February
  return 'summer'; // March - May
}

// Calculate suitability score
function calculateSuitabilityScore(crop, conditions) {
  let score = 0;
  let maxScore = 0;
  const reasons = [];

  // Season match (30 points)
  maxScore += 30;
  if (crop.season.includes(conditions.season)) {
    score += 30;
    reasons.push(`Suitable for ${conditions.season} season`);
  } else {
    reasons.push(`Not ideal for ${conditions.season} season`);
  }

  // Soil type match (25 points)
  maxScore += 25;
  if (conditions.soilType && crop.soilTypes.includes(conditions.soilType.toLowerCase())) {
    score += 25;
    reasons.push(`Grows well in ${conditions.soilType} soil`);
  } else if (conditions.soilType) {
    score += 10; // Partial score
    reasons.push(`Can adapt to ${conditions.soilType} soil`);
  }

  // Water availability (20 points)
  maxScore += 20;
  if (conditions.waterAvailability) {
    const waterMatch = {
      'abundant': ['high', 'medium'],
      'moderate': ['medium', 'low'],
      'scarce': ['low']
    };
    if (waterMatch[conditions.waterAvailability]?.includes(crop.waterRequirement)) {
      score += 20;
      reasons.push(`Water requirement matches availability`);
    } else {
      score += 5;
      reasons.push(`May need irrigation management`);
    }
  }

  // State suitability (15 points)
  maxScore += 15;
  if (conditions.state && crop.states.some(s =>
    s.toLowerCase().includes(conditions.state.toLowerCase()) ||
    conditions.state.toLowerCase().includes(s.toLowerCase())
  )) {
    score += 15;
    reasons.push(`Commonly grown in ${conditions.state}`);
  }

  // Temperature suitability (10 points)
  maxScore += 10;
  if (conditions.temperature) {
    if (conditions.temperature >= crop.temperature.min &&
        conditions.temperature <= crop.temperature.max) {
      score += 10;
      reasons.push(`Temperature is suitable (${crop.temperature.min}-${crop.temperature.max}°C)`);
    } else {
      reasons.push(`Temperature may not be optimal`);
    }
  }

  return {
    score: Math.round((score / maxScore) * 100),
    reasons
  };
}

/**
 * Get crop recommendations based on conditions
 */
async function getRecommendations(conditions) {
  try {
    const {
      soilType,
      state,
      waterAvailability,
      temperature,
      budget,
      landSize,
      experience,
      preferredCrops
    } = conditions;

    // Determine current season
    const currentMonth = new Date().getMonth() + 1;
    const season = conditions.season || getCurrentSeason(currentMonth);

    const recommendations = [];

    // Calculate suitability for each crop
    for (const [key, crop] of Object.entries(CROP_DATABASE)) {
      const suitability = calculateSuitabilityScore(crop, {
        season,
        soilType,
        state,
        waterAvailability,
        temperature
      });

      // Get current market price if available
      let marketData = null;
      try {
        const priceData = await mandiPriceService.getCommodityPrices(crop.name, state);
        if (priceData.records && priceData.records.length > 0) {
          const prices = priceData.records.map(r => r.modalPrice);
          marketData = {
            avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
            marketCount: priceData.records.length
          };
        }
      } catch (err) {
        // Market data not available
      }

      // Adjust score based on experience level
      let adjustedScore = suitability.score;
      if (experience === 'beginner' && crop.difficulty === 'hard') {
        adjustedScore -= 10;
        suitability.reasons.push('Requires more farming experience');
      } else if (experience === 'beginner' && crop.difficulty === 'easy') {
        adjustedScore += 5;
        suitability.reasons.push('Good for beginners');
      }

      recommendations.push({
        id: key,
        name: crop.name,
        nameHi: crop.nameHi,
        score: Math.max(0, Math.min(100, adjustedScore)),
        season: crop.season,
        waterRequirement: crop.waterRequirement,
        growingPeriod: crop.growingPeriod,
        profitability: crop.profitability,
        difficulty: crop.difficulty,
        reasons: suitability.reasons,
        marketData,
        tips: generateTips(crop, conditions)
      });
    }

    // Sort by score (descending)
    recommendations.sort((a, b) => b.score - a.score);

    // Return top recommendations
    return {
      success: true,
      season,
      conditions: {
        soilType,
        state,
        waterAvailability,
        temperature
      },
      recommendations: recommendations.slice(0, 10)
    };

  } catch (error) {
    console.error('Crop recommendation error:', error);
    throw error;
  }
}

/**
 * Generate farming tips for a crop
 */
function generateTips(crop, conditions) {
  const tips = [];

  // Water tips
  if (crop.waterRequirement === 'high') {
    tips.push('Ensure consistent irrigation, especially during flowering');
  } else if (crop.waterRequirement === 'low') {
    tips.push('Avoid overwatering; allow soil to dry between irrigations');
  }

  // Season tips
  if (crop.season.includes('kharif')) {
    tips.push('Sow after first monsoon showers for best results');
  }
  if (crop.season.includes('rabi')) {
    tips.push('Plant after monsoon withdrawal when soil is still moist');
  }

  // Soil tips
  if (crop.soilTypes.includes('black')) {
    tips.push('Black soil retains moisture well; monitor for waterlogging');
  }

  // Profitability tips
  if (crop.profitability === 'high') {
    tips.push('Consider contract farming for guaranteed prices');
  }

  return tips;
}

/**
 * Get profit estimation for a crop
 */
async function getProfitEstimation(cropId, landSize, state) {
  try {
    const crop = CROP_DATABASE[cropId];
    if (!crop) {
      throw new Error('Crop not found');
    }

    // Get current market price
    let avgPrice = 0;
    try {
      const priceData = await mandiPriceService.getCommodityPrices(crop.name, state);
      if (priceData.records && priceData.records.length > 0) {
        const prices = priceData.records.map(r => r.modalPrice);
        avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      }
    } catch (err) {
      // Use default prices
      avgPrice = 2000; // Default Rs/quintal
    }

    // Estimated yields per acre (in quintals)
    const yields = {
      rice: 15,
      wheat: 18,
      maize: 25,
      chickpea: 8,
      pigeon_pea: 6,
      soybean: 10,
      groundnut: 8,
      mustard: 6,
      tomato: 100,
      onion: 80,
      potato: 100,
      cotton: 8,
      sugarcane: 300
    };

    // Estimated costs per acre (in Rs)
    const costs = {
      rice: 25000,
      wheat: 20000,
      maize: 18000,
      chickpea: 15000,
      pigeon_pea: 12000,
      soybean: 18000,
      groundnut: 22000,
      mustard: 15000,
      tomato: 60000,
      onion: 50000,
      potato: 55000,
      cotton: 35000,
      sugarcane: 80000
    };

    const yieldPerAcre = yields[cropId] || 10;
    const costPerAcre = costs[cropId] || 20000;
    const totalYield = yieldPerAcre * landSize;
    const totalCost = costPerAcre * landSize;
    const grossRevenue = totalYield * avgPrice;
    const netProfit = grossRevenue - totalCost;
    const profitMargin = ((netProfit / grossRevenue) * 100).toFixed(1);

    return {
      success: true,
      crop: crop.name,
      landSize,
      estimation: {
        expectedYield: `${totalYield} quintals`,
        yieldPerAcre: `${yieldPerAcre} quintals`,
        currentMarketPrice: `₹${Math.round(avgPrice)}/quintal`,
        grossRevenue: `₹${grossRevenue.toLocaleString()}`,
        estimatedCost: `₹${totalCost.toLocaleString()}`,
        netProfit: `₹${netProfit.toLocaleString()}`,
        profitMargin: `${profitMargin}%`,
        profitable: netProfit > 0
      },
      disclaimer: 'These are estimates based on average conditions. Actual results may vary based on weather, market conditions, and farming practices.'
    };

  } catch (error) {
    console.error('Profit estimation error:', error);
    throw error;
  }
}

/**
 * Get sowing calendar for a region
 */
function getSowingCalendar(state) {
  const calendars = {
    'Punjab': {
      wheat: { sowing: 'Oct 15 - Nov 15', harvesting: 'Apr 1 - Apr 30' },
      rice: { sowing: 'Jun 1 - Jul 15', harvesting: 'Oct 15 - Nov 15' },
      cotton: { sowing: 'Apr 15 - May 15', harvesting: 'Oct - Dec' },
      maize: { sowing: 'Jun 15 - Jul 15', harvesting: 'Sep 15 - Oct 15' }
    },
    'Maharashtra': {
      soybean: { sowing: 'Jun 15 - Jul 15', harvesting: 'Oct 1 - Nov 15' },
      cotton: { sowing: 'Jun 1 - Jul 15', harvesting: 'Nov - Feb' },
      onion: { sowing: 'Oct - Nov (Rabi)', harvesting: 'Feb - Mar' },
      sugarcane: { sowing: 'Jan - Mar', harvesting: 'Dec - Mar (next year)' }
    },
    'Uttar Pradesh': {
      wheat: { sowing: 'Nov 1 - Nov 30', harvesting: 'Mar 15 - Apr 15' },
      rice: { sowing: 'Jun 15 - Jul 15', harvesting: 'Oct - Nov' },
      sugarcane: { sowing: 'Feb - Mar', harvesting: 'Nov - Apr' },
      potato: { sowing: 'Oct 15 - Nov 15', harvesting: 'Jan - Feb' }
    }
  };

  return calendars[state] || {
    message: 'Contact local Krishi Vigyan Kendra for region-specific calendar'
  };
}

/**
 * Get all crops info
 */
function getAllCrops() {
  return Object.entries(CROP_DATABASE).map(([id, crop]) => ({
    id,
    name: crop.name,
    nameHi: crop.nameHi,
    season: crop.season,
    waterRequirement: crop.waterRequirement,
    soilTypes: crop.soilTypes,
    growingPeriod: crop.growingPeriod,
    profitability: crop.profitability,
    difficulty: crop.difficulty,
    states: crop.states
  }));
}

module.exports = {
  getRecommendations,
  getProfitEstimation,
  getSowingCalendar,
  getAllCrops,
  CROP_DATABASE
};
