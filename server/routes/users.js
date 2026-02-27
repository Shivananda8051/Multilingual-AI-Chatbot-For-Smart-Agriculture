const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Private
router.get('/:id', protect, userController.getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, upload.single('avatar'), userController.updateProfile);

// @route   POST /api/users/follow/:id
// @desc    Follow/Unfollow user
// @access  Private
router.post('/follow/:id', protect, userController.toggleFollow);

// @route   GET /api/users/:id/followers
// @desc    Get user followers
// @access  Private
router.get('/:id/followers', protect, userController.getFollowers);

// @route   GET /api/users/:id/following
// @desc    Get user following
// @access  Private
router.get('/:id/following', protect, userController.getFollowing);

// @route   GET /api/users/:id/posts
// @desc    Get user posts
// @access  Private
router.get('/:id/posts', protect, userController.getUserPosts);

// @route   POST /api/users/community/join
// @desc    Join the community
// @access  Private
router.post('/community/join', protect, userController.joinCommunity);

// @route   GET /api/users/search
// @desc    Search users
// @access  Private
router.get('/search/query', protect, userController.searchUsers);

module.exports = router;
