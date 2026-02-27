const Listing = require('../models/Listing');
const User = require('../models/User');
const mandiPriceService = require('../services/mandiPriceService');
const notificationService = require('../services/notificationService');
const translationService = require('../services/translationService');

const getUserLanguage = async (req) => {
  return req.query.language || req.body.language || req.user?.preferredLanguage || 'en';
};

// @desc    Get all listings with filters
// @route   GET /api/marketplace/listings
exports.getListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      type,
      state,
      city,
      cropName,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { status: 'active', expiresAt: { $gt: new Date() } };

    if (category) query.category = category;
    if (type) query.type = type;
    if (state) query['location.state'] = new RegExp(state, 'i');
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (cropName) query['cropDetails.cropName'] = new RegExp(cropName, 'i');

    if (minPrice || maxPrice) {
      query['price.amount'] = {};
      if (minPrice) query['price.amount'].$gte = parseFloat(minPrice);
      if (maxPrice) query['price.amount'].$lte = parseFloat(maxPrice);
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const listings = await Listing.find(query)
      .populate('seller', 'name avatar phone location')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Listing.countDocuments(query);

    res.status(200).json({
      success: true,
      listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listings'
    });
  }
};

// @desc    Get single listing
// @route   GET /api/marketplace/listings/:id
exports.getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name avatar phone location bio cropsGrown');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    listing.views += 1;
    await listing.save();

    const isSaved = req.user ? listing.savedBy.includes(req.user._id) : false;

    res.status(200).json({
      success: true,
      listing: {
        ...listing.toObject(),
        isSaved
      }
    });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listing'
    });
  }
};

// @desc    Create a new listing
// @route   POST /api/marketplace/listings
exports.createListing = async (req, res) => {
  try {
    const {
      type,
      category,
      title,
      description,
      cropDetails,
      quantity,
      price,
      contactPreferences,
      customLocation
    } = req.body;

    const userLang = await getUserLanguage(req);

    let englishTitle = title;
    let englishDescription = description;

    if (userLang !== 'en') {
      try {
        const titleTranslation = await translationService.translateToEnglish(title, userLang);
        englishTitle = titleTranslation.translatedText;

        if (description) {
          const descTranslation = await translationService.translateToEnglish(description, userLang);
          englishDescription = descTranslation.translatedText;
        }
      } catch (translationError) {
        console.log('Translation skipped:', translationError.message);
      }
    }

    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        images.push({
          url: `/uploads/${file.filename}`,
          thumbnail: `/uploads/${file.filename}`
        });
      });
    }

    const location = customLocation ? JSON.parse(customLocation) : {
      city: req.user.location?.city,
      state: req.user.location?.state,
      pincode: req.user.location?.pincode,
      coordinates: req.user.location?.coordinates
    };

    let mandiPriceRef = null;
    if (category === 'crops' && cropDetails?.cropName && location.state) {
      try {
        const parsedCropDetails = typeof cropDetails === 'string' ? JSON.parse(cropDetails) : cropDetails;
        const mandiPrices = await mandiPriceService.getMandiPrices(
          parsedCropDetails.cropName,
          location.state,
          location.city
        );
        if (mandiPrices.length > 0) {
          const nearest = mandiPrices[0];
          mandiPriceRef = {
            market: nearest.market,
            modalPrice: nearest.modalPrice,
            minPrice: nearest.minPrice,
            maxPrice: nearest.maxPrice,
            fetchedAt: new Date()
          };
        }
      } catch (error) {
        console.log('Mandi price fetch skipped:', error.message);
      }
    }

    const listing = await Listing.create({
      seller: req.user._id,
      type,
      category,
      title: englishTitle,
      description: englishDescription,
      cropDetails: typeof cropDetails === 'string' ? JSON.parse(cropDetails) : cropDetails,
      quantity: typeof quantity === 'string' ? JSON.parse(quantity) : quantity,
      price: typeof price === 'string' ? JSON.parse(price) : price,
      images,
      location,
      contactPreferences: contactPreferences ?
        (typeof contactPreferences === 'string' ? JSON.parse(contactPreferences) : contactPreferences) : {},
      mandiPriceRef,
      language: userLang
    });

    await listing.populate('seller', 'name avatar phone location');

    res.status(201).json({
      success: true,
      listing
    });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create listing'
    });
  }
};

// @desc    Update a listing
// @route   PUT /api/marketplace/listings/:id
exports.updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this listing'
      });
    }

    const allowedUpdates = [
      'title', 'description', 'cropDetails', 'quantity',
      'price', 'contactPreferences', 'status'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        listing[field] = typeof req.body[field] === 'string' &&
          ['cropDetails', 'quantity', 'price', 'contactPreferences'].includes(field)
          ? JSON.parse(req.body[field])
          : req.body[field];
      }
    });

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        thumbnail: `/uploads/${file.filename}`
      }));
      listing.images = [...listing.images, ...newImages];
    }

    await listing.save();
    await listing.populate('seller', 'name avatar phone location');

    res.status(200).json({
      success: true,
      listing
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update listing'
    });
  }
};

// @desc    Delete a listing
// @route   DELETE /api/marketplace/listings/:id
exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this listing'
      });
    }

    listing.status = 'deleted';
    await listing.save();

    res.status(200).json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete listing'
    });
  }
};

// @desc    Save/Unsave a listing
// @route   POST /api/marketplace/listings/:id/save
exports.toggleSaveListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    const userId = req.user._id;

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    const savedIndex = listing.savedBy.indexOf(userId);
    let action;

    if (savedIndex > -1) {
      listing.savedBy.splice(savedIndex, 1);
      action = 'unsaved';
    } else {
      listing.savedBy.push(userId);
      action = 'saved';
    }

    await listing.save();

    res.status(200).json({
      success: true,
      action,
      savedCount: listing.savedBy.length
    });
  } catch (error) {
    console.error('Toggle save error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save listing'
    });
  }
};

// @desc    Record an inquiry
// @route   POST /api/marketplace/listings/:id/inquiry
exports.recordInquiry = async (req, res) => {
  try {
    const { message, contactMethod } = req.body;
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'phone name');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    listing.inquiries.push({
      user: req.user._id,
      message,
      contactMethod
    });

    await listing.save();

    try {
      await notificationService.sendNotification(
        listing.seller._id,
        'marketplace',
        'New Inquiry on Your Listing',
        `${req.user.name} is interested in: ${listing.title}`,
        {
          listingId: listing._id,
          inquirerId: req.user._id
        }
      );
    } catch (notifError) {
      console.log('Notification skipped:', notifError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Inquiry recorded',
      sellerPhone: listing.contactPreferences.showPhone ? listing.seller.phone : null
    });
  } catch (error) {
    console.error('Record inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record inquiry'
    });
  }
};

// @desc    Get mandi prices
// @route   GET /api/marketplace/mandi-prices
exports.getMandiPrices = async (req, res) => {
  try {
    const { commodity, state, district } = req.query;

    if (!commodity) {
      return res.status(400).json({
        success: false,
        message: 'Commodity name is required'
      });
    }

    const userState = state || req.user?.location?.state;
    const prices = await mandiPriceService.getMandiPrices(commodity, userState, district);

    res.status(200).json({
      success: true,
      commodity,
      state: userState,
      prices,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Get mandi prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mandi prices'
    });
  }
};

// @desc    Get price comparison
// @route   GET /api/marketplace/price-compare/:id
exports.getPriceComparison = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing || listing.category !== 'crops') {
      return res.status(400).json({
        success: false,
        message: 'Price comparison only available for crop listings'
      });
    }

    const comparison = await mandiPriceService.getPriceComparison(
      listing.cropDetails.cropName,
      listing.price.amount,
      listing.location.state
    );

    res.status(200).json({
      success: true,
      comparison
    });
  } catch (error) {
    console.error('Get price comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get price comparison'
    });
  }
};

// @desc    Get trending crops
// @route   GET /api/marketplace/trending
exports.getTrendingCrops = async (req, res) => {
  try {
    const state = req.query.state || req.user?.location?.state;
    const trending = await mandiPriceService.getTrendingCrops(state);

    res.status(200).json({
      success: true,
      trending,
      state
    });
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending crops'
    });
  }
};

// @desc    Get user's listings
// @route   GET /api/marketplace/my-listings
exports.getMyListings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { seller: req.user._id };
    if (status) query.status = status;

    const listings = await Listing.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Listing.countDocuments(query);

    res.status(200).json({
      success: true,
      listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your listings'
    });
  }
};

// @desc    Get saved listings
// @route   GET /api/marketplace/saved
exports.getSavedListings = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const listings = await Listing.find({
      savedBy: req.user._id,
      status: 'active'
    })
      .populate('seller', 'name avatar phone location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Listing.countDocuments({
      savedBy: req.user._id,
      status: 'active'
    });

    res.status(200).json({
      success: true,
      listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get saved listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved listings'
    });
  }
};

// @desc    Get commodities and states lists
// @route   GET /api/marketplace/options
exports.getOptions = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      commodities: mandiPriceService.getCommodityList(),
      states: mandiPriceService.getStateList(),
      categories: ['crops', 'seeds', 'fertilizers', 'pesticides', 'equipment', 'other'],
      units: {
        quantity: ['kg', 'quintal', 'ton', 'pieces', 'bags', 'liters'],
        price: ['per_kg', 'per_quintal', 'per_ton', 'per_piece', 'per_bag', 'per_liter', 'total']
      }
    });
  } catch (error) {
    console.error('Get options error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch options'
    });
  }
};
