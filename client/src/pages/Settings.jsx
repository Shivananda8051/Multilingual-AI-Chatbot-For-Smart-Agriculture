import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiCog,
  HiBell,
  HiGlobe,
  HiSun,
  HiMoon,
  HiVolumeUp,
  HiVolumeOff,
  HiLocationMarker,
  HiCloud,
  HiChip,
  HiChat,
  HiPhotograph,
  HiShieldCheck,
  HiTrash,
  HiCheck,
  HiRefresh
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const Settings = () => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  // Settings state
  const [settings, setSettings] = useState({
    // Notification Settings
    notifications: {
      weatherAlerts: true,
      cropReminders: true,
      communityUpdates: true,
      iotAlerts: true,
      marketPrices: false,
      dailyTips: true,
      sound: true
    },
    // Weather Settings
    weather: {
      unit: 'celsius', // celsius or fahrenheit
      autoLocation: true,
      showForecast: true,
      rainAlerts: true,
      frostAlerts: true
    },
    // Chat Settings
    chat: {
      voiceEnabled: true,
      autoSpeak: false,
      saveHistory: true,
      language: language
    },
    // IoT Settings
    iot: {
      autoRefresh: true,
      refreshInterval: 30, // seconds
      alertThresholds: {
        soilMoistureLow: 30,
        soilMoistureHigh: 80,
        temperatureHigh: 35,
        temperatureLow: 10
      }
    },
    // Privacy Settings
    privacy: {
      showProfile: true,
      showLocation: false,
      showCrops: true
    },
    // Display Settings
    display: {
      compactMode: false,
      animations: true
    }
  });

  // Load saved settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('agribot_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  // Save settings
  const saveSettings = () => {
    localStorage.setItem('agribot_settings', JSON.stringify(settings));
    toast.success(t('settingsSaved') || 'Settings saved successfully');
  };

  // Update nested setting
  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  // Update threshold setting
  const updateThreshold = (key, value) => {
    setSettings(prev => ({
      ...prev,
      iot: {
        ...prev.iot,
        alertThresholds: {
          ...prev.iot.alertThresholds,
          [key]: parseInt(value) || 0
        }
      }
    }));
  };

  // Reset to defaults
  const resetSettings = () => {
    localStorage.removeItem('agribot_settings');
    window.location.reload();
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'te', name: 'Telugu' },
    { code: 'ta', name: 'Tamil' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'mr', name: 'Marathi' },
    { code: 'bn', name: 'Bengali' }
  ];

  const SettingSection = ({ icon: Icon, title, children }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <div className="flex items-center gap-3 mb-4 pb-3 border-b dark:border-gray-700">
        <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </motion.div>
  );

  const Toggle = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  const SelectOption = ({ label, value, options, onChange }) => (
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  const NumberInput = ({ label, value, min, max, unit, onChange }) => (
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none text-center"
        />
        {unit && <span className="text-xs text-gray-500">{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20 lg:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('settings') || 'Settings'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('customizeExperience') || 'Customize your farming experience'}
          </p>
        </div>
        <button
          onClick={saveSettings}
          className="btn btn-primary btn-sm"
        >
          <HiCheck className="w-4 h-4" />
          <span>{t('save') || 'Save'}</span>
        </button>
      </div>

      {/* Display Settings */}
      <SettingSection icon={HiSun} title={t('displaySettings') || 'Display'}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {t('darkMode') || 'Dark Mode'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('darkModeDesc') || 'Switch between light and dark theme'}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              isDark ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform flex items-center justify-center ${
                isDark ? 'translate-x-5' : 'translate-x-0'
              }`}
            >
              {isDark ? (
                <HiMoon className="w-3 h-3 text-primary-600" />
              ) : (
                <HiSun className="w-3 h-3 text-yellow-500" />
              )}
            </span>
          </button>
        </div>
        <Toggle
          label={t('animations') || 'Animations'}
          description={t('animationsDesc') || 'Enable smooth animations'}
          checked={settings.display.animations}
          onChange={(v) => updateSetting('display', 'animations', v)}
        />
        <Toggle
          label={t('compactMode') || 'Compact Mode'}
          description={t('compactModeDesc') || 'Reduce spacing for more content'}
          checked={settings.display.compactMode}
          onChange={(v) => updateSetting('display', 'compactMode', v)}
        />
      </SettingSection>

      {/* Language Settings */}
      <SettingSection icon={HiGlobe} title={t('languageSettings') || 'Language'}>
        <SelectOption
          label={t('appLanguage') || 'App Language'}
          value={language}
          options={languages.map(l => ({ value: l.code, label: l.name }))}
          onChange={(v) => {
            setLanguage(v);
            updateSetting('chat', 'language', v);
          }}
        />
      </SettingSection>

      {/* Notification Settings */}
      <SettingSection icon={HiBell} title={t('notifications') || 'Notifications'}>
        <Toggle
          label={t('notificationSound') || 'Notification Sound'}
          description={t('notificationSoundDesc') || 'Play sound for new notifications'}
          checked={settings.notifications.sound}
          onChange={(v) => updateSetting('notifications', 'sound', v)}
        />
        <Toggle
          label={t('weatherAlerts') || 'Weather Alerts'}
          description={t('weatherAlertsDesc') || 'Get alerts for severe weather'}
          checked={settings.notifications.weatherAlerts}
          onChange={(v) => updateSetting('notifications', 'weatherAlerts', v)}
        />
        <Toggle
          label={t('cropReminders') || 'Crop Reminders'}
          description={t('cropRemindersDesc') || 'Reminders for watering, fertilizing, etc.'}
          checked={settings.notifications.cropReminders}
          onChange={(v) => updateSetting('notifications', 'cropReminders', v)}
        />
        <Toggle
          label={t('iotAlerts') || 'IoT Sensor Alerts'}
          description={t('iotAlertsDesc') || 'Alerts when sensors detect issues'}
          checked={settings.notifications.iotAlerts}
          onChange={(v) => updateSetting('notifications', 'iotAlerts', v)}
        />
        <Toggle
          label={t('communityUpdates') || 'Community Updates'}
          description={t('communityUpdatesDesc') || 'New posts and comments'}
          checked={settings.notifications.communityUpdates}
          onChange={(v) => updateSetting('notifications', 'communityUpdates', v)}
        />
        <Toggle
          label={t('dailyTips') || 'Daily Farming Tips'}
          description={t('dailyTipsDesc') || 'Receive daily farming advice'}
          checked={settings.notifications.dailyTips}
          onChange={(v) => updateSetting('notifications', 'dailyTips', v)}
        />
        <Toggle
          label={t('marketPrices') || 'Market Price Updates'}
          description={t('marketPricesDesc') || 'Get notified about crop price changes'}
          checked={settings.notifications.marketPrices}
          onChange={(v) => updateSetting('notifications', 'marketPrices', v)}
        />
      </SettingSection>

      {/* Weather Settings */}
      <SettingSection icon={HiCloud} title={t('weatherSettings') || 'Weather'}>
        <SelectOption
          label={t('temperatureUnit') || 'Temperature Unit'}
          value={settings.weather.unit}
          options={[
            { value: 'celsius', label: 'Celsius (°C)' },
            { value: 'fahrenheit', label: 'Fahrenheit (°F)' }
          ]}
          onChange={(v) => updateSetting('weather', 'unit', v)}
        />
        <Toggle
          label={t('autoLocation') || 'Auto-detect Location'}
          description={t('autoLocationDesc') || 'Use GPS for weather data'}
          checked={settings.weather.autoLocation}
          onChange={(v) => updateSetting('weather', 'autoLocation', v)}
        />
        <Toggle
          label={t('showForecast') || 'Show 3-Day Forecast'}
          description={t('showForecastDesc') || 'Display weather forecast on home'}
          checked={settings.weather.showForecast}
          onChange={(v) => updateSetting('weather', 'showForecast', v)}
        />
        <Toggle
          label={t('rainAlerts') || 'Rain Alerts'}
          description={t('rainAlertsDesc') || 'Get notified before rain'}
          checked={settings.weather.rainAlerts}
          onChange={(v) => updateSetting('weather', 'rainAlerts', v)}
        />
        <Toggle
          label={t('frostAlerts') || 'Frost Alerts'}
          description={t('frostAlertsDesc') || 'Warning for freezing temperatures'}
          checked={settings.weather.frostAlerts}
          onChange={(v) => updateSetting('weather', 'frostAlerts', v)}
        />
      </SettingSection>

      {/* Chat & Voice Settings */}
      <SettingSection icon={HiChat} title={t('chatSettings') || 'Chat & Voice'}>
        <Toggle
          label={t('voiceEnabled') || 'Voice Input'}
          description={t('voiceEnabledDesc') || 'Enable microphone for voice commands'}
          checked={settings.chat.voiceEnabled}
          onChange={(v) => updateSetting('chat', 'voiceEnabled', v)}
        />
        <Toggle
          label={t('autoSpeak') || 'Auto-Speak Responses'}
          description={t('autoSpeakDesc') || 'Automatically read bot responses aloud'}
          checked={settings.chat.autoSpeak}
          onChange={(v) => updateSetting('chat', 'autoSpeak', v)}
        />
        <Toggle
          label={t('saveHistory') || 'Save Chat History'}
          description={t('saveHistoryDesc') || 'Keep conversation history'}
          checked={settings.chat.saveHistory}
          onChange={(v) => updateSetting('chat', 'saveHistory', v)}
        />
      </SettingSection>

      {/* IoT Settings */}
      <SettingSection icon={HiChip} title={t('iotSettings') || 'IoT Sensors'}>
        <Toggle
          label={t('autoRefresh') || 'Auto-Refresh Data'}
          description={t('autoRefreshDesc') || 'Automatically update sensor readings'}
          checked={settings.iot.autoRefresh}
          onChange={(v) => updateSetting('iot', 'autoRefresh', v)}
        />
        <SelectOption
          label={t('refreshInterval') || 'Refresh Interval'}
          value={settings.iot.refreshInterval}
          options={[
            { value: 10, label: '10 seconds' },
            { value: 30, label: '30 seconds' },
            { value: 60, label: '1 minute' },
            { value: 300, label: '5 minutes' }
          ]}
          onChange={(v) => updateSetting('iot', 'refreshInterval', parseInt(v))}
        />
        <div className="pt-2 border-t dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {t('alertThresholds') || 'Alert Thresholds'}
          </p>
          <div className="space-y-3">
            <NumberInput
              label={t('soilMoistureLow') || 'Low Soil Moisture'}
              value={settings.iot.alertThresholds.soilMoistureLow}
              min={0}
              max={100}
              unit="%"
              onChange={(v) => updateThreshold('soilMoistureLow', v)}
            />
            <NumberInput
              label={t('soilMoistureHigh') || 'High Soil Moisture'}
              value={settings.iot.alertThresholds.soilMoistureHigh}
              min={0}
              max={100}
              unit="%"
              onChange={(v) => updateThreshold('soilMoistureHigh', v)}
            />
            <NumberInput
              label={t('temperatureHigh') || 'High Temperature Alert'}
              value={settings.iot.alertThresholds.temperatureHigh}
              min={0}
              max={50}
              unit="°C"
              onChange={(v) => updateThreshold('temperatureHigh', v)}
            />
            <NumberInput
              label={t('temperatureLow') || 'Low Temperature Alert'}
              value={settings.iot.alertThresholds.temperatureLow}
              min={-10}
              max={30}
              unit="°C"
              onChange={(v) => updateThreshold('temperatureLow', v)}
            />
          </div>
        </div>
      </SettingSection>

      {/* Privacy Settings */}
      <SettingSection icon={HiShieldCheck} title={t('privacySettings') || 'Privacy'}>
        <Toggle
          label={t('showProfile') || 'Public Profile'}
          description={t('showProfileDesc') || 'Allow others to view your profile'}
          checked={settings.privacy.showProfile}
          onChange={(v) => updateSetting('privacy', 'showProfile', v)}
        />
        <Toggle
          label={t('showLocation') || 'Show Location'}
          description={t('showLocationDesc') || 'Display your location on profile'}
          checked={settings.privacy.showLocation}
          onChange={(v) => updateSetting('privacy', 'showLocation', v)}
        />
        <Toggle
          label={t('showCrops') || 'Show Crops'}
          description={t('showCropsDesc') || 'Display crops you grow on profile'}
          checked={settings.privacy.showCrops}
          onChange={(v) => updateSetting('privacy', 'showCrops', v)}
        />
      </SettingSection>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-5 border-red-200 dark:border-red-900"
      >
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-red-200 dark:border-red-900">
          <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <HiTrash className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="font-semibold text-red-600 dark:text-red-400">
            {t('dangerZone') || 'Danger Zone'}
          </h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {t('resetSettings') || 'Reset All Settings'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('resetSettingsDesc') || 'Restore all settings to default values'}
            </p>
          </div>
          <button
            onClick={resetSettings}
            className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <HiRefresh className="w-4 h-4 inline mr-1" />
            {t('reset') || 'Reset'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
