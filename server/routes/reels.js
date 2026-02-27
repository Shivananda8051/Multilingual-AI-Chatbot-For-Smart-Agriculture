const express = require('express');
const router = express.Router();
const {
  getReels,
  getReel,
  toggleLike,
  getCategories,
  addComment,
  getComments,
  deleteComment,
  shareReel,
  trackView,
  createUserShort,
  createReel,
  updateReel,
  deleteReel,
  seedReels
} = require('../controllers/reelController');
const { protect, admin } = require('../middleware/auth');

// Public routes (still need auth to track views/likes)
router.get('/categories', protect, getCategories);
router.get('/', protect, getReels);
router.get('/:id', protect, getReel);
router.post('/:id/like', protect, toggleLike);

// Comment routes
router.get('/:id/comments', protect, getComments);
router.post('/:id/comment', protect, addComment);
router.delete('/:id/comment/:commentId', protect, deleteComment);

// Share route
router.post('/:id/share', protect, shareReel);

// View tracking route
router.post('/:id/view', protect, trackView);

// User submission route (any authenticated user can post)
router.post('/user', protect, createUserShort);

// Admin routes
router.post('/', protect, admin, createReel);
router.post('/seed', protect, admin, seedReels);
router.put('/:id', protect, admin, updateReel);
router.delete('/:id', protect, admin, deleteReel);

module.exports = router;
