const CropActivity = require('../models/CropActivity');
const CropCalendar = require('../models/CropCalendar');
const User = require('../models/User');
const notificationService = require('./notificationService');

class SchedulerService {

  init() {
    console.log('Initializing Crop Calendar Scheduler...');

    // Try to load node-cron, gracefully fail if not installed
    try {
      const cron = require('node-cron');

      // Daily morning reminders at 7:00 AM
      cron.schedule('0 7 * * *', () => {
        this.sendDailyReminders();
      });

      // Hourly check for due activities
      cron.schedule('0 * * * *', () => {
        this.checkDueActivities();
      });

      // Daily at midnight - mark overdue
      cron.schedule('0 0 * * *', () => {
        this.markOverdueActivities();
      });

      // Weekly progress update (Sunday 6 AM)
      cron.schedule('0 6 * * 0', () => {
        this.updateCropProgress();
      });

      console.log('Crop Calendar Scheduler initialized successfully');
    } catch (error) {
      console.log('node-cron not installed. Scheduler disabled. Run: npm install node-cron');
    }
  }

  async sendDailyReminders() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayActivities = await CropActivity.find({
        scheduledDate: { $gte: today, $lt: tomorrow },
        status: 'pending'
      }).populate('cropCalendar', 'cropName fieldName');

      const byUser = {};
      for (const activity of todayActivities) {
        const userId = activity.user.toString();
        if (!byUser[userId]) byUser[userId] = [];
        byUser[userId].push(activity);
      }

      for (const [userId, activities] of Object.entries(byUser)) {
        const activityCount = activities.length;
        const titles = activities.slice(0, 3).map(a => a.title).join(', ');

        try {
          await notificationService.sendNotification(
            userId,
            'crop_calendar',
            `${activityCount} Task${activityCount > 1 ? 's' : ''} for Today`,
            activityCount === 1
              ? activities[0].title
              : `${titles}${activityCount > 3 ? ` and ${activityCount - 3} more` : ''}`,
            { type: 'daily_reminder', activityIds: activities.map(a => a._id) }
          );

          await CropActivity.updateMany(
            { _id: { $in: activities.map(a => a._id) } },
            {
              status: 'notified',
              $push: { notificationsSent: { sentAt: new Date(), channel: 'push', success: true } }
            }
          );
        } catch (error) {
          console.error(`Failed to send reminder to user ${userId}:`, error);
        }
      }

      console.log(`Sent daily reminders to ${Object.keys(byUser).length} users`);
    } catch (error) {
      console.error('Daily reminders error:', error);
    }
  }

  async checkDueActivities() {
    try {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const dueActivities = await CropActivity.find({
        scheduledDate: { $gte: twoHoursAgo, $lte: now },
        status: 'pending',
        priority: { $in: ['high', 'critical'] }
      }).populate('cropCalendar', 'cropName');

      for (const activity of dueActivities) {
        try {
          await notificationService.sendNotification(
            activity.user,
            'crop_calendar',
            activity.priority === 'critical' ? 'URGENT: ' + activity.title : activity.title,
            activity.description || `Activity for ${activity.cropCalendar?.cropName}`,
            { type: 'activity_reminder', activityId: activity._id }
          );

          activity.status = 'notified';
          activity.notificationsSent.push({ sentAt: new Date(), channel: 'push', success: true });
          await activity.save();
        } catch (error) {
          console.error(`Failed to notify activity ${activity._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Check due activities error:', error);
    }
  }

  async markOverdueActivities() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      const result = await CropActivity.updateMany(
        {
          scheduledDate: { $lt: yesterday },
          status: { $in: ['pending', 'notified'] }
        },
        { status: 'overdue' }
      );

      console.log(`Marked ${result.modifiedCount} activities as overdue`);
    } catch (error) {
      console.error('Mark overdue error:', error);
    }
  }

  async updateCropProgress() {
    try {
      const activeCrops = await CropCalendar.find({
        status: { $in: ['sowing', 'growing', 'flowering', 'harvesting'] }
      });

      for (const crop of activeCrops) {
        const sowDate = crop.actualSowingDate || crop.plannedSowingDate;
        const harvestDate = crop.expectedHarvestDate;

        if (!sowDate || !harvestDate) continue;

        const now = new Date();
        const totalDays = (harvestDate - sowDate) / (1000 * 60 * 60 * 24);
        const elapsedDays = (now - sowDate) / (1000 * 60 * 60 * 24);

        let progress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
        progress = Math.round(progress);

        let phase = 'vegetative';
        if (progress < 10) phase = 'germination';
        else if (progress < 40) phase = 'vegetative';
        else if (progress < 60) phase = 'flowering';
        else if (progress < 80) phase = 'fruiting';
        else phase = 'maturity';

        crop.progressPercentage = progress;
        crop.currentPhase = phase;
        await crop.save();
      }

      console.log(`Updated progress for ${activeCrops.length} crops`);
    } catch (error) {
      console.error('Update crop progress error:', error);
    }
  }
}

module.exports = new SchedulerService();
