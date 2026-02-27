const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const schemeController = require('../controllers/schemeController');

// Public routes (still need auth)
router.use(protect);

router.get('/', schemeController.getSchemes);
router.get('/categories', schemeController.getCategories);
router.get('/recommendations', schemeController.getRecommendations);
router.get('/portals', schemeController.getOfficialPortals);
router.get('/live', schemeController.getLiveSchemes); // Real-time from myScheme.gov.in
router.get('/live/:slug', schemeController.getLiveSchemeDetails); // Scheme details from myScheme
router.get('/:id', schemeController.getScheme);
router.post('/:id/check-eligibility', schemeController.checkEligibility);

// Admin routes
router.post('/', admin, schemeController.createScheme);
router.post('/sync', admin, schemeController.syncFromGovSources);
router.put('/:id', admin, schemeController.updateScheme);
router.delete('/:id', admin, schemeController.deleteScheme);

module.exports = router;
