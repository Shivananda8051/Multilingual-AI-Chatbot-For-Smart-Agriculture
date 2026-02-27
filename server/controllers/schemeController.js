const Scheme = require('../models/Scheme');
const SchemeApplication = require('../models/SchemeApplication');

// @desc    Get all schemes
// @route   GET /api/schemes
// @access  Private
exports.getSchemes = async (req, res) => {
  try {
    const { category, status, state, search, featured, page = 1, limit = 20 } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['active', 'upcoming'] };
    }

    if (state) {
      query.$or = [
        { 'eligibility.states': { $size: 0 } },
        { 'eligibility.states': state }
      ];
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [schemes, total] = await Promise.all([
      Scheme.find(query)
        .select('name localNames shortDescription category benefits.type benefits.amount benefits.subsidyPercentage status featured timeline.applicationEnd tags')
        .sort({ featured: -1, priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Scheme.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: schemes.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: schemes
    });
  } catch (error) {
    console.error('Get schemes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schemes',
      error: error.message
    });
  }
};

// @desc    Get single scheme
// @route   GET /api/schemes/:id
// @access  Private
exports.getScheme = async (req, res) => {
  try {
    const scheme = await Scheme.findById(req.params.id)
      .populate('relatedSchemes', 'name shortDescription category');

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found'
      });
    }

    res.json({
      success: true,
      data: scheme
    });
  } catch (error) {
    console.error('Get scheme error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheme',
      error: error.message
    });
  }
};

// @desc    Get scheme categories with counts
// @route   GET /api/schemes/categories
// @access  Private
exports.getCategories = async (req, res) => {
  try {
    const categories = await Scheme.aggregate([
      { $match: { status: { $in: ['active', 'upcoming'] } } },
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

// @desc    Check eligibility for a scheme
// @route   POST /api/schemes/:id/check-eligibility
// @access  Private
exports.checkEligibility = async (req, res) => {
  try {
    const scheme = await Scheme.findById(req.params.id);

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found'
      });
    }

    const user = req.user;
    const matchedCriteria = [];
    const unmatchedCriteria = [];
    const warnings = [];
    let score = 0;
    let totalCriteria = 0;

    // Check state eligibility
    if (scheme.eligibility.states && scheme.eligibility.states.length > 0) {
      totalCriteria++;
      if (scheme.eligibility.states.includes(user.location?.state)) {
        matchedCriteria.push('State eligibility');
        score++;
      } else {
        unmatchedCriteria.push(`Scheme is available in: ${scheme.eligibility.states.join(', ')}`);
      }
    }

    // Check farm size
    if (user.farmDetails?.farmSize) {
      const userFarmSize = user.farmDetails.farmSize;

      if (scheme.eligibility.minFarmSize?.value) {
        totalCriteria++;
        if (userFarmSize >= scheme.eligibility.minFarmSize.value) {
          matchedCriteria.push('Minimum farm size requirement');
          score++;
        } else {
          unmatchedCriteria.push(`Minimum farm size: ${scheme.eligibility.minFarmSize.value} ${scheme.eligibility.minFarmSize.unit}`);
        }
      }

      if (scheme.eligibility.maxFarmSize?.value) {
        totalCriteria++;
        if (userFarmSize <= scheme.eligibility.maxFarmSize.value) {
          matchedCriteria.push('Maximum farm size requirement');
          score++;
        } else {
          unmatchedCriteria.push(`Maximum farm size: ${scheme.eligibility.maxFarmSize.value} ${scheme.eligibility.maxFarmSize.unit}`);
        }
      }
    } else if (scheme.eligibility.minFarmSize?.value || scheme.eligibility.maxFarmSize?.value) {
      warnings.push('Please update your farm size in profile for accurate eligibility check');
    }

    // Check farm type
    if (scheme.eligibility.farmTypes && scheme.eligibility.farmTypes.length > 0) {
      totalCriteria++;
      if (user.farmDetails?.farmType && scheme.eligibility.farmTypes.includes(user.farmDetails.farmType)) {
        matchedCriteria.push('Farm type eligibility');
        score++;
      } else if (user.farmDetails?.farmType) {
        unmatchedCriteria.push(`Required farm types: ${scheme.eligibility.farmTypes.join(', ')}`);
      } else {
        warnings.push('Please update your farm type in profile');
      }
    }

    // Check eligible crops
    if (scheme.eligibility.eligibleCrops && scheme.eligibility.eligibleCrops.length > 0) {
      totalCriteria++;
      const userCrops = user.farmDetails?.crops || [];
      const matchingCrops = userCrops.filter(c =>
        scheme.eligibility.eligibleCrops.some(ec => ec.toLowerCase() === c.toLowerCase())
      );

      if (matchingCrops.length > 0) {
        matchedCriteria.push(`Eligible crop: ${matchingCrops.join(', ')}`);
        score++;
      } else if (userCrops.length > 0) {
        warnings.push(`Scheme is for: ${scheme.eligibility.eligibleCrops.slice(0, 5).join(', ')}`);
      }
    }

    const matchScore = totalCriteria > 0 ? Math.round((score / totalCriteria) * 100) : 100;
    const isEligible = unmatchedCriteria.length === 0;

    res.json({
      success: true,
      data: {
        isEligible,
        matchScore,
        matchedCriteria,
        unmatchedCriteria,
        warnings,
        scheme: {
          _id: scheme._id,
          name: scheme.name,
          category: scheme.category
        }
      }
    });
  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check eligibility',
      error: error.message
    });
  }
};

// @desc    Get personalized recommendations
// @route   GET /api/schemes/recommendations
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    const user = req.user;
    const userState = user.location?.state;

    const query = {
      status: 'active'
    };

    if (userState) {
      query.$or = [
        { 'eligibility.states': { $size: 0 } },
        { 'eligibility.states': userState }
      ];
    }

    const schemes = await Scheme.find(query)
      .select('name shortDescription category benefits eligibility tags featured')
      .sort({ featured: -1, priority: -1 })
      .limit(20);

    const recommendations = [];

    for (const scheme of schemes) {
      let score = 50;

      if (scheme.featured) score += 20;

      if (user.farmDetails?.farmType && scheme.eligibility.farmTypes?.includes(user.farmDetails.farmType)) {
        score += 15;
      }

      if (user.farmDetails?.crops?.length && scheme.eligibility.eligibleCrops?.length) {
        const matchingCrops = user.farmDetails.crops.filter(c =>
          scheme.eligibility.eligibleCrops.some(ec => ec.toLowerCase() === c.toLowerCase())
        );
        if (matchingCrops.length > 0) score += 15;
      }

      recommendations.push({
        scheme: {
          _id: scheme._id,
          name: scheme.name,
          shortDescription: scheme.shortDescription,
          category: scheme.category,
          benefits: scheme.benefits
        },
        matchScore: Math.min(100, score),
        reason: score >= 80 ? 'Highly relevant to your profile' :
                score >= 60 ? 'May be suitable for you' : 'General recommendation'
      });
    }

    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      data: recommendations.slice(0, 10)
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message
    });
  }
};

// @desc    Create scheme (Admin)
// @route   POST /api/schemes
// @access  Admin
exports.createScheme = async (req, res) => {
  try {
    const scheme = await Scheme.create({
      ...req.body,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Scheme created successfully',
      data: scheme
    });
  } catch (error) {
    console.error('Create scheme error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create scheme',
      error: error.message
    });
  }
};

// @desc    Update scheme (Admin)
// @route   PUT /api/schemes/:id
// @access  Admin
exports.updateScheme = async (req, res) => {
  try {
    const scheme = await Scheme.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found'
      });
    }

    res.json({
      success: true,
      message: 'Scheme updated successfully',
      data: scheme
    });
  } catch (error) {
    console.error('Update scheme error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scheme',
      error: error.message
    });
  }
};

// @desc    Delete scheme (Admin)
// @route   DELETE /api/schemes/:id
// @access  Admin
exports.deleteScheme = async (req, res) => {
  try {
    const scheme = await Scheme.findByIdAndDelete(req.params.id);

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found'
      });
    }

    res.json({
      success: true,
      message: 'Scheme deleted successfully'
    });
  } catch (error) {
    console.error('Delete scheme error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scheme',
      error: error.message
    });
  }
};

// @desc    Sync schemes from government sources
// @route   POST /api/schemes/sync
// @access  Admin
exports.syncFromGovSources = async (req, res) => {
  try {
    const govSchemeService = require('../services/govSchemeService');

    // Start sync in background
    res.json({
      success: true,
      message: 'Sync started. This may take a few minutes.',
      note: 'Configure DATA_GOV_IN_API_KEY and API_SETU credentials in .env for full functionality'
    });

    // Run sync
    const results = await govSchemeService.syncSchemesFromGovSources();
    console.log('Sync completed:', results);

  } catch (error) {
    console.error('Sync schemes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync schemes',
      error: error.message
    });
  }
};

// @desc    Get official scheme portals
// @route   GET /api/schemes/portals
// @access  Public
exports.getOfficialPortals = async (req, res) => {
  try {
    const govSchemeService = require('../services/govSchemeService');
    const portals = govSchemeService.getOfficialSchemePortals();

    res.json({
      success: true,
      count: portals.length,
      data: portals
    });
  } catch (error) {
    console.error('Get portals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scheme portals',
      error: error.message
    });
  }
};

// @desc    Fetch schemes directly from myScheme.gov.in (real-time)
// @route   GET /api/schemes/live
// @access  Private
exports.getLiveSchemes = async (req, res) => {
  try {
    const govSchemeService = require('../services/govSchemeService');
    const { category = 'Agriculture,Rural & Environment' } = req.query;

    const schemes = await govSchemeService.fetchFromMyScheme(category);

    // Also get official portals
    const portals = govSchemeService.getOfficialSchemePortals();

    res.json({
      success: true,
      count: schemes.length,
      source: 'myscheme.gov.in',
      data: schemes,
      officialPortals: portals
    });
  } catch (error) {
    console.error('Get live schemes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live schemes',
      error: error.message
    });
  }
};

// @desc    Get scheme details from myScheme.gov.in
// @route   GET /api/schemes/live/:slug
// @access  Private
exports.getLiveSchemeDetails = async (req, res) => {
  try {
    const govSchemeService = require('../services/govSchemeService');
    const { slug } = req.params;

    const schemeDetails = await govSchemeService.fetchSchemeDetails(slug);

    if (!schemeDetails) {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found'
      });
    }

    res.json({
      success: true,
      source: 'myscheme.gov.in',
      data: schemeDetails
    });
  } catch (error) {
    console.error('Get live scheme details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheme details',
      error: error.message
    });
  }
};
