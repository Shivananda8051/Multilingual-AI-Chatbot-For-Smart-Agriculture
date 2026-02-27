const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// @route   POST /api/chat/message
// @desc    Send message to AI chatbot
// @access  Private
router.post('/message', protect, chatController.sendMessage);

// @route   GET /api/chat/history
// @desc    Get chat history
// @access  Private
router.get('/history', protect, chatController.getHistory);

// @route   DELETE /api/chat/clear
// @desc    Clear chat history
// @access  Private
router.delete('/clear', protect, chatController.clearHistory);

// @route   POST /api/chat/feedback
// @desc    Submit feedback on a message (thumbs up/down)
// @access  Private
router.post('/feedback', protect, chatController.submitFeedback);

// @route   GET /api/chat/sessions
// @desc    Get all chat sessions for user
// @access  Private
router.get('/sessions', protect, chatController.getSessions);

// @route   GET /api/chat/session/:sessionId
// @desc    Get specific chat session
// @access  Private
router.get('/session/:sessionId', protect, chatController.getSession);

module.exports = router;
