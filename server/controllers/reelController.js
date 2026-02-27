const Reel = require('../models/Reel');
const User = require('../models/User');

// Translation is disabled for reels to improve performance
// Reels content will be shown in original language only

// @desc    Get all active reels
// @route   GET /api/reels
exports.getReels = async (req, res) => {
  try {
    const { category, featured } = req.query;

    const query = { isActive: true };
    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;

    const reels = await Reel.find(query)
      .sort({ isFeatured: -1, order: 1, createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      count: reels.length,
      reels
    });
  } catch (error) {
    console.error('Get reels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reels'
    });
  }
};

// @desc    Get single reel
// @route   GET /api/reels/:id
exports.getReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Increment view count
    reel.views += 1;
    await reel.save();

    res.json({
      success: true,
      reel
    });
  } catch (error) {
    console.error('Get reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reel'
    });
  }
};

// @desc    Like/Unlike a reel
// @route   POST /api/reels/:id/like
exports.toggleLike = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    const userId = req.user._id;
    const likeIndex = reel.likes.indexOf(userId);

    if (likeIndex > -1) {
      // Unlike
      reel.likes.splice(likeIndex, 1);
    } else {
      // Like
      reel.likes.push(userId);
    }

    await reel.save();

    res.json({
      success: true,
      liked: likeIndex === -1,
      likesCount: reel.likes.length
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update like'
    });
  }
};

// @desc    Add comment to reel
// @route   POST /api/reels/:id/comment
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    const comment = {
      user: req.user._id,
      content: content.trim()
    };

    reel.comments.unshift(comment);
    await reel.save();

    // Populate the user info for the new comment
    await reel.populate('comments.user', 'name avatar');

    res.status(201).json({
      success: true,
      comment: reel.comments[0],
      commentsCount: reel.comments.length
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
};

// @desc    Get comments for a reel
// @route   GET /api/reels/:id/comments
exports.getComments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const reel = await Reel.findById(req.params.id)
      .select('comments')
      .populate('comments.user', 'name avatar');

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const comments = reel.comments.slice(startIndex, endIndex);

    res.json({
      success: true,
      comments,
      total: reel.comments.length,
      page: parseInt(page),
      hasMore: endIndex < reel.comments.length
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get comments'
    });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/reels/:id/comment/:commentId
exports.deleteComment = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    const comment = reel.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Only allow comment owner or admin to delete
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    comment.deleteOne();
    await reel.save();

    res.json({
      success: true,
      message: 'Comment deleted',
      commentsCount: reel.comments.length
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment'
    });
  }
};

// @desc    Track view for a reel
// @route   POST /api/reels/:id/view
exports.trackView = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Increment view count
    reel.views += 1;
    await reel.save();

    res.json({
      success: true,
      views: reel.views
    });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track view'
    });
  }
};

// @desc    Share a reel (track share count)
// @route   POST /api/reels/:id/share
exports.shareReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Increment share count
    reel.shares += 1;
    reel.sharedBy.push({ user: req.user._id });
    await reel.save();

    res.json({
      success: true,
      shares: reel.shares,
      message: 'Reel shared successfully'
    });
  } catch (error) {
    console.error('Share reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share reel'
    });
  }
};

// @desc    Get reel categories
// @route   GET /api/reels/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = [
      { id: 'farming_tips', name: 'Farming Tips', icon: '💡' },
      { id: 'crop_care', name: 'Crop Care', icon: '🌱' },
      { id: 'irrigation', name: 'Irrigation', icon: '💧' },
      { id: 'organic_farming', name: 'Organic Farming', icon: '🌿' },
      { id: 'pest_control', name: 'Pest Control', icon: '🐛' },
      { id: 'harvesting', name: 'Harvesting', icon: '🚜' },
      { id: 'equipment', name: 'Equipment', icon: '🔧' },
      { id: 'success_stories', name: 'Success Stories', icon: '⭐' },
      { id: 'weather', name: 'Weather Tips', icon: '🌤️' },
      { id: 'market', name: 'Market Insights', icon: '📈' }
    ];

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

// ============ USER SUBMISSIONS ============

// @desc    Create a reel (User submission)
// @route   POST /api/reels/user
exports.createUserShort = async (req, res) => {
  try {
    const { title, description, category, videoUrl, tags } = req.body;

    if (!title || !videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title and video URL are required'
      });
    }

    const reel = await Reel.create({
      title,
      description,
      category: category || 'farming_tips',
      video: {
        url: videoUrl
      },
      tags: tags || [],
      isFeatured: false,
      createdBy: req.user._id,
      isUserSubmission: true
    });

    res.status(201).json({
      success: true,
      reel,
      message: 'Short submitted successfully!'
    });
  } catch (error) {
    console.error('Create user short error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create short'
    });
  }
};

// ============ ADMIN ROUTES ============

// @desc    Create a reel (Admin only)
// @route   POST /api/reels
exports.createReel = async (req, res) => {
  try {
    const { title, description, category, videoUrl, thumbnail, duration, tags, isFeatured, order } = req.body;

    if (!title || !videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title and video URL are required'
      });
    }

    const reel = await Reel.create({
      title,
      description,
      category: category || 'farming_tips',
      video: {
        url: videoUrl,
        thumbnail,
        duration
      },
      tags: tags || [],
      isFeatured: isFeatured || false,
      order: order || 0,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      reel
    });
  } catch (error) {
    console.error('Create reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reel'
    });
  }
};

// @desc    Update a reel (Admin only)
// @route   PUT /api/reels/:id
exports.updateReel = async (req, res) => {
  try {
    const { title, description, category, videoUrl, thumbnail, duration, tags, isFeatured, isActive, order } = req.body;

    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Update fields
    if (title) reel.title = title;
    if (description !== undefined) reel.description = description;
    if (category) reel.category = category;
    if (videoUrl) reel.video.url = videoUrl;
    if (thumbnail) reel.video.thumbnail = thumbnail;
    if (duration) reel.video.duration = duration;
    if (tags) reel.tags = tags;
    if (isFeatured !== undefined) reel.isFeatured = isFeatured;
    if (isActive !== undefined) reel.isActive = isActive;
    if (order !== undefined) reel.order = order;

    await reel.save();

    res.json({
      success: true,
      reel
    });
  } catch (error) {
    console.error('Update reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reel'
    });
  }
};

// @desc    Delete a reel (Admin only)
// @route   DELETE /api/reels/:id
exports.deleteReel = async (req, res) => {
  try {
    const reel = await Reel.findByIdAndDelete(req.params.id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    res.json({
      success: true,
      message: 'Reel deleted successfully'
    });
  } catch (error) {
    console.error('Delete reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete reel'
    });
  }
};

// @desc    Seed sample agriculture reels
// @route   POST /api/reels/seed
exports.seedReels = async (req, res) => {
  try {
    // Check if reels already exist
    const existingCount = await Reel.countDocuments();
    if (existingCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Reels already exist. Delete existing reels first to reseed.'
      });
    }

    // Sample agriculture reels with placeholder videos
    const sampleReels = [
      {
        title: 'Modern Drip Irrigation Techniques',
        description: 'Learn how to set up an efficient drip irrigation system for your farm to save water and increase crop yield.',
        category: 'irrigation',
        video: {
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
          duration: 60
        },
        tags: ['irrigation', 'water-saving', 'modern-farming'],
        isFeatured: true,
        order: 1
      },
      {
        title: 'Organic Pest Control Methods',
        description: 'Natural ways to protect your crops from pests without harmful chemicals.',
        category: 'pest_control',
        video: {
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?w=400',
          duration: 45
        },
        tags: ['organic', 'pest-control', 'natural'],
        isFeatured: true,
        order: 2
      },
      {
        title: 'Rice Cultivation Best Practices',
        description: 'Step-by-step guide to growing healthy rice crops with maximum yield.',
        category: 'crop_care',
        video: {
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400',
          duration: 90
        },
        tags: ['rice', 'paddy', 'cultivation'],
        isFeatured: true,
        order: 3
      },
      {
        title: 'Tractor Maintenance Tips',
        description: 'Keep your tractor running smoothly with these essential maintenance tips.',
        category: 'equipment',
        video: {
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400',
          duration: 75
        },
        tags: ['tractor', 'maintenance', 'equipment'],
        isFeatured: false,
        order: 4
      },
      {
        title: 'Composting for Organic Farming',
        description: 'How to create nutrient-rich compost from farm waste for healthier soil.',
        category: 'organic_farming',
        video: {
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
          duration: 55
        },
        tags: ['compost', 'organic', 'soil-health'],
        isFeatured: false,
        order: 5
      },
      {
        title: 'Wheat Harvesting Techniques',
        description: 'Efficient methods for harvesting wheat to minimize losses.',
        category: 'harvesting',
        video: {
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
          duration: 80
        },
        tags: ['wheat', 'harvesting', 'grain'],
        isFeatured: false,
        order: 6
      },
      {
        title: 'Weather Prediction for Farmers',
        description: 'Understanding weather patterns and planning your farm activities accordingly.',
        category: 'weather',
        video: {
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?w=400',
          duration: 65
        },
        tags: ['weather', 'planning', 'seasons'],
        isFeatured: false,
        order: 7
      },
      {
        title: 'Success Story: Small Farm to Big Profits',
        description: 'Inspiring story of a farmer who transformed a small plot into a profitable business.',
        category: 'success_stories',
        video: {
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400',
          duration: 120
        },
        tags: ['success', 'inspiration', 'business'],
        isFeatured: true,
        order: 8
      }
    ];

    const createdReels = await Reel.insertMany(sampleReels);

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdReels.length} sample reels`,
      count: createdReels.length
    });
  } catch (error) {
    console.error('Seed reels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed reels'
    });
  }
};
