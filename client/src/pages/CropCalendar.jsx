import { useState, useEffect } from 'react';
import { cropCalendarAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
  HiCalendar, HiPlus, HiChevronLeft, HiChevronRight, HiClock,
  HiCheck, HiExclamation, HiX, HiRefresh, HiLightBulb, HiFilter,
  HiViewGrid, HiViewList, HiDotsVertical, HiTrash, HiPencil
} from 'react-icons/hi';
import { FaSeedling, FaLeaf, FaTractor, FaWater } from 'react-icons/fa';
import toast from 'react-hot-toast';

// Activity Card Component
const ActivityCard = ({ activity, onComplete, onSkip }) => {
  const priorityColors = {
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
  };

  const statusIcons = {
    pending: <HiClock className="w-4 h-4 text-yellow-500" />,
    notified: <HiExclamation className="w-4 h-4 text-orange-500" />,
    completed: <HiCheck className="w-4 h-4 text-green-500" />,
    skipped: <HiX className="w-4 h-4 text-gray-500" />,
    overdue: <HiExclamation className="w-4 h-4 text-red-500" />
  };

  const activityIcons = {
    sowing_reminder: <FaSeedling className="w-4 h-4" />,
    irrigation: <FaWater className="w-4 h-4" />,
    fertilizer: <FaLeaf className="w-4 h-4" />,
    harvest_reminder: <FaTractor className="w-4 h-4" />,
    weeding: <FaLeaf className="w-4 h-4" />,
    custom: <HiCalendar className="w-4 h-4" />
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4"
         style={{ borderLeftColor: activity.cropCalendar?.color || '#4CAF50' }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {activityIcons[activity.activityType] || activityIcons.custom}
            <h3 className="font-medium text-gray-900 dark:text-white">{activity.title}</h3>
            {statusIcons[activity.status]}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {activity.cropCalendar?.cropName} - {activity.cropCalendar?.fieldName}
          </p>
          {activity.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{activity.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[activity.priority]}`}>
              {activity.priority}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(activity.scheduledDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        {(activity.status === 'pending' || activity.status === 'notified' || activity.status === 'overdue') && (
          <div className="flex gap-2 ml-2">
            <button
              onClick={() => onComplete(activity._id)}
              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
              title="Mark Complete"
            >
              <HiCheck className="w-5 h-5" />
            </button>
            <button
              onClick={() => onSkip(activity._id)}
              className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
              title="Skip"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Crop Card Component
const CropCard = ({ crop, onStatusUpdate, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  const statusColors = {
    planned: 'bg-gray-200 text-gray-700',
    sowing: 'bg-yellow-200 text-yellow-800',
    growing: 'bg-green-200 text-green-800',
    flowering: 'bg-purple-200 text-purple-800',
    harvesting: 'bg-orange-200 text-orange-800',
    completed: 'bg-blue-200 text-blue-800',
    failed: 'bg-red-200 text-red-800'
  };

  const nextStatuses = {
    planned: 'sowing',
    sowing: 'growing',
    growing: 'flowering',
    flowering: 'harvesting',
    harvesting: 'completed'
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
      style={{ borderTop: `4px solid ${crop.color || '#4CAF50'}` }}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{crop.cropName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{crop.fieldName}</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <HiDotsVertical className="w-5 h-5 text-gray-500" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => { onDelete(crop._id); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                >
                  <HiTrash className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{crop.progressPercentage || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${crop.progressPercentage || 0}%`,
                backgroundColor: crop.color || '#4CAF50'
              }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Sowing:</span>
            <p className="text-gray-900 dark:text-white">
              {new Date(crop.plannedSowingDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Harvest:</span>
            <p className="text-gray-900 dark:text-white">
              {crop.expectedHarvestDate ? new Date(crop.expectedHarvestDate).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[crop.status]}`}>
            {crop.status}
          </span>
          {nextStatuses[crop.status] && (
            <button
              onClick={() => onStatusUpdate(crop._id, nextStatuses[crop.status])}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Mark as {nextStatuses[crop.status]}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Add Crop Modal
const AddCropModal = ({ isOpen, onClose, onAdd, crops, loading }) => {
  const [formData, setFormData] = useState({
    cropId: '',
    fieldName: 'Main Field',
    plannedSowingDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.cropId) {
      toast.error('Please select a crop');
      return;
    }
    onAdd(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Crop to Calendar</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <HiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Crop *
              </label>
              <select
                value={formData.cropId}
                onChange={(e) => setFormData({ ...formData, cropId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                required
              >
                <option value="">Choose a crop...</option>
                {crops.map(crop => (
                  <option key={crop._id} value={crop._id}>
                    {crop.name} ({crop.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Field Name
              </label>
              <input
                type="text"
                value={formData.fieldName}
                onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                placeholder="e.g., North Field, Plot A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Planned Sowing Date *
              </label>
              <input
                type="date"
                value={formData.plannedSowingDate}
                onChange={(e) => setFormData({ ...formData, plannedSowingDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                rows="3"
                placeholder="Any additional notes..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add to Calendar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Recommendations Panel
const RecommendationsPanel = ({ recommendations, onAddCrop }) => {
  if (!recommendations.length) return null;

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <HiLightBulb className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Recommended for This Month</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {recommendations.slice(0, 5).map((rec, index) => (
          <div
            key={index}
            className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm min-w-[160px]"
          >
            <p className="font-medium text-gray-900 dark:text-white">{rec.crop?.name}</p>
            <p className="text-xs text-gray-500 mt-1">{rec.seasonInfo?.seasonType}</p>
            <p className="text-xs text-gray-500">{rec.seasonInfo?.daysToHarvest} days to harvest</p>
            {rec.urgency > 70 && (
              <span className="inline-block mt-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                Sow Soon!
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Component
const CropCalendar = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [calendarEntries, setCalendarEntries] = useState([]);
  const [activities, setActivities] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState(null);
  const [crops, setCrops] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('crops');
  const [activityFilter, setActivityFilter] = useState('upcoming');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [entriesRes, upcomingRes, recommendationsRes, statsRes, cropsRes] = await Promise.all([
        cropCalendarAPI.getCalendarEntries(),
        cropCalendarAPI.getUpcomingActivities(7),
        cropCalendarAPI.getRecommendations(),
        cropCalendarAPI.getStats(),
        cropCalendarAPI.getCrops()
      ]);

      setCalendarEntries(entriesRes.data?.data || []);
      setActivities(upcomingRes.data?.data || []);
      setRecommendations(recommendationsRes.data?.data || []);
      setStats(statsRes.data?.data);
      setCrops(cropsRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCrop = async (formData) => {
    setAddLoading(true);
    try {
      await cropCalendarAPI.createCalendarEntry(formData);
      toast.success('Crop added to calendar!');
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to add crop:', error);
      toast.error(error.response?.data?.message || 'Failed to add crop');
    } finally {
      setAddLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await cropCalendarAPI.updateStatus(id, status);
      toast.success(`Status updated to ${status}`);
      fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!confirm('Delete this crop from calendar? All associated activities will also be deleted.')) return;
    try {
      await cropCalendarAPI.deleteCalendarEntry(id);
      toast.success('Crop removed from calendar');
      fetchData();
    } catch (error) {
      console.error('Failed to delete entry:', error);
      toast.error('Failed to delete crop');
    }
  };

  const handleCompleteActivity = async (id) => {
    try {
      await cropCalendarAPI.completeActivity(id);
      toast.success('Activity marked as complete');
      fetchData();
    } catch (error) {
      console.error('Failed to complete activity:', error);
      toast.error('Failed to complete activity');
    }
  };

  const handleSkipActivity = async (id) => {
    try {
      await cropCalendarAPI.skipActivity(id);
      toast.success('Activity skipped');
      fetchData();
    } catch (error) {
      console.error('Failed to skip activity:', error);
      toast.error('Failed to skip activity');
    }
  };

  const fetchActivities = async (filter) => {
    setActivityFilter(filter);
    try {
      let res;
      switch (filter) {
        case 'today':
          res = await cropCalendarAPI.getTodayActivities();
          break;
        case 'overdue':
          res = await cropCalendarAPI.getOverdueActivities();
          break;
        default:
          res = await cropCalendarAPI.getUpcomingActivities(7);
      }
      setActivities(res.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HiCalendar className="w-7 h-7 text-primary-500" />
            {t('cropCalendar') || 'Crop Calendar'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Plan and track your crops throughout the season
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <HiPlus className="w-5 h-5" />
          Add Crop
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FaSeedling className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeCrops}</p>
                <p className="text-sm text-gray-500">Active Crops</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <HiClock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.upcomingActivities}</p>
                <p className="text-sm text-gray-500">Upcoming Tasks</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <HiExclamation className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overdueActivities}</p>
                <p className="text-sm text-gray-500">Overdue</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <HiCalendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.year}</p>
                <p className="text-sm text-gray-500">Season</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <RecommendationsPanel
        recommendations={recommendations}
        onAddCrop={(cropId) => {
          setShowAddModal(true);
        }}
      />

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('crops')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'crops'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Crops
        </button>
        <button
          onClick={() => setActiveTab('activities')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'activities'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Activities
        </button>
      </div>

      {/* Content */}
      {activeTab === 'crops' ? (
        <div>
          {calendarEntries.length === 0 ? (
            <div className="text-center py-12">
              <FaSeedling className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No crops planned yet</h3>
              <p className="text-gray-500 mb-4">Start by adding a crop to your calendar</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <HiPlus className="w-5 h-5" />
                Add Your First Crop
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {calendarEntries.map(crop => (
                <CropCard
                  key={crop._id}
                  crop={crop}
                  onStatusUpdate={handleStatusUpdate}
                  onDelete={handleDeleteEntry}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Activity Filters */}
          <div className="flex gap-2 mb-4">
            {['upcoming', 'today', 'overdue'].map(filter => (
              <button
                key={filter}
                onClick={() => fetchActivities(filter)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activityFilter === filter
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {activities.length === 0 ? (
            <div className="text-center py-12">
              <HiCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No {activityFilter} activities
              </h3>
              <p className="text-gray-500">
                {activityFilter === 'overdue' ? 'Great! You\'re all caught up.' : 'Add a crop to start receiving activity reminders.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map(activity => (
                <ActivityCard
                  key={activity._id}
                  activity={activity}
                  onComplete={handleCompleteActivity}
                  onSkip={handleSkipActivity}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Crop Modal */}
      <AddCropModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCrop}
        crops={crops}
        loading={addLoading}
      />
    </div>
  );
};

export default CropCalendar;
