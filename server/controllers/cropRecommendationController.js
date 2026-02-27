const cropRecommendationService = require('../services/cropRecommendationService');

// @desc    Get crop recommendations
// @route   POST /api/crop-recommendation/recommend
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    const { soilType, state, season, waterAvailability, landSize, budget } = req.body;

    if (!soilType || !state || !season || !waterAvailability) {
      return res.status(400).json({
        success: false,
        message: 'Please provide soilType, state, season, and waterAvailability'
      });
    }

    const recommendations = await cropRecommendationService.getRecommendations({
      soilType,
      state,
      season,
      waterAvailability,
      landSize,
      budget
    });

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get crop recommendations'
    });
  }
};

// @desc    Get profit estimation for a crop
// @route   POST /api/crop-recommendation/profit
// @access  Private
exports.getProfitEstimation = async (req, res) => {
  try {
    const { cropName, landSize, state } = req.body;

    if (!cropName || !landSize) {
      return res.status(400).json({
        success: false,
        message: 'Please provide cropName and landSize'
      });
    }

    const estimation = await cropRecommendationService.getProfitEstimation(
      cropName,
      landSize,
      state
    );

    if (!estimation) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found in database'
      });
    }

    res.json({
      success: true,
      data: estimation
    });
  } catch (error) {
    console.error('Get profit estimation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profit estimation'
    });
  }
};

// @desc    Get sowing calendar
// @route   GET /api/crop-recommendation/calendar
// @access  Private
exports.getSowingCalendar = async (req, res) => {
  try {
    const { state } = req.query;
    const calendar = cropRecommendationService.getSowingCalendar(state);

    res.json({
      success: true,
      data: calendar
    });
  } catch (error) {
    console.error('Get sowing calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sowing calendar'
    });
  }
};

// @desc    Get available options (soil types, seasons, etc.)
// @route   GET /api/crop-recommendation/options
// @access  Private
exports.getOptions = async (req, res) => {
  try {
    const options = {
      soilTypes: [
        { value: 'alluvial', label: 'Alluvial Soil' },
        { value: 'black', label: 'Black Soil (Regur)' },
        { value: 'red', label: 'Red Soil' },
        { value: 'laterite', label: 'Laterite Soil' },
        { value: 'sandy', label: 'Sandy Soil' },
        { value: 'clay', label: 'Clay Soil' },
        { value: 'loamy', label: 'Loamy Soil' }
      ],
      seasons: [
        { value: 'kharif', label: 'Kharif (Monsoon - Jun to Oct)' },
        { value: 'rabi', label: 'Rabi (Winter - Oct to Mar)' },
        { value: 'zaid', label: 'Zaid (Summer - Mar to Jun)' }
      ],
      waterAvailability: [
        { value: 'irrigated', label: 'Irrigated (Sufficient water)' },
        { value: 'rainfed', label: 'Rainfed (Dependent on rain)' },
        { value: 'limited', label: 'Limited (Scarce water)' }
      ],
      states: [
        'Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Gujarat', 'Haryana',
        'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
        'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu',
        'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
      ]
    };

    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('Get options error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get options'
    });
  }
};

// @desc    Get all crops info
// @route   GET /api/crop-recommendation/crops
// @access  Private
exports.getAllCrops = async (req, res) => {
  try {
    const crops = cropRecommendationService.getAllCrops();

    res.json({
      success: true,
      data: crops
    });
  } catch (error) {
    console.error('Get all crops error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get crops'
    });
  }
};
