const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const schemeApplicationController = require('../controllers/schemeApplicationController');

router.use(protect);

// User routes
router.get('/my', schemeApplicationController.getMyApplications);
router.get('/track/:applicationNumber', schemeApplicationController.trackApplication);
router.get('/:id', schemeApplicationController.getApplication);
router.post('/', schemeApplicationController.createApplication);
router.put('/:id', schemeApplicationController.updateApplication);
router.post('/:id/submit', schemeApplicationController.submitApplication);
router.post('/:id/cancel', schemeApplicationController.cancelApplication);

// Admin routes
router.get('/', admin, schemeApplicationController.getAllApplications);
router.get('/stats', admin, schemeApplicationController.getStats);
router.put('/:id/status', admin, schemeApplicationController.updateStatus);

module.exports = router;
