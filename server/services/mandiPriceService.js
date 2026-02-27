/**
 * Mandi Price Service
 * Fetches current daily prices of agricultural commodities from various markets
 * Source: data.gov.in - Open Government Data Platform
 * API: Current Daily Price of Various Commodities from Various Markets (Mandi)
 */

const axios = require('axios');

// API Configuration
const MANDI_API = {
  BASE_URL: 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
  // Sample key (limited to 10 records) - replace with your own key for production
  SAMPLE_KEY: '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b'
};

/**
 * Get API key - uses environment variable or falls back to sample key
 */
function getApiKey() {
  return process.env.DATA_GOV_IN_API_KEY || MANDI_API.SAMPLE_KEY;
}

/**
 * Fetch mandi prices with filters
 * @param {Object} options - Filter options
 * @param {string} options.state - Filter by state
 * @param {string} options.district - Filter by district
 * @param {string} options.market - Filter by market name
 * @param {string} options.commodity - Filter by commodity
 * @param {string} options.variety - Filter by variety
 * @param {number} options.limit - Max records to return (default 100)
 * @param {number} options.offset - Records to skip for pagination
 */
async function getMandiPrices(options = {}) {
  try {
    const params = {
      'api-key': getApiKey(),
      format: 'json',
      limit: options.limit || 100,
      offset: options.offset || 0
    };

    // Add filters if provided
    if (options.state) {
      params['filters[state.keyword]'] = options.state;
    }
    if (options.district) {
      params['filters[district]'] = options.district;
    }
    if (options.market) {
      params['filters[market]'] = options.market;
    }
    if (options.commodity) {
      params['filters[commodity]'] = options.commodity;
    }
    if (options.variety) {
      params['filters[variety]'] = options.variety;
    }
    if (options.grade) {
      params['filters[grade]'] = options.grade;
    }

    const response = await axios.get(MANDI_API.BASE_URL, {
      params,
      timeout: 15000
    });

    if (response.data && response.data.records) {
      return {
        success: true,
        total: response.data.total,
        count: response.data.count,
        records: response.data.records.map(record => ({
          state: record.state,
          district: record.district,
          market: record.market,
          commodity: record.commodity,
          variety: record.variety,
          grade: record.grade,
          arrivalDate: record.arrival_date,
          minPrice: parseFloat(record.min_price) || 0,
          maxPrice: parseFloat(record.max_price) || 0,
          modalPrice: parseFloat(record.modal_price) || 0,
          priceUnit: 'per Quintal (100 kg)'
        }))
      };
    }

    return {
      success: true,
      total: 0,
      count: 0,
      records: []
    };

  } catch (error) {
    console.error('Error fetching mandi prices:', error.message);

    if (error.response?.status === 403) {
      throw new Error('API key invalid or rate limit exceeded. Please check your DATA_GOV_IN_API_KEY.');
    }

    throw error;
  }
}

/**
 * Get prices for a specific commodity across all markets
 */
async function getCommodityPrices(commodity, state = null) {
  const options = { commodity, limit: 100 };
  if (state) options.state = state;

  return getMandiPrices(options);
}

/**
 * Get prices from a specific market
 */
async function getMarketPrices(market, state = null) {
  const options = { market, limit: 100 };
  if (state) options.state = state;

  return getMandiPrices(options);
}

/**
 * Get prices by state
 */
async function getStatePrices(state, limit = 100) {
  return getMandiPrices({ state, limit });
}

/**
 * Get available states (from sample data)
 */
async function getAvailableStates() {
  try {
    // Fetch a sample to get unique states
    const result = await getMandiPrices({ limit: 1000 });

    if (result.success && result.records.length > 0) {
      const states = [...new Set(result.records.map(r => r.state))].sort();
      return { success: true, states };
    }

    // Return common states as fallback
    return {
      success: true,
      states: [
        'Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Gujarat', 'Haryana',
        'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
        'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu',
        'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
      ]
    };
  } catch (error) {
    console.error('Error fetching states:', error.message);
    throw error;
  }
}

/**
 * Get price comparison for a commodity across different markets
 */
async function getPriceComparison(commodity, state = null) {
  try {
    const result = await getCommodityPrices(commodity, state);

    if (!result.success || result.records.length === 0) {
      return { success: true, comparison: [] };
    }

    // Group by market and calculate statistics
    const marketPrices = {};

    for (const record of result.records) {
      const key = `${record.market}-${record.district}`;
      if (!marketPrices[key]) {
        marketPrices[key] = {
          market: record.market,
          district: record.district,
          state: record.state,
          prices: []
        };
      }
      marketPrices[key].prices.push(record.modalPrice);
    }

    const comparison = Object.values(marketPrices).map(mp => ({
      market: mp.market,
      district: mp.district,
      state: mp.state,
      avgPrice: Math.round(mp.prices.reduce((a, b) => a + b, 0) / mp.prices.length),
      minPrice: Math.min(...mp.prices),
      maxPrice: Math.max(...mp.prices)
    }));

    // Sort by average price (highest first)
    comparison.sort((a, b) => b.avgPrice - a.avgPrice);

    return {
      success: true,
      commodity,
      comparison,
      bestMarket: comparison[0],
      lowestMarket: comparison[comparison.length - 1]
    };
  } catch (error) {
    console.error('Error getting price comparison:', error.message);
    throw error;
  }
}

/**
 * Get trending commodities (most traded based on available data)
 */
async function getTrendingCommodities(state = null) {
  try {
    const options = { limit: 500 };
    if (state) options.state = state;

    const result = await getMandiPrices(options);

    if (!result.success || result.records.length === 0) {
      return { success: true, trending: [] };
    }

    // Count commodity occurrences
    const commodityCounts = {};

    for (const record of result.records) {
      if (!commodityCounts[record.commodity]) {
        commodityCounts[record.commodity] = {
          commodity: record.commodity,
          count: 0,
          avgPrice: 0,
          prices: []
        };
      }
      commodityCounts[record.commodity].count++;
      commodityCounts[record.commodity].prices.push(record.modalPrice);
    }

    // Calculate averages and sort by count
    const trending = Object.values(commodityCounts)
      .map(c => ({
        commodity: c.commodity,
        marketCount: c.count,
        avgPrice: Math.round(c.prices.reduce((a, b) => a + b, 0) / c.prices.length)
      }))
      .sort((a, b) => b.marketCount - a.marketCount)
      .slice(0, 20);

    return { success: true, trending };
  } catch (error) {
    console.error('Error getting trending commodities:', error.message);
    throw error;
  }
}

/**
 * Get list of common commodities
 */
function getCommodityList() {
  return [
    'Wheat', 'Rice', 'Maize', 'Bajra', 'Jowar', 'Barley', 'Ragi',
    'Arhar', 'Moong', 'Urad', 'Masoor', 'Chana', 'Groundnut',
    'Soyabean', 'Mustard', 'Sunflower', 'Cotton', 'Sugarcane',
    'Potato', 'Onion', 'Tomato', 'Brinjal', 'Cabbage', 'Cauliflower',
    'Capsicum', 'Green Chilli', 'Garlic', 'Ginger', 'Turmeric',
    'Coriander', 'Cumin', 'Apple', 'Banana', 'Mango', 'Orange', 'Grapes'
  ];
}

/**
 * Alias for getTrendingCommodities (for backward compatibility)
 */
async function getTrendingCrops(state = null) {
  return getTrendingCommodities(state);
}

/**
 * Get list of Indian states (sync function for dropdown options)
 */
function getStateList() {
  return [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];
}

module.exports = {
  getMandiPrices,
  getCommodityPrices,
  getMarketPrices,
  getStatePrices,
  getAvailableStates,
  getPriceComparison,
  getTrendingCommodities,
  getTrendingCrops,
  getCommodityList,
  getStateList,
  MANDI_API
};
