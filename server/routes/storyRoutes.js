const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getStories,
  createStory,
  viewStory,
  deleteStory,
  getMyStories
} = require('../controllers/storyController');

router.use(protect);

router.route('/')
  .get(getStories)
  .post(upload.single('media'), createStory);

router.get('/my', getMyStories);
router.post('/:id/view', viewStory);
router.delete('/:id', deleteStory);

module.exports = router;
