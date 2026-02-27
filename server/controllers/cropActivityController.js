const CropActivity = require('../models/CropActivity');
const CropCalendar = require('../models/CropCalendar');

// @desc    Get user's activities
// @route   GET /api/crop-calendar/activities
// @access  Private
exports.getActivities = async (req, res) => {
  try {
    const { status, startDate, endDate, priority, cropCalendarId } = req.query;

    const query = { user: req.user._id };

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (cropCalendarId) {
      query.cropCalendar = cropCalendarId;
    }

    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    const activities = await CropActivity.find(query)
      .populate('cropCalendar', 'cropName fieldName color')
      .sort({ scheduledDate: 1 });

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
};

// @desc    Get upcoming activities
// @route   GET /api/crop-calendar/activities/upcoming
// @access  Private
exports.getUpcomingActivities = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + parseInt(days));

    const activities = await CropActivity.find({
      user: req.user._id,
      status: { $in: ['pending', 'notified'] },
      scheduledDate: { $gte: today, $lte: endDate }
    })
      .populate('cropCalendar', 'cropName fieldName color')
      .sort({ scheduledDate: 1, priority: -1 });

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Get upcoming activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming activities',
      error: error.message
    });
  }
};

// @desc    Get today's activities
// @route   GET /api/crop-calendar/activities/today
// @access  Private
exports.getTodayActivities = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activities = await CropActivity.find({
      user: req.user._id,
      scheduledDate: { $gte: today, $lt: tomorrow }
    })
      .populate('cropCalendar', 'cropName fieldName color')
      .sort({ priority: -1, scheduledDate: 1 });

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Get today activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s activities',
      error: error.message
    });
  }
};

// @desc    Get overdue activities
// @route   GET /api/crop-calendar/activities/overdue
// @access  Private
exports.getOverdueActivities = async (req, res) => {
  try {
    const activities = await CropActivity.find({
      user: req.user._id,
      status: 'overdue'
    })
      .populate('cropCalendar', 'cropName fieldName color')
      .sort({ scheduledDate: 1 });

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Get overdue activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue activities',
      error: error.message
    });
  }
};

// @desc    Create custom activity
// @route   POST /api/crop-calendar/activities
// @access  Private
exports.createActivity = async (req, res) => {
  try {
    const { cropCalendarId, activityType, title, description, scheduledDate, scheduledTime, priority, isRecurring, recurrencePattern, recurrenceInterval } = req.body;

    const calendarEntry = await CropCalendar.findOne({
      _id: cropCalendarId,
      user: req.user._id
    });

    if (!calendarEntry) {
      return res.status(404).json({
        success: false,
        message: 'Calendar entry not found'
      });
    }

    const activity = await CropActivity.create({
      user: req.user._id,
      cropCalendar: cropCalendarId,
      activityType: activityType || 'custom',
      title,
      description,
      scheduledDate: new Date(scheduledDate),
      scheduledTime: scheduledTime || '08:00',
      priority: priority || 'medium',
      isRecurring: isRecurring || false,
      recurrencePattern,
      recurrenceInterval
    });

    await activity.populate('cropCalendar', 'cropName fieldName color');

    res.status(201).json({
      success: true,
      message: 'Activity created',
      data: activity
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create activity',
      error: error.message
    });
  }
};

// @desc    Update activity
// @route   PUT /api/crop-calendar/activities/:id
// @access  Private
exports.updateActivity = async (req, res) => {
  try {
    const { title, description, scheduledDate, scheduledTime, priority } = req.body;

    const activity = await CropActivity.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    if (title) activity.title = title;
    if (description !== undefined) activity.description = description;
    if (scheduledDate) activity.scheduledDate = new Date(scheduledDate);
    if (scheduledTime) activity.scheduledTime = scheduledTime;
    if (priority) activity.priority = priority;

    await activity.save();
    await activity.populate('cropCalendar', 'cropName fieldName color');

    res.json({
      success: true,
      message: 'Activity updated',
      data: activity
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update activity',
      error: error.message
    });
  }
};

// @desc    Mark activity as complete
// @route   PUT /api/crop-calendar/activities/:id/complete
// @access  Private
exports.completeActivity = async (req, res) => {
  try {
    const { notes } = req.body;

    const activity = await CropActivity.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    activity.status = 'completed';
    activity.completedAt = new Date();
    if (notes) activity.completionNotes = notes;

    await activity.save();

    if (activity.isRecurring && activity.recurrencePattern) {
      const nextDate = new Date(activity.scheduledDate);

      switch (activity.recurrencePattern) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + (activity.recurrenceInterval || 1));
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7 * (activity.recurrenceInterval || 1));
          break;
        case 'biweekly':
          nextDate.setDate(nextDate.getDate() + 14);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + (activity.recurrenceInterval || 1));
          break;
      }

      await CropActivity.create({
        user: activity.user,
        cropCalendar: activity.cropCalendar,
        activityType: activity.activityType,
        title: activity.title,
        description: activity.description,
        scheduledDate: nextDate,
        scheduledTime: activity.scheduledTime,
        priority: activity.priority,
        isRecurring: true,
        recurrencePattern: activity.recurrencePattern,
        recurrenceInterval: activity.recurrenceInterval
      });
    }

    res.json({
      success: true,
      message: 'Activity marked as complete',
      data: activity
    });
  } catch (error) {
    console.error('Complete activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete activity',
      error: error.message
    });
  }
};

// @desc    Skip activity
// @route   PUT /api/crop-calendar/activities/:id/skip
// @access  Private
exports.skipActivity = async (req, res) => {
  try {
    const { reason } = req.body;

    const activity = await CropActivity.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    activity.status = 'skipped';
    if (reason) activity.completionNotes = `Skipped: ${reason}`;

    await activity.save();

    res.json({
      success: true,
      message: 'Activity skipped',
      data: activity
    });
  } catch (error) {
    console.error('Skip activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to skip activity',
      error: error.message
    });
  }
};

// @desc    Delete activity
// @route   DELETE /api/crop-calendar/activities/:id
// @access  Private
exports.deleteActivity = async (req, res) => {
  try {
    const activity = await CropActivity.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    res.json({
      success: true,
      message: 'Activity deleted'
    });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete activity',
      error: error.message
    });
  }
};
