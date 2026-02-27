const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   GET /api/posts
// @desc    Get all posts (feed)
// @access  Private
router.get('/', protect, postController.getPosts);

// @route   GET /api/posts/:id
// @desc    Get single post
// @access  Private
router.get('/:id', protect, postController.getPost);

// @route   POST /api/posts
// @desc    Create a post
// @access  Private
router.post('/', protect, upload.array('media', 5), postController.createPost);

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private
router.put('/:id', protect, postController.updatePost);

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', protect, postController.deletePost);

// @route   POST /api/posts/:id/like
// @desc    Like/Unlike a post
// @access  Private
router.post('/:id/like', protect, postController.toggleLike);

// @route   POST /api/posts/:id/comment
// @desc    Add comment to post
// @access  Private
router.post('/:id/comment', protect, postController.addComment);

// @route   DELETE /api/posts/:id/comment/:commentId
// @desc    Delete comment
// @access  Private
router.delete('/:id/comment/:commentId', protect, postController.deleteComment);

module.exports = router;
