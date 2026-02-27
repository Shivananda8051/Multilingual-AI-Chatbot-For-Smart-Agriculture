const Story = require('../models/Story');
const User = require('../models/User');

// Get all active stories (grouped by user)
exports.getStories = async (req, res) => {
  try {
    const stories = await Story.find({
      expiresAt: { $gt: new Date() },
      isActive: true
    })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
      const userId = story.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: [],
          hasUnviewed: false
        };
      }
      acc[userId].stories.push(story);
      // Check if current user has viewed this story
      const hasViewed = story.views.some(v => v.user?.toString() === req.user._id.toString());
      if (!hasViewed) {
        acc[userId].hasUnviewed = true;
      }
      return acc;
    }, {});

    // Convert to array and sort (own stories first, then unviewed, then viewed)
    const storyGroups = Object.values(groupedStories).sort((a, b) => {
      // Own stories first
      if (a.user._id.toString() === req.user._id.toString()) return -1;
      if (b.user._id.toString() === req.user._id.toString()) return 1;
      // Then by unviewed
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });

    res.json({ stories: storyGroups });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ message: 'Failed to fetch stories' });
  }
};

// Create a new story
exports.createStory = async (req, res) => {
  try {
    const { caption } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Media is required' });
    }

    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    const story = await Story.create({
      user: req.user._id,
      media: {
        type: mediaType,
        url: `/uploads/${req.file.filename}`
      },
      caption
    });

    await story.populate('user', 'name avatar');

    res.status(201).json({ story });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ message: 'Failed to create story' });
  }
};

// View a story
exports.viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Don't count own views
    if (story.user.toString() !== req.user._id.toString()) {
      const alreadyViewed = story.views.some(v => v.user?.toString() === req.user._id.toString());
      if (!alreadyViewed) {
        story.views.push({ user: req.user._id });
        await story.save();
      }
    }

    res.json({ story });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ message: 'Failed to view story' });
  }
};

// Delete a story
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await story.deleteOne();
    res.json({ message: 'Story deleted' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ message: 'Failed to delete story' });
  }
};

// Get my stories
exports.getMyStories = async (req, res) => {
  try {
    const stories = await Story.find({
      user: req.user._id,
      expiresAt: { $gt: new Date() },
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({ stories });
  } catch (error) {
    console.error('Get my stories error:', error);
    res.status(500).json({ message: 'Failed to fetch stories' });
  }
};
