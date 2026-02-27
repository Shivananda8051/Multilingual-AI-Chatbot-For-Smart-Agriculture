const CropData = require('../models/CropData');
const CropActivity = require('../models/CropActivity');
const CropCalendar = require('../models/CropCalendar');

class CropCalendarService {

  determineRegion(state) {
    const regionMap = {
      north: ['Punjab', 'Haryana', 'Himachal Pradesh', 'Uttarakhand', 'Uttar Pradesh', 'Delhi', 'Jammu and Kashmir'],
      south: ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'],
      east: ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand'],
      west: ['Maharashtra', 'Gujarat', 'Rajasthan', 'Goa'],
      central: ['Madhya Pradesh', 'Chhattisgarh'],
      northeast: ['Assam', 'Meghalaya', 'Manipur', 'Mizoram', 'Tripura', 'Nagaland', 'Arunachal Pradesh', 'Sikkim']
    };

    for (const [region, states] of Object.entries(regionMap)) {
      if (states.some(s => s.toLowerCase() === state?.toLowerCase())) {
        return region;
      }
    }
    return 'north';
  }

  async generateActivities(calendarEntry, cropData, seasonInfo) {
    const activities = [];
    const sowingDate = new Date(calendarEntry.plannedSowingDate);

    // Sowing reminder
    const sowingReminder = new Date(sowingDate);
    sowingReminder.setDate(sowingReminder.getDate() - 1);
    activities.push({
      user: calendarEntry.user,
      cropCalendar: calendarEntry._id,
      activityType: 'sowing_reminder',
      title: `Sowing Reminder: ${calendarEntry.cropName}`,
      description: `Tomorrow is the planned sowing date for ${calendarEntry.cropName}`,
      scheduledDate: sowingReminder,
      priority: 'high'
    });

    // Germination check
    if (seasonInfo?.daysToGermination) {
      const germDate = new Date(sowingDate);
      germDate.setDate(germDate.getDate() + seasonInfo.daysToGermination);
      activities.push({
        user: calendarEntry.user,
        cropCalendar: calendarEntry._id,
        activityType: 'custom',
        title: `Check Germination: ${calendarEntry.cropName}`,
        description: 'Check for seedling emergence and replant any gaps',
        scheduledDate: germDate,
        priority: 'medium'
      });
    }

    // First irrigation
    const firstIrrigation = new Date(sowingDate);
    firstIrrigation.setDate(firstIrrigation.getDate() + 4);
    activities.push({
      user: calendarEntry.user,
      cropCalendar: calendarEntry._id,
      activityType: 'irrigation',
      title: `First Irrigation: ${calendarEntry.cropName}`,
      description: 'Light irrigation to ensure proper germination',
      scheduledDate: firstIrrigation,
      priority: 'high'
    });

    // Weeding
    const weedingDate = new Date(sowingDate);
    weedingDate.setDate(weedingDate.getDate() + 22);
    activities.push({
      user: calendarEntry.user,
      cropCalendar: calendarEntry._id,
      activityType: 'weeding',
      title: `Weeding: ${calendarEntry.cropName}`,
      description: 'First weeding to remove competing weeds',
      scheduledDate: weedingDate,
      priority: 'medium'
    });

    // Crop-specific activities
    if (cropData?.activities) {
      for (const activity of cropData.activities) {
        const actDate = new Date(sowingDate);
        actDate.setDate(actDate.getDate() + activity.daysFromSowing);
        activities.push({
          user: calendarEntry.user,
          cropCalendar: calendarEntry._id,
          activityType: 'fertilizer',
          title: `${activity.name}: ${calendarEntry.cropName}`,
          description: activity.description,
          scheduledDate: actDate,
          priority: 'medium'
        });
      }
    }

    // Harvest reminders
    if (calendarEntry.expectedHarvestDate) {
      const harvestReminder7 = new Date(calendarEntry.expectedHarvestDate);
      harvestReminder7.setDate(harvestReminder7.getDate() - 7);
      activities.push({
        user: calendarEntry.user,
        cropCalendar: calendarEntry._id,
        activityType: 'harvest_reminder',
        title: `Harvest Approaching: ${calendarEntry.cropName}`,
        description: 'Harvest expected in about a week. Start preparations.',
        scheduledDate: harvestReminder7,
        priority: 'high'
      });

      const harvestReminder1 = new Date(calendarEntry.expectedHarvestDate);
      harvestReminder1.setDate(harvestReminder1.getDate() - 1);
      activities.push({
        user: calendarEntry.user,
        cropCalendar: calendarEntry._id,
        activityType: 'harvest_reminder',
        title: `Harvest Tomorrow: ${calendarEntry.cropName}`,
        description: 'Harvest is due tomorrow. Arrange labor and equipment.',
        scheduledDate: harvestReminder1,
        priority: 'critical'
      });
    }

    await CropActivity.insertMany(activities);
    return activities;
  }

  async generateRotationSuggestions(history, userState) {
    const region = this.determineRegion(userState);
    const lastCrop = history[0];

    if (!lastCrop?.crop) {
      const popularCrops = await CropData.find({
        'seasons.region': region,
        isActive: true
      }).limit(5);

      return popularCrops.map(c => ({
        crop: c,
        reason: 'Popular crop in your region',
        score: 80
      }));
    }

    const suggestions = [];

    if (lastCrop.crop.rotation?.goodSuccessors) {
      const goodSuccessors = await CropData.find({
        name: { $in: lastCrop.crop.rotation.goodSuccessors },
        isActive: true
      });

      for (const crop of goodSuccessors) {
        suggestions.push({
          crop,
          reason: `Excellent successor to ${lastCrop.cropName} - improves soil health`,
          score: 95
        });
      }
    }

    if (lastCrop.crop.rotation?.soilEffect === 'heavy_feeder') {
      const nitrogenFixers = await CropData.find({
        'rotation.soilEffect': 'nitrogen_fixer',
        isActive: true
      }).limit(3);

      for (const crop of nitrogenFixers) {
        if (!suggestions.find(s => s.crop.name === crop.name)) {
          suggestions.push({
            crop,
            reason: 'Nitrogen fixer - will restore soil nutrients',
            score: 90
          });
        }
      }
    }

    const differentFamily = await CropData.find({
      'rotation.family': { $ne: lastCrop.crop.rotation?.family },
      'seasons.region': region,
      isActive: true
    }).limit(5);

    for (const crop of differentFamily) {
      if (!suggestions.find(s => s.crop.name === crop.name)) {
        suggestions.push({
          crop,
          reason: 'Different plant family - breaks pest and disease cycles',
          score: 75
        });
      }
    }

    return suggestions.sort((a, b) => b.score - a.score).slice(0, 6);
  }

  async getPlantingRecommendations(location, targetMonth, existingCrops = []) {
    const region = this.determineRegion(location?.state);

    const suitableCrops = await CropData.find({
      'seasons.region': region,
      'seasons.sowingStartMonth': { $lte: targetMonth },
      'seasons.sowingEndMonth': { $gte: targetMonth },
      isActive: true
    });

    const recommendations = suitableCrops.map(crop => {
      const seasonInfo = crop.seasons.find(s => s.region === region);
      const isGrown = existingCrops.includes(crop.name);

      return {
        crop: {
          _id: crop._id,
          name: crop.name,
          localNames: crop.localNames,
          category: crop.category,
          imageUrl: crop.imageUrl
        },
        seasonInfo: {
          seasonType: seasonInfo?.seasonType,
          daysToHarvest: seasonInfo?.daysToHarvest,
          sowingEndMonth: seasonInfo?.sowingEndMonth
        },
        isCurrentlyGrown: isGrown,
        urgency: this.calculateUrgency(targetMonth, seasonInfo?.sowingEndMonth)
      };
    });

    return recommendations.sort((a, b) => {
      if (a.isCurrentlyGrown !== b.isCurrentlyGrown) {
        return a.isCurrentlyGrown ? -1 : 1;
      }
      return b.urgency - a.urgency;
    });
  }

  calculateUrgency(currentMonth, sowingEndMonth) {
    if (!sowingEndMonth) return 50;
    const monthsRemaining = sowingEndMonth - currentMonth;
    if (monthsRemaining <= 0) return 100;
    if (monthsRemaining === 1) return 80;
    if (monthsRemaining === 2) return 60;
    return 40;
  }
}

module.exports = new CropCalendarService();
