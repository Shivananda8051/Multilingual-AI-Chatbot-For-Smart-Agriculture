import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiBell,
  HiCurrencyRupee,
  HiCloud,
  HiDocumentText,
  HiCog,
  HiPlus,
  HiTrash,
  HiCheck,
  HiX,
  HiRefresh,
  HiCheckCircle,
  HiExclamationCircle
} from 'react-icons/hi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { alertsAPI, mandiAPI } from '../services/api';
import { getFCMToken } from '../config/firebase';
import toast from 'react-hot-toast';

const NotificationSettings = () => {
  const { t } = useLanguage();
  const { updateFCMToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscriptions, setSubscriptions] = useState(null);
  const [states, setStates] = useState([]);
  const [pushStatus, setPushStatus] = useState('unknown'); // unknown, granted, denied, unsupported
  const [enablingPush, setEnablingPush] = useState(false);

  // Check push notification status
  useEffect(() => {
    if (!('Notification' in window)) {
      setPushStatus('unsupported');
    } else if (Notification.permission === 'granted') {
      setPushStatus('granted');
    } else if (Notification.permission === 'denied') {
      setPushStatus('denied');
    } else {
      setPushStatus('default');
    }
  }, []);

  const handleEnablePush = async () => {
    setEnablingPush(true);
    try {
      // Get FCM token directly
      const fcmToken = await getFCMToken();
      console.log('Got FCM token:', fcmToken ? 'Yes' : 'No');

      if (fcmToken) {
        // Register with alerts API directly (saves to AlertSubscription)
        await alertsAPI.registerToken(fcmToken);
        console.log('FCM token registered with alerts API');

        // Also update via auth API (saves to User model)
        await updateFCMToken(false);

        setPushStatus('granted');
        toast.success(t('pushEnabled') || 'Push notifications enabled!');
      } else {
        throw new Error('Failed to get push notification token');
      }
    } catch (error) {
      console.error('Failed to enable push:', error);
      const errorMsg = error.message || 'Failed to enable push notifications';
      toast.error(errorMsg);

      // Update status based on actual permission
      if ('Notification' in window) {
        setPushStatus(Notification.permission === 'denied' ? 'denied' : 'default');
      }
    } finally {
      setEnablingPush(false);
    }
  };

  // Price alert form
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [alertForm, setAlertForm] = useState({
    commodity: '',
    state: '',
    alertType: 'any_change',
    targetPrice: '',
    percentageChange: 5
  });

  // Fetch subscriptions and states
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subsRes, statesRes] = await Promise.all([
          alertsAPI.getSubscriptions(),
          mandiAPI.getStates()
        ]);

        if (subsRes.data?.success) {
          // Set default values if subscription doesn't exist yet
          setSubscriptions(subsRes.data.data || {
            priceAlerts: [],
            weatherAlerts: { enabled: false },
            schemeAlerts: { enabled: false },
            preferences: {}
          });
        }
        if (statesRes.data?.success) {
          setStates(statesRes.data.states || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Set default values on error
        setSubscriptions({
          priceAlerts: [],
          weatherAlerts: { enabled: false },
          schemeAlerts: { enabled: false },
          preferences: {}
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddPriceAlert = async (e) => {
    e.preventDefault();
    if (!alertForm.commodity) {
      toast.error('Please enter a commodity name');
      return;
    }

    setSaving(true);
    try {
      const response = await alertsAPI.addPriceAlert(alertForm);
      if (response.data?.success) {
        setSubscriptions(prev => ({
          ...prev,
          priceAlerts: response.data.data
        }));
        setShowAddAlert(false);
        setAlertForm({
          commodity: '',
          state: '',
          alertType: 'any_change',
          targetPrice: '',
          percentageChange: 5
        });
        toast.success('Price alert added');
      }
    } catch (error) {
      console.error('Failed to add alert:', error);
      toast.error(error.response?.data?.message || 'Failed to add alert');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePriceAlert = async (alertId) => {
    try {
      const response = await alertsAPI.removePriceAlert(alertId);
      if (response.data?.success) {
        setSubscriptions(prev => ({
          ...prev,
          priceAlerts: response.data.data
        }));
        toast.success('Alert removed');
      }
    } catch (error) {
      console.error('Failed to remove alert:', error);
      toast.error('Failed to remove alert');
    }
  };

  const handleWeatherToggle = async (enabled) => {
    setSaving(true);
    try {
      const response = await alertsAPI.updateWeatherAlerts({ enabled });
      if (response.data?.success) {
        setSubscriptions(prev => ({
          ...prev,
          weatherAlerts: response.data.data
        }));
        toast.success(`Weather alerts ${enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Failed to update weather alerts:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSchemeToggle = async (enabled) => {
    setSaving(true);
    try {
      const response = await alertsAPI.updateSchemeAlerts({ enabled });
      if (response.data?.success) {
        setSubscriptions(prev => ({
          ...prev,
          schemeAlerts: response.data.data
        }));
        toast.success(`Scheme alerts ${enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Failed to update scheme alerts:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      const response = await alertsAPI.sendTestNotification();
      toast.success(response.data?.message || 'Test notification sent!');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      // Show info message instead of error for expected "no FCM token" case
      const message = error.response?.data?.message || 'Push notifications not configured';
      if (error.response?.status === 400) {
        toast(message, { icon: 'ℹ️' });
      } else {
        toast.error(message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
              <HiBell className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('notificationSettings') || 'Notification Settings'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('manageAlerts') || 'Manage your price alerts and notifications'}
              </p>
            </div>
          </div>
          <button
            onClick={handleTestNotification}
            className="btn btn-secondary text-sm"
          >
            <HiBell className="w-4 h-4" />
            {t('testNotification') || 'Test'}
          </button>
        </div>
      </motion.div>

      {/* Push Notification Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {pushStatus === 'granted' ? (
              <HiCheckCircle className="w-6 h-6 text-green-500" />
            ) : pushStatus === 'denied' ? (
              <HiExclamationCircle className="w-6 h-6 text-red-500" />
            ) : (
              <HiExclamationCircle className="w-6 h-6 text-yellow-500" />
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {t('pushNotifications') || 'Push Notifications'}
              </p>
              <p className="text-sm text-gray-500">
                {pushStatus === 'granted'
                  ? (t('pushStatusEnabled') || 'Enabled - You will receive push notifications')
                  : pushStatus === 'denied'
                  ? (t('pushStatusDenied') || 'Blocked - Enable in browser settings')
                  : pushStatus === 'unsupported'
                  ? (t('pushStatusUnsupported') || 'Not supported in this browser')
                  : (t('pushStatusDefault') || 'Click enable to receive push notifications')}
              </p>
            </div>
          </div>
          {pushStatus !== 'granted' && pushStatus !== 'unsupported' && (
            <button
              onClick={handleEnablePush}
              disabled={enablingPush || pushStatus === 'denied'}
              className="btn btn-primary text-sm"
            >
              {enablingPush ? (
                <>
                  <HiRefresh className="w-4 h-4 animate-spin" />
                  {t('enabling') || 'Enabling...'}
                </>
              ) : (
                <>
                  <HiBell className="w-4 h-4" />
                  {t('enablePush') || 'Enable'}
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>

      {/* Price Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HiCurrencyRupee className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('priceAlerts') || 'Price Alerts'}
            </h2>
          </div>
          <button
            onClick={() => setShowAddAlert(!showAddAlert)}
            className="btn btn-primary text-sm"
          >
            <HiPlus className="w-4 h-4" />
            {t('addAlert') || 'Add Alert'}
          </button>
        </div>

        {/* Add Alert Form */}
        {showAddAlert && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddPriceAlert}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('commodity') || 'Commodity'} *
                </label>
                <input
                  type="text"
                  value={alertForm.commodity}
                  onChange={(e) => setAlertForm(prev => ({ ...prev, commodity: e.target.value }))}
                  className="input-field w-full"
                  placeholder="e.g., Wheat, Rice, Onion"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('state') || 'State'}
                </label>
                <select
                  value={alertForm.state}
                  onChange={(e) => setAlertForm(prev => ({ ...prev, state: e.target.value }))}
                  className="input-field w-full"
                >
                  <option value="">{t('allStates') || 'All States'}</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('alertType') || 'Alert Type'}
                </label>
                <select
                  value={alertForm.alertType}
                  onChange={(e) => setAlertForm(prev => ({ ...prev, alertType: e.target.value }))}
                  className="input-field w-full"
                >
                  <option value="any_change">{t('anyChange') || 'Any Price Change'}</option>
                  <option value="above">{t('priceAbove') || 'Price Goes Above'}</option>
                  <option value="below">{t('priceBelow') || 'Price Goes Below'}</option>
                </select>
              </div>
              {alertForm.alertType !== 'any_change' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('targetPrice') || 'Target Price (₹/Quintal)'}
                  </label>
                  <input
                    type="number"
                    value={alertForm.targetPrice}
                    onChange={(e) => setAlertForm(prev => ({ ...prev, targetPrice: e.target.value }))}
                    className="input-field w-full"
                    placeholder="e.g., 2500"
                  />
                </div>
              )}
              {alertForm.alertType === 'any_change' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('percentageChange') || 'Alert when % change'}
                  </label>
                  <input
                    type="number"
                    value={alertForm.percentageChange}
                    onChange={(e) => setAlertForm(prev => ({ ...prev, percentageChange: e.target.value }))}
                    className="input-field w-full"
                    placeholder="5"
                    min="1"
                    max="50"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowAddAlert(false)}
                className="btn btn-secondary"
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? t('saving') || 'Saving...' : t('saveAlert') || 'Save Alert'}
              </button>
            </div>
          </motion.form>
        )}

        {/* Existing Alerts */}
        <div className="space-y-3">
          {subscriptions?.priceAlerts?.length > 0 ? (
            subscriptions.priceAlerts.map((alert) => (
              <div
                key={alert._id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {alert.commodity}
                  </p>
                  <p className="text-xs text-gray-500">
                    {alert.state || 'All States'} •{' '}
                    {alert.alertType === 'any_change'
                      ? `${alert.percentageChange}% change`
                      : `${alert.alertType} ₹${alert.targetPrice}`}
                  </p>
                </div>
                <button
                  onClick={() => handleRemovePriceAlert(alert._id)}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <HiTrash className="w-5 h-5" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">
              {t('noPriceAlerts') || 'No price alerts set. Add one to get notified!'}
            </p>
          )}
        </div>
      </motion.div>

      {/* Weather Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HiCloud className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('weatherAlerts') || 'Weather Alerts'}
              </h2>
              <p className="text-sm text-gray-500">
                {t('weatherAlertsDesc') || 'Get alerts for extreme weather conditions'}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={subscriptions?.weatherAlerts?.enabled || false}
              onChange={(e) => handleWeatherToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
          </label>
        </div>

        {subscriptions?.weatherAlerts?.enabled && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t('weatherAlertsActive') || 'You will receive alerts for rain, frost, heatwave, and storm warnings in your area.'}
            </p>
          </div>
        )}
      </motion.div>

      {/* Scheme Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HiDocumentText className="w-6 h-6 text-purple-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('schemeAlerts') || 'Scheme Alerts'}
              </h2>
              <p className="text-sm text-gray-500">
                {t('schemeAlertsDesc') || 'Get notified about new government schemes'}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={subscriptions?.schemeAlerts?.enabled || false}
              onChange={(e) => handleSchemeToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
          </label>
        </div>

        {subscriptions?.schemeAlerts?.enabled && (
          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              {t('schemeAlertsActive') || 'You will receive alerts for new subsidies, loans, insurance, and training programs.'}
            </p>
          </div>
        )}
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-4 bg-gray-50 dark:bg-gray-800"
      >
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {t('notificationNote') || 'Make sure notifications are enabled in your browser/device settings to receive alerts.'}
        </p>
      </motion.div>
    </div>
  );
};

export default NotificationSettings;
