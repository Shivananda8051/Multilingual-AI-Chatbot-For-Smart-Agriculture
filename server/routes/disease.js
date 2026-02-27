const express = require('express');
const router = express.Router();
const diseaseController = require('../controllers/diseaseController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   POST /api/disease/detect
// @desc    Detect crop disease from image
// @access  Private
router.post('/detect', protect, upload.single('image'), diseaseController.detectDisease);

// @route   GET /api/disease/history
// @desc    Get disease detection history
// @access  Private
router.get('/history', protect, diseaseController.getHistory);

// @route   GET /api/disease/history/:id
// @desc    Get single detection detail
// @access  Private
router.get('/history/:id', protect, diseaseController.getDetectionById);

// @route   DELETE /api/disease/history/:id
// @desc    Delete detection from history
// @access  Private
router.delete('/history/:id', protect, diseaseController.deleteDetection);

module.exports = router;
