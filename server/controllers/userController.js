const User = require('../models/User');
const Post = require('../models/Post');
const notificationService = require('../services/notificationService');

// @desc    Get user profile
// @route   GET /api/users/:id
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-otp -notificationSettings')
      .populate('followers', 'name avatar')
      .populate('following', 'name avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get post count
    const postCount = await Post.countDocuments({ user: user._id, isActive: true });

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        postCount,
        followerCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing: user.followers.some(f => f._id.toString() === req.user._id.toString())
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, location, cropsGrown, farmDetails, preferredLanguage, notificationSettings } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (location) user.location = location;
    if (cropsGrown) user.cropsGrown = cropsGrown;
    if (farmDetails) user.farmDetails = farmDetails;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;
    if (notificationSettings) user.notificationSettings = notificationSettings;

    // Handle avatar upload
    if (req.file) {
      user.avatar = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        cropsGrown: user.cropsGrown,
        farmDetails: user.farmDetails,
        preferredLanguage: user.preferredLanguage
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// @desc    Follow/Unfollow user
// @route   POST /api/users/follow/:id
exports.toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isFollowing = currentUser.following.includes(targetUserId);
    let action;

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId.toString());
      action = 'unfollowed';
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      action = 'followed';

      // Send notification
      await notificationService.sendFollowNotification(targetUserId, currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      success: true,
      action,
      followerCount: targetUser.followers.length
    });
  } catch (error) {
    console.error('Toggle follow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to follow/unfollow user'
    });
  }
};

// @desc    Get user followers
// @route   GET /api/users/:id/followers
exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'name avatar bio location');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get current user's following list to check if they follow each follower
    const currentUser = await User.findById(req.user._id);
    const currentUserFollowing = currentUser?.following?.map(id => id.toString()) || [];

    const followersWithStatus = user.followers.map(follower => ({
      ...follower.toObject(),
      isFollowedByMe: currentUserFollowing.includes(follower._id.toString())
    }));

    res.status(200).json({
      success: true,
      followers: followersWithStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get followers'
    });
  }
};

// @desc    Get user following
// @route   GET /api/users/:id/following
exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'name avatar bio location');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get current user's following list to check if they follow each user
    const currentUser = await User.findById(req.user._id);
    const currentUserFollowing = currentUser?.following?.map(id => id.toString()) || [];

    const followingWithStatus = user.following.map(followedUser => ({
      ...followedUser.toObject(),
      isFollowedByMe: currentUserFollowing.includes(followedUser._id.toString())
    }));

    res.status(200).json({
      success: true,
      following: followingWithStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get following'
    });
  }
};

// @desc    Get user posts
// @route   GET /api/users/:id/posts
exports.getUserPosts = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: req.params.id, isActive: true })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({ user: req.params.id, isActive: true });

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user posts'
    });
  }
};

// @desc    Join community
// @route   POST /api/users/community/join
exports.joinCommunity = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If already a community member, return success (idempotent)
    if (user.isCommunityMember) {
      return res.status(200).json({
        success: true,
        message: 'Already a community member',
        user: {
          isCommunityMember: user.isCommunityMember,
          communityJoinedAt: user.communityJoinedAt
        }
      });
    }

    user.isCommunityMember = true;
    user.communityJoinedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Welcome to the community!',
      user: {
        isCommunityMember: user.isCommunityMember,
        communityJoinedAt: user.communityJoinedAt
      }
    });
  } catch (error) {
    console.error('Join community error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join community. Please try again.'
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search/query
exports.searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(q.trim(), 'i');

    const users = await User.find({
      $or: [
        { name: searchRegex },
        { bio: searchRegex },
        { 'location.city': searchRegex },
        { cropsGrown: searchRegex }
      ],
      isCommunityMember: true
    })
      .select('name avatar bio location cropsGrown followers')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({
      $or: [
        { name: searchRegex },
        { bio: searchRegex },
        { 'location.city': searchRegex },
        { cropsGrown: searchRegex }
      ],
      isCommunityMember: true
    });

    res.status(200).json({
      success: true,
      users: users.map(u => ({
        ...u.toObject(),
        followerCount: u.followers?.length || 0
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
};
