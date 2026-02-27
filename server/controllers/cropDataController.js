const CropData = require('../models/CropData');

// @desc    Get all crops
// @route   GET /api/crop-calendar/crops
// @access  Private
exports.getCrops = async (req, res) => {
  try {
    const { category, search, region } = req.query;

    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'localNames.hi': { $regex: search, $options: 'i' } },
        { 'localNames.ta': { $regex: search, $options: 'i' } },
        { 'localNames.te': { $regex: search, $options: 'i' } },
        { 'localNames.bn': { $regex: search, $options: 'i' } },
        { 'localNames.mr': { $regex: search, $options: 'i' } },
        { 'localNames.gu': { $regex: search, $options: 'i' } },
        { 'localNames.kn': { $regex: search, $options: 'i' } },
        { 'localNames.pa': { $regex: search, $options: 'i' } }
      ];
    }

    if (region) {
      query['seasons.region'] = region;
    }

    const crops = await CropData.find(query)
      .select('name localNames category imageUrl seasons')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: crops.length,
      data: crops
    });
  } catch (error) {
    console.error('Get crops error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch crops',
      error: error.message
    });
  }
};

// @desc    Get single crop details
// @route   GET /api/crop-calendar/crops/:id
// @access  Private
exports.getCrop = async (req, res) => {
  try {
    const crop = await CropData.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    res.json({
      success: true,
      data: crop
    });
  } catch (error) {
    console.error('Get crop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch crop details',
      error: error.message
    });
  }
};

// @desc    Get crop categories
// @route   GET /api/crop-calendar/crops/categories
// @access  Private
exports.getCategories = async (req, res) => {
  try {
    const categories = await CropData.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: categories.map(c => ({ category: c._id, count: c.count }))
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// @desc    Get crops suitable for current season
// @route   GET /api/crop-calendar/crops/seasonal
// @access  Private
exports.getSeasonalCrops = async (req, res) => {
  try {
    const { month, region } = req.query;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetRegion = region || 'north';

    const crops = await CropData.find({
      isActive: true,
      'seasons.region': targetRegion,
      'seasons.sowingStartMonth': { $lte: targetMonth },
      'seasons.sowingEndMonth': { $gte: targetMonth }
    }).select('name localNames category imageUrl seasons');

    const seasonalCrops = crops.map(crop => {
      const seasonInfo = crop.seasons.find(s => s.region === targetRegion);
      return {
        _id: crop._id,
        name: crop.name,
        localNames: crop.localNames,
        category: crop.category,
        imageUrl: crop.imageUrl,
        seasonType: seasonInfo?.seasonType,
        daysToHarvest: seasonInfo?.daysToHarvest,
        sowingEndMonth: seasonInfo?.sowingEndMonth
      };
    });

    res.json({
      success: true,
      count: seasonalCrops.length,
      data: seasonalCrops
    });
  } catch (error) {
    console.error('Get seasonal crops error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seasonal crops',
      error: error.message
    });
  }
};
