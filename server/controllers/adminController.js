const User = require('../models/User');
const Post = require('../models/Post');
const Chat = require('../models/Chat');
const IoTData = require('../models/IoTData');
const Reel = require('../models/Reel');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User statistics
    const totalUsers = await User.countDocuments({ role: 'farmer' });
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today },
      role: 'farmer'
    });
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: lastWeek },
      role: 'farmer'
    });
    const activeUsersToday = await User.countDocuments({
      lastActive: { $gte: today },
      role: 'farmer'
    });

    // Post statistics
    const totalPosts = await Post.countDocuments({ isActive: true });
    const postsToday = await Post.countDocuments({
      createdAt: { $gte: today },
      isActive: true
    });

    // Chat statistics
    const totalChats = await Chat.countDocuments();
    const chatsToday = await Chat.countDocuments({
      createdAt: { $gte: today }
    });

    // User growth over last 30 days
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: lastMonth },
          role: 'farmer'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Language distribution
    const languageStats = await User.aggregate([
      { $match: { role: 'farmer' } },
      {
        $group: {
          _id: '$preferredLanguage',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          newThisWeek: newUsersThisWeek,
          activeToday: activeUsersToday
        },
        posts: {
          total: totalPosts,
          today: postsToday
        },
        chats: {
          total: totalChats,
          today: chatsToday
        },
        userGrowth,
        languageStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', order = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    const query = { role: 'farmer' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-otp')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
};

// @desc    Get user geography data
// @route   GET /api/admin/geography
exports.getGeography = async (req, res) => {
  try {
    // Group users by state
    const stateStats = await User.aggregate([
      { $match: { role: 'farmer', 'location.state': { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$location.state',
          count: { $sum: 1 },
          cities: { $addToSet: '$location.city' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Group users by city
    const cityStats = await User.aggregate([
      { $match: { role: 'farmer', 'location.city': { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$location.city',
          count: { $sum: 1 },
          state: { $first: '$location.state' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.status(200).json({
      success: true,
      geography: {
        byState: stateStats,
        byCity: cityStats
      }
    });
  } catch (error) {
    console.error('Get geography error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get geography data'
    });
  }
};

// @desc    Get usage analytics
// @route   GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Chat activity over time
    const chatActivity = await Chat.aggregate([
      { $match: { createdAt: { $gte: lastMonth } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          messageCount: { $sum: { $size: '$messages' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Popular crops
    const cropStats = await User.aggregate([
      { $unwind: '$cropsGrown' },
      {
        $group: {
          _id: '$cropsGrown',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Post categories
    const postCategories = await Post.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Popular hashtags
    const popularHashtags = await Post.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$hashtags' },
      {
        $group: {
          _id: '$hashtags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        chatActivity,
        cropStats,
        postCategories,
        popularHashtags
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics'
    });
  }
};

// @desc    Get real-time activity feed
// @route   GET /api/admin/activity
exports.getActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent user registrations
    const recentUsers = await User.find({ role: 'farmer' })
      .select('name phone location createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent posts
    const recentPosts = await Post.find({ isActive: true })
      .populate('user', 'name avatar')
      .select('content category createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent chats
    const recentChats = await Chat.find()
      .populate('user', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);

    // Combine and sort by time
    const activities = [
      ...recentUsers.map(u => ({ type: 'user_joined', data: u, time: u.createdAt })),
      ...recentPosts.map(p => ({ type: 'new_post', data: p, time: p.createdAt })),
      ...recentChats.map(c => ({ type: 'chat_activity', data: c, time: c.updatedAt }))
    ].sort((a, b) => b.time - a.time).slice(0, limit);

    res.status(200).json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity feed'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    // Also delete user's posts, chats, etc.
    await Post.deleteMany({ user: req.params.id });
    await Chat.deleteMany({ user: req.params.id });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

// @desc    Get shorts/reels analytics
// @route   GET /api/admin/shorts-analytics
exports.getShortsAnalytics = async (req, res) => {
  try {
    // Total shorts stats
    const totalShorts = await Reel.countDocuments({ isActive: true });
    const featuredShorts = await Reel.countDocuments({ isActive: true, isFeatured: true });
    const userSubmissions = await Reel.countDocuments({ isActive: true, isUserSubmission: true });

    // Aggregate engagement stats - use $ifNull to handle missing arrays
    const engagementStats = await Reel.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: { $ifNull: ['$views', 0] } },
          totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
          totalComments: { $sum: { $size: { $ifNull: ['$comments', []] } } },
          totalShares: { $sum: { $ifNull: ['$shares', 0] } }
        }
      }
    ]);

    // Category-wise distribution
    const categoryStats = await Reel.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          views: { $sum: { $ifNull: ['$views', 0] } },
          likes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
          comments: { $sum: { $size: { $ifNull: ['$comments', []] } } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Top performing shorts (by views)
    const topByViews = await Reel.find({ isActive: true })
      .sort({ views: -1 })
      .limit(5)
      .select('title views likes comments category');

    // Top performing shorts (by likes)
    const topByLikes = await Reel.aggregate([
      { $match: { isActive: true } },
      { $addFields: { likesCount: { $size: '$likes' } } },
      { $sort: { likesCount: -1 } },
      { $limit: 5 },
      { $project: { title: 1, views: 1, likesCount: 1, category: 1 } }
    ]);

    // Daily engagement trend (last 7 days)
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentShorts = await Reel.aggregate([
      { $match: { createdAt: { $gte: lastWeek }, isActive: true } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          views: { $sum: '$views' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      shortsAnalytics: {
        overview: {
          total: totalShorts,
          featured: featuredShorts,
          userSubmissions: userSubmissions
        },
        engagement: engagementStats[0] || { totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0 },
        categoryStats,
        topByViews: topByViews.map(s => ({
          ...s.toObject(),
          likesCount: s.likes?.length || 0,
          commentsCount: s.comments?.length || 0
        })),
        topByLikes,
        recentTrend: recentShorts
      }
    });
  } catch (error) {
    console.error('Get shorts analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get shorts analytics'
    });
  }
};

// @desc    Get detailed location analytics (district/city level)
// @route   GET /api/admin/location-analytics
exports.getLocationAnalytics = async (req, res) => {
  try {
    // Users by district/city with state info
    const districtStats = await User.aggregate([
      {
        $match: {
          role: 'farmer',
          'location.city': { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: { city: '$location.city', state: '$location.state' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);

    // State-wise user distribution with active users
    const stateDetails = await User.aggregate([
      {
        $match: {
          role: 'farmer',
          'location.state': { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$location.state',
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [
                { $gte: ['$lastActive', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          },
          cities: { $addToSet: '$location.city' }
        }
      },
      {
        $addFields: {
          cityCount: { $size: '$cities' },
          activePercentage: {
            $multiply: [
              { $divide: ['$activeUsers', '$totalUsers'] },
              100
            ]
          }
        }
      },
      { $sort: { totalUsers: -1 } },
      { $limit: 10 }
    ]);

    // Pincode-wise distribution (top areas)
    const pincodeStats = await User.aggregate([
      {
        $match: {
          role: 'farmer',
          'location.pincode': { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$location.pincode',
          count: { $sum: 1 },
          city: { $first: '$location.city' },
          state: { $first: '$location.state' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Language distribution by state
    const languageByState = await User.aggregate([
      {
        $match: {
          role: 'farmer',
          'location.state': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: { state: '$location.state', language: '$preferredLanguage' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      locationAnalytics: {
        districtStats: districtStats.map(d => ({
          city: d._id.city,
          state: d._id.state,
          count: d.count
        })),
        stateDetails: stateDetails.map(s => ({
          state: s._id,
          totalUsers: s.totalUsers,
          activeUsers: s.activeUsers,
          activePercentage: Math.round(s.activePercentage),
          cityCount: s.cityCount
        })),
        pincodeStats,
        languageByState
      }
    });
  } catch (error) {
    console.error('Get location analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location analytics'
    });
  }
};
