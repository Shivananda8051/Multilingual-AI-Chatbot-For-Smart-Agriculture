const CropCalendar = require('../models/CropCalendar');
const CropData = require('../models/CropData');
const CropActivity = require('../models/CropActivity');
const cropCalendarService = require('../services/cropCalendarService');

// @desc    Get user's crop calendar entries
// @route   GET /api/crop-calendar
// @access  Private
exports.getCalendarEntries = async (req, res) => {
  try {
    const { status, year, season } = req.query;

    const query = { user: req.user._id };

    if (status) {
      query.status = status;
    }

    if (year) {
      query.year = parseInt(year);
    }

    if (season) {
      query.season = season;
    }

    const entries = await CropCalendar.find(query)
      .populate('crop', 'name localNames category imageUrl')
      .sort({ plannedSowingDate: -1 });

    res.json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (error) {
    console.error('Get calendar entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar entries',
      error: error.message
    });
  }
};

// @desc    Get single calendar entry
// @route   GET /api/crop-calendar/:id
// @access  Private
exports.getCalendarEntry = async (req, res) => {
  try {
    const entry = await CropCalendar.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('crop');

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Calendar entry not found'
      });
    }

    const activities = await CropActivity.find({
      cropCalendar: entry._id
    }).sort({ scheduledDate: 1 });

    res.json({
      success: true,
      data: {
        ...entry.toObject(),
        activities
      }
    });
  } catch (error) {
    console.error('Get calendar entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar entry',
      error: error.message
    });
  }
};

// @desc    Add crop to calendar
// @route   POST /api/crop-calendar
// @access  Private
exports.createCalendarEntry = async (req, res) => {
  try {
    const { cropId, fieldName, fieldArea, plannedSowingDate, notes, color } = req.body;

    const cropData = await CropData.findById(cropId);
    if (!cropData) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    const userState = req.user.location?.state;
    const region = cropCalendarService.determineRegion(userState);
    const seasonInfo = cropData.seasons.find(s => s.region === region) || cropData.seasons[0];

    const sowingDate = new Date(plannedSowingDate);
    const expectedHarvestDate = new Date(sowingDate);
    expectedHarvestDate.setDate(expectedHarvestDate.getDate() + (seasonInfo?.daysToHarvest || 120));

    const entry = await CropCalendar.create({
      user: req.user._id,
      crop: cropId,
      cropName: cropData.name,
      fieldName: fieldName || 'Main Field',
      fieldArea,
      plannedSowingDate: sowingDate,
      expectedHarvestDate,
      season: seasonInfo?.seasonType,
      year: sowingDate.getFullYear(),
      notes,
      color: color || '#4CAF50'
    });

    await cropCalendarService.generateActivities(entry, cropData, seasonInfo);

    await entry.populate('crop', 'name localNames category imageUrl');

    res.status(201).json({
      success: true,
      message: 'Crop added to calendar',
      data: entry
    });
  } catch (error) {
    console.error('Create calendar entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add crop to calendar',
      error: error.message
    });
  }
};

// @desc    Update calendar entry
// @route   PUT /api/crop-calendar/:id
// @access  Private
exports.updateCalendarEntry = async (req, res) => {
  try {
    const { fieldName, fieldArea, notes, actualSowingDate, actualHarvestDate, actualYield, color } = req.body;

    const entry = await CropCalendar.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Calendar entry not found'
      });
    }

    if (fieldName) entry.fieldName = fieldName;
    if (fieldArea) entry.fieldArea = fieldArea;
    if (notes !== undefined) entry.notes = notes;
    if (actualSowingDate) entry.actualSowingDate = new Date(actualSowingDate);
    if (actualHarvestDate) entry.actualHarvestDate = new Date(actualHarvestDate);
    if (actualYield) entry.actualYield = actualYield;
    if (color) entry.color = color;

    await entry.save();
    await entry.populate('crop', 'name localNames category imageUrl');

    res.json({
      success: true,
      message: 'Calendar entry updated',
      data: entry
    });
  } catch (error) {
    console.error('Update calendar entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update calendar entry',
      error: error.message
    });
  }
};

// @desc    Update crop status
// @route   PUT /api/crop-calendar/:id/status
// @access  Private
exports.updateStatus = async (req, res) => {
  try {
    const { status, weatherData } = req.body;

    const entry = await CropCalendar.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Calendar entry not found'
      });
    }

    entry.status = status;

    if (status === 'sowing' && !entry.actualSowingDate) {
      entry.actualSowingDate = new Date();
      if (weatherData) {
        entry.weatherAtPlanting = weatherData;
      }
    }

    if (status === 'completed' && !entry.actualHarvestDate) {
      entry.actualHarvestDate = new Date();
      entry.progressPercentage = 100;
    }

    await entry.save();

    res.json({
      success: true,
      message: 'Status updated',
      data: entry
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

// @desc    Delete calendar entry
// @route   DELETE /api/crop-calendar/:id
// @access  Private
exports.deleteCalendarEntry = async (req, res) => {
  try {
    const entry = await CropCalendar.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Calendar entry not found'
      });
    }

    await CropActivity.deleteMany({ cropCalendar: entry._id });

    res.json({
      success: true,
      message: 'Calendar entry deleted'
    });
  } catch (error) {
    console.error('Delete calendar entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete calendar entry',
      error: error.message
    });
  }
};

// @desc    Get planting recommendations
// @route   GET /api/crop-calendar/recommendations
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    const existingCrops = await CropCalendar.find({
      user: req.user._id,
      status: { $in: ['planned', 'sowing', 'growing', 'flowering', 'harvesting'] }
    }).distinct('cropName');

    const recommendations = await cropCalendarService.getPlantingRecommendations(
      req.user.location,
      targetMonth,
      existingCrops
    );

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: error.message
    });
  }
};

// @desc    Get rotation suggestions
// @route   GET /api/crop-calendar/rotation-suggestions
// @access  Private
exports.getRotationSuggestions = async (req, res) => {
  try {
    const history = await CropCalendar.find({
      user: req.user._id,
      status: 'completed'
    })
      .populate('crop')
      .sort({ actualHarvestDate: -1 })
      .limit(5);

    const suggestions = await cropCalendarService.generateRotationSuggestions(
      history,
      req.user.location?.state
    );

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Get rotation suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rotation suggestions',
      error: error.message
    });
  }
};

// @desc    Get calendar statistics
// @route   GET /api/crop-calendar/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

    const stats = await CropCalendar.aggregate([
      { $match: { user: req.user._id, year } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const activeCrops = await CropCalendar.countDocuments({
      user: req.user._id,
      status: { $in: ['sowing', 'growing', 'flowering', 'harvesting'] }
    });

    const upcomingActivities = await CropActivity.countDocuments({
      user: req.user._id,
      status: 'pending',
      scheduledDate: { $gte: new Date() }
    });

    const overdueActivities = await CropActivity.countDocuments({
      user: req.user._id,
      status: 'overdue'
    });

    res.json({
      success: true,
      data: {
        statusBreakdown: stats,
        activeCrops,
        upcomingActivities,
        overdueActivities,
        year
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};
