const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const cropCalendarController = require('../controllers/cropCalendarController');
const cropActivityController = require('../controllers/cropActivityController');
const cropDataController = require('../controllers/cropDataController');

// All routes require authentication
router.use(protect);

// Crop Data routes
router.get('/crops', cropDataController.getCrops);
router.get('/crops/categories', cropDataController.getCategories);
router.get('/crops/seasonal', cropDataController.getSeasonalCrops);
router.get('/crops/:id', cropDataController.getCrop);

// Calendar entry routes
router.get('/', cropCalendarController.getCalendarEntries);
router.post('/', cropCalendarController.createCalendarEntry);
router.get('/stats', cropCalendarController.getStats);
router.get('/recommendations', cropCalendarController.getRecommendations);
router.get('/rotation-suggestions', cropCalendarController.getRotationSuggestions);
router.get('/:id', cropCalendarController.getCalendarEntry);
router.put('/:id', cropCalendarController.updateCalendarEntry);
router.put('/:id/status', cropCalendarController.updateStatus);
router.delete('/:id', cropCalendarController.deleteCalendarEntry);

// Activity routes
router.get('/activities/upcoming', cropActivityController.getUpcomingActivities);
router.get('/activities/today', cropActivityController.getTodayActivities);
router.get('/activities/overdue', cropActivityController.getOverdueActivities);
router.get('/activities', cropActivityController.getActivities);
router.post('/activities', cropActivityController.createActivity);
router.put('/activities/:id', cropActivityController.updateActivity);
router.put('/activities/:id/complete', cropActivityController.completeActivity);
router.put('/activities/:id/skip', cropActivityController.skipActivity);
router.delete('/activities/:id', cropActivityController.deleteActivity);

module.exports = router;
