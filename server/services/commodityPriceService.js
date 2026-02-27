/**
 * Commodity Price Service
 * Fetches live agricultural commodity prices from data.gov.in
 * API Key: Free registration at https://data.gov.in
 */

const axios = require('axios');

// data.gov.in resource IDs for agricultural data
const RESOURCES = {
  DAILY_PRICES: '9ef84268-d588-465a-a308-a864a43d0070', // Daily market prices
  VARIETY_PRICES: '35985678-0d79-46b4-9ed6-6f13308a1d24' // Commodity variety wise prices
};

const BASE_URL = 'https://api.data.gov.in/resource';

/**
 * Fetch current commodity prices from data.gov.in
 */
async function fetchCommodityPrices(options = {}) {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;

  if (!apiKey) {
    console.log('DATA_GOV_IN_API_KEY not configured');
    return { success: false, message: 'API key not configured', data: [] };
  }

  try {
    const {
      state,
      district,
      commodity,
      limit = 50,
      offset = 0
    } = options;

    const params = {
      'api-key': apiKey,
      format: 'json',
      limit,
      offset
    };

    // Add filters if provided
    const filters = [];
    if (state) filters.push(`state = "${state}"`);
    if (district) filters.push(`district = "${district}"`);
    if (commodity) filters.push(`commodity = "${commodity}"`);

    if (filters.length > 0) {
      params.filters = `[${filters.join(', ')}]`;
    }

    const response = await axios.get(`${BASE_URL}/${RESOURCES.DAILY_PRICES}`, {
      params,
      timeout: 15000
    });

    const records = response.data.records || [];

    return {
      success: true,
      total: response.data.total || records.length,
      count: records.length,
      data: records.map(r => ({
        state: r.state,
        district: r.district,
        market: r.market,
        commodity: r.commodity,
        variety: r.variety,
        grade: r.grade,
        arrivalDate: r.arrival_date,
        minPrice: r.min_price,
        maxPrice: r.max_price,
        modalPrice: r.modal_price
      }))
    };

  } catch (error) {
    console.error('Error fetching commodity prices:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      data: []
    };
  }
}

/**
 * Get unique states with price data
 */
async function getAvailableStates() {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;

  if (!apiKey) {
    return { success: false, data: [] };
  }

  try {
    const response = await axios.get(`${BASE_URL}/${RESOURCES.DAILY_PRICES}`, {
      params: {
        'api-key': apiKey,
        format: 'json',
        limit: 1000
      },
      timeout: 15000
    });

    const states = [...new Set(response.data.records?.map(r => r.state) || [])];

    return {
      success: true,
      data: states.sort()
    };

  } catch (error) {
    console.error('Error fetching states:', error.message);
    return { success: false, data: [] };
  }
}

/**
 * Get prices for a specific commodity across markets
 */
async function getCommodityPriceComparison(commodity, state = null) {
  const options = { commodity, limit: 100 };
  if (state) options.state = state;

  const result = await fetchCommodityPrices(options);

  if (!result.success) return result;

  // Group by market for comparison
  const marketPrices = {};
  result.data.forEach(item => {
    const key = `${item.market}, ${item.district}`;
    if (!marketPrices[key] || item.modalPrice > marketPrices[key].modalPrice) {
      marketPrices[key] = item;
    }
  });

  const sorted = Object.values(marketPrices)
    .sort((a, b) => b.modalPrice - a.modalPrice);

  return {
    success: true,
    commodity,
    state,
    highestPrice: sorted[0],
    lowestPrice: sorted[sorted.length - 1],
    avgPrice: Math.round(sorted.reduce((sum, p) => sum + p.modalPrice, 0) / sorted.length),
    markets: sorted
  };
}

module.exports = {
  fetchCommodityPrices,
  getAvailableStates,
  getCommodityPriceComparison
};
