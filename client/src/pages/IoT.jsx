import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiRefresh,
  HiChartBar,
  HiExclamation,
  HiCheckCircle,
  HiClock,
  HiPlus,
  HiX,
  HiQrcode,
  HiWifi,
  HiTrash,
  HiCog,
  HiStatusOnline,
  HiStatusOffline
} from 'react-icons/hi';
import { WiThermometer, WiHumidity, WiRaindrop } from 'react-icons/wi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { iotAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const sensorIcons = {
  soil_moisture: WiRaindrop,
  temperature: WiThermometer,
  humidity: WiHumidity,
  ph: HiChartBar,
  light: HiChartBar
};

const statusColors = {
  normal: 'text-green-500',
  warning: 'text-yellow-500',
  critical: 'text-red-500'
};

// Demo data for showcasing
const demoDevices = [
  {
    _id: 'demo1',
    deviceId: 'AGRI-SENSOR-001',
    name: 'Field Sensor Node 1',
    isOnline: true,
    lastSeen: new Date(Date.now() - 5 * 60000).toISOString(),
    sensors: ['soil_moisture', 'temperature', 'humidity'],
    lastData: [
      { type: 'Soil Moisture', value: 65, unit: '%' },
      { type: 'Temperature', value: 28, unit: '°C' },
      { type: 'Humidity', value: 72, unit: '%' }
    ]
  },
  {
    _id: 'demo2',
    deviceId: 'AGRI-SENSOR-002',
    name: 'Greenhouse Monitor',
    isOnline: true,
    lastSeen: new Date(Date.now() - 2 * 60000).toISOString(),
    sensors: ['temperature', 'humidity', 'light'],
    lastData: [
      { type: 'Temperature', value: 32, unit: '°C' },
      { type: 'Humidity', value: 85, unit: '%' },
      { type: 'Light', value: 750, unit: 'lux' }
    ]
  },
  {
    _id: 'demo3',
    deviceId: 'AGRI-SENSOR-003',
    name: 'Water Tank Sensor',
    isOnline: false,
    lastSeen: new Date(Date.now() - 3 * 3600000).toISOString(),
    sensors: ['water_level', 'ph'],
    lastData: [
      { type: 'Water Level', value: 78, unit: '%' },
      { type: 'pH', value: 6.8, unit: '' }
    ]
  }
];

const demoSensors = [
  { sensorType: 'soil_moisture', value: 65, unit: '%', status: 'normal', deviceName: 'Field Sensor Node 1' },
  { sensorType: 'temperature', value: 32, unit: '°C', status: 'warning', deviceName: 'Greenhouse Monitor' },
  { sensorType: 'humidity', value: 72, unit: '%', status: 'normal', deviceName: 'Field Sensor Node 1' },
  { sensorType: 'ph', value: 6.8, unit: '', status: 'normal', deviceName: 'Water Tank Sensor' },
  { sensorType: 'light', value: 750, unit: 'lux', status: 'normal', deviceName: 'Greenhouse Monitor' }
];

const generateDemoHistory = () => {
  const data = [];
  for (let i = 24; i >= 0; i--) {
    data.push({
      time: `${i}h`,
      value: Math.floor(50 + Math.random() * 30 + Math.sin(i / 3) * 10)
    });
  }
  return data;
};

const IoT = () => {
  const [activeTab, setActiveTab] = useState('devices'); // devices, sensors
  const [devices, setDevices] = useState(demoDevices);
  const [sensors, setSensors] = useState(demoSensors);
  const [history, setHistory] = useState(generateDemoHistory());
  const [loading, setLoading] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState('soil_moisture');
  const [showScanner, setShowScanner] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [scannedData, setScannedData] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [useDemoData, setUseDemoData] = useState(true);
  const scannerRef = useRef(null);
  const { t } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    loadDevices();
    loadSensorData();
  }, []);

  useEffect(() => {
    if (showScanner && !scannerRef.current) {
      initScanner();
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [showScanner]);

  const initScanner = () => {
    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1
    });

    scanner.render(
      (decodedText) => {
        // Parse QR data: agribot://device/{deviceId}?key={secretKey}
        try {
          const url = new URL(decodedText);
          if (url.protocol === 'agribot:' && url.pathname.startsWith('//device/')) {
            const deviceId = url.pathname.replace('//device/', '');
            const secretKey = url.searchParams.get('key');

            if (deviceId && secretKey) {
              setScannedData({ deviceId, secretKey });
              setShowScanner(false);
              setShowAddDevice(true);
              scanner.clear().catch(console.error);
              scannerRef.current = null;
            }
          } else {
            toast.error(t('invalidQRFormat'));
          }
        } catch (e) {
          toast.error(t('couldNotParseQR'));
        }
      },
      (error) => {
        // Ignore scan errors (normal during scanning)
      }
    );

    scannerRef.current = scanner;
  };

  const loadDevices = async () => {
    try {
      const response = await iotAPI.getDevices();
      if (response.data.devices && response.data.devices.length > 0) {
        setDevices(response.data.devices);
        setUseDemoData(false);
      } else {
        // Use demo data if no real devices
        setDevices(demoDevices);
        setUseDemoData(true);
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
      // Use demo data on error
      setDevices(demoDevices);
      setUseDemoData(true);
    }
  };

  const loadSensorData = async () => {
    try {
      setLoading(true);
      const response = await iotAPI.getSensors();

      if (response.data.sensors && response.data.sensors.length > 0) {
        setSensors(response.data.sensors);
        setSelectedSensor(response.data.sensors[0].sensorType);
        loadHistory(response.data.sensors[0].sensorType);
        setUseDemoData(false);
      } else {
        // Use demo data if no real sensors
        setSensors(demoSensors);
        setSelectedSensor('soil_moisture');
        setHistory(generateDemoHistory());
        setUseDemoData(true);
      }
    } catch (error) {
      console.error('Failed to load sensor data:', error);
      // Use demo data on error
      setSensors(demoSensors);
      setSelectedSensor('soil_moisture');
      setHistory(generateDemoHistory());
      setUseDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (sensorType) => {
    if (useDemoData) {
      // Generate demo history for the selected sensor
      setHistory(generateDemoHistory());
      return;
    }

    try {
      const response = await iotAPI.getHistory({ sensorType, limit: 24 });
      setHistory(response.data.history.reverse().map((item, index) => ({
        time: `${24 - index}h`,
        value: item.value
      })));
    } catch (error) {
      setHistory(generateDemoHistory());
    }
  };

  const handleRegisterDevice = async () => {
    if (!scannedData) return;

    setRegistering(true);
    try {
      const response = await iotAPI.registerDevice(
        scannedData.deviceId,
        scannedData.secretKey,
        deviceName || 'My Sensor'
      );
      toast.success(response.data.message);
      setShowAddDevice(false);
      setScannedData(null);
      setDeviceName('');
      loadDevices();
    } catch (error) {
      toast.error(error.response?.data?.message || t('failedToRegisterDevice'));
    } finally {
      setRegistering(false);
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    if (!confirm(t('removeDeviceConfirm'))) return;

    try {
      await iotAPI.removeDevice(deviceId);
      toast.success(t('deviceRemoved'));
      loadDevices();
    } catch (error) {
      toast.error(t('failedToRemoveDevice'));
    }
  };

  const getSensorDisplayName = (type) => {
    const names = {
      soil_moisture: t('soilMoisture'),
      temperature: t('temperature'),
      humidity: t('humidity'),
      ph: t('phLevel'),
      light: t('light')
    };
    return names[type] || type;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'critical':
      case 'warning':
        return <HiExclamation className={`w-5 h-5 ${statusColors[status]}`} />;
      default:
        return <HiCheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const formatLastSeen = (date) => {
    if (!date) return t('never');
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('justNow');
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t('iot')}</h1>
            {useDemoData && (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                Demo
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">{t('manageDevicesDesc')}</p>
        </div>
        <button
          onClick={() => setShowScanner(true)}
          className="btn btn-primary"
        >
          <HiPlus className="w-5 h-5" />
          {t('addDevice')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('devices')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'devices'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <HiWifi className="w-5 h-5 inline mr-2" />
          {t('devices')} ({devices.length})
        </button>
        <button
          onClick={() => setActiveTab('sensors')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'sensors'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <HiChartBar className="w-5 h-5 inline mr-2" />
          {t('sensorData')}
        </button>
      </div>

      {/* Devices Tab */}
      {activeTab === 'devices' && (
        <div className="space-y-4">
          {devices.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-8 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <HiQrcode className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{t('noDevicesConnected')}</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {t('scanQRToConnect')}
              </p>
              <button
                onClick={() => setShowScanner(true)}
                className="btn btn-primary"
              >
                <HiQrcode className="w-5 h-5" />
                {t('scanDeviceQRCode')}
              </button>
            </motion.div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {devices.map((device, index) => (
                <motion.div
                  key={device._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        device.isOnline
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <HiWifi className={`w-6 h-6 ${
                          device.isOnline ? 'text-green-500' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{device.name}</h3>
                        <p className="text-sm text-gray-500">{device.deviceId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {device.isOnline ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                          <HiStatusOnline className="w-3 h-3" />
                          {t('deviceOnline')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          <HiStatusOffline className="w-3 h-3" />
                          {t('deviceOffline')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Device Info */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <HiClock className="w-4 h-4" />
                      <span>{t('lastSeen')}: {formatLastSeen(device.lastSeen)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <HiCog className="w-4 h-4" />
                      <span>{device.sensors?.length || 0} {t('sensors')}</span>
                    </div>
                  </div>

                  {/* Sensors Preview */}
                  {device.lastData && Object.keys(device.lastData).length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">{t('latestReadings')}</p>
                      <div className="flex flex-wrap gap-2">
                        {device.lastData.map && device.lastData.map((reading, i) => (
                          <span key={i} className="text-sm bg-white dark:bg-gray-700 px-2 py-1 rounded">
                            {reading.type}: {reading.value}{reading.unit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => handleRemoveDevice(device.deviceId)}
                      className="btn btn-outline text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <HiTrash className="w-4 h-4" />
                      {t('remove')}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sensors Tab */}
      {activeTab === 'sensors' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
            </div>
          ) : sensors.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <HiChartBar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{t('noData')}</h3>
              <p className="text-gray-500">
                {t('connectSensorsToStart')}
              </p>
            </div>
          ) : (
            <>
              {/* Sensor Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {sensors.map((sensor, index) => {
                  const Icon = sensorIcons[sensor.sensorType] || HiChartBar;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => {
                        setSelectedSensor(sensor.sensorType);
                        loadHistory(sensor.sensorType);
                      }}
                      className={`card p-4 cursor-pointer transition-all ${
                        selectedSensor === sensor.sensorType
                          ? 'ring-2 ring-primary-500 border-primary-500'
                          : 'hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary-600" />
                        </div>
                        {getStatusIcon(sensor.status)}
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-gray-500">{getSensorDisplayName(sensor.sensorType)}</p>
                        <p className="text-2xl font-bold mt-1">
                          {sensor.value}
                          <span className="text-sm font-normal text-gray-500 ml-1">{sensor.unit}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{sensor.deviceName}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Chart */}
              {selectedSensor && history.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{getSensorDisplayName(selectedSensor)} {t('sensorHistory')}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <HiClock className="w-4 h-4" />
                      {t('last24Hours')}
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#4CAF50"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}

              {/* Alerts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4"
              >
                <h3 className="font-semibold mb-4">{t('alerts')}</h3>
                <div className="space-y-3">
                  {sensors.filter(s => s.status !== 'normal').length === 0 ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <HiCheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-700 dark:text-green-400">{t('allSensorsNormal')}</span>
                    </div>
                  ) : (
                    sensors
                      .filter(s => s.status !== 'normal')
                      .map((sensor, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            sensor.status === 'critical'
                              ? 'bg-red-50 dark:bg-red-900/20'
                              : 'bg-yellow-50 dark:bg-yellow-900/20'
                          }`}
                        >
                          <HiExclamation className={`w-5 h-5 ${statusColors[sensor.status]}`} />
                          <span className={sensor.status === 'critical' ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'}>
                            {getSensorDisplayName(sensor.sensorType)}: {sensor.value}{sensor.unit} ({sensor.status})
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </div>
      )}

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowScanner(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('scanDeviceQRCode')}</h3>
                <button
                  onClick={() => setShowScanner(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <HiX className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                {t('pointCameraAtQR')}
              </p>

              <div id="qr-reader" className="rounded-lg overflow-hidden" />

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400">
                  {t('ensureQRVisible')}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Device Modal (after QR scan) */}
      <AnimatePresence>
        {showAddDevice && scannedData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('addDevice')}</h3>
                <button
                  onClick={() => {
                    setShowAddDevice(false);
                    setScannedData(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <HiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <HiCheckCircle className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-300">{t('deviceFound')}</p>
                      <p className="text-sm text-green-600 dark:text-green-400">{scannedData.deviceId}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('deviceName')}</label>
                  <input
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder={t('deviceNamePlaceholder')}
                    className="input"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('giveDeviceName')}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddDevice(false);
                      setScannedData(null);
                    }}
                    className="btn btn-outline flex-1"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleRegisterDevice}
                    disabled={registering}
                    className="btn btn-primary flex-1"
                  >
                    {registering ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <HiPlus className="w-5 h-5" />
                        {t('addDevice')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IoT;
