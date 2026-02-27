const IoTData = require('../models/IoTData');
const IoTDevice = require('../models/IoTDevice');
const notificationService = require('../services/notificationService');
const translationService = require('../services/translationService');
const User = require('../models/User');

// Helper to get user's preferred language
const getUserLanguage = async (req) => {
  const language = req.query.language || req.body.language;
  if (language) return language;

  if (req.user && req.user.preferredLanguage) {
    return req.user.preferredLanguage;
  }

  try {
    const user = await User.findById(req.user._id).select('preferredLanguage');
    return user?.preferredLanguage || 'en';
  } catch {
    return 'en';
  }
};

// Sensor type translations (for display)
const sensorTypeNames = {
  soil_moisture: 'Soil Moisture',
  temperature: 'Temperature',
  humidity: 'Humidity',
  ph: 'pH Level',
  light: 'Light Intensity',
  rain: 'Rainfall',
  wind: 'Wind Speed'
};

// Status translations
const statusNames = {
  normal: 'Normal',
  warning: 'Warning',
  critical: 'Critical'
};

// Helper to translate sensor data
const translateSensorData = async (sensor, targetLang) => {
  if (!sensor || targetLang === 'en') return sensor;

  const sensorObj = sensor.toObject ? sensor.toObject() : { ...sensor };

  // Translate sensor type name
  if (sensorObj.sensorType && sensorTypeNames[sensorObj.sensorType]) {
    const translated = await translationService.translateFromEnglish(
      sensorTypeNames[sensorObj.sensorType],
      targetLang
    );
    sensorObj.translatedSensorType = translated.translatedText;
  }

  // Translate status
  if (sensorObj.status && statusNames[sensorObj.status]) {
    const translated = await translationService.translateFromEnglish(
      statusNames[sensorObj.status],
      targetLang
    );
    sensorObj.translatedStatus = translated.translatedText;
  }

  // Translate device name
  if (sensorObj.deviceName) {
    const translated = await translationService.translateFromEnglish(sensorObj.deviceName, targetLang);
    sensorObj.translatedDeviceName = translated.translatedText;
  }

  return sensorObj;
};

// ==================== DEVICE MANAGEMENT ====================

// @desc    Get all devices for user
// @route   GET /api/iot/devices
exports.getDevices = async (req, res) => {
  try {
    const devices = await IoTDevice.find({ owner: req.user._id })
      .select('-secretKey')
      .sort({ createdAt: -1 });

    // Mark offline devices
    await IoTDevice.markOfflineDevices();

    res.status(200).json({
      success: true,
      devices,
      count: devices.length
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get devices'
    });
  }
};

// @desc    Register/Pair a device to user account (via QR scan)
// @route   POST /api/iot/devices/register
exports.registerDevice = async (req, res) => {
  try {
    const { deviceId, secretKey, name } = req.body;

    if (!deviceId || !secretKey) {
      return res.status(400).json({
        success: false,
        message: 'Device ID and secret key are required'
      });
    }

    // Find the device
    const device = await IoTDevice.findOne({ deviceId });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found. Please check the QR code.'
      });
    }

    // Verify secret key
    if (!device.verifySecret(secretKey)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid device credentials'
      });
    }

    // Check if already registered to someone else
    if (device.isRegistered && device.owner && device.owner.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'This device is already registered to another user'
      });
    }

    // Register to current user
    device.owner = req.user._id;
    device.isRegistered = true;
    if (name) device.name = name;
    await device.save();

    res.status(200).json({
      success: true,
      message: 'Device registered successfully!',
      device: {
        _id: device._id,
        deviceId: device.deviceId,
        name: device.name,
        type: device.type,
        isOnline: device.isOnline,
        sensors: device.sensors
      }
    });
  } catch (error) {
    console.error('Register device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register device'
    });
  }
};

// @desc    Unregister/Remove a device from user account
// @route   DELETE /api/iot/devices/:deviceId
exports.removeDevice = async (req, res) => {
  try {
    const device = await IoTDevice.findOne({
      deviceId: req.params.deviceId,
      owner: req.user._id
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Unregister (don't delete, just remove owner)
    device.owner = null;
    device.isRegistered = false;
    device.name = 'My Sensor';
    await device.save();

    res.status(200).json({
      success: true,
      message: 'Device removed successfully'
    });
  } catch (error) {
    console.error('Remove device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove device'
    });
  }
};

// @desc    Update device settings
// @route   PUT /api/iot/devices/:deviceId
exports.updateDevice = async (req, res) => {
  try {
    const { name, location, settings, sensors } = req.body;

    const device = await IoTDevice.findOne({
      deviceId: req.params.deviceId,
      owner: req.user._id
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    if (name) device.name = name;
    if (location) device.location = location;
    if (settings) device.settings = { ...device.settings, ...settings };
    if (sensors) device.sensors = sensors;

    await device.save();

    res.status(200).json({
      success: true,
      device: {
        _id: device._id,
        deviceId: device.deviceId,
        name: device.name,
        type: device.type,
        location: device.location,
        settings: device.settings,
        sensors: device.sensors
      }
    });
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update device'
    });
  }
};

// @desc    Get device status and latest data
// @route   GET /api/iot/devices/:deviceId/status
exports.getDeviceStatus = async (req, res) => {
  try {
    const device = await IoTDevice.findOne({
      deviceId: req.params.deviceId,
      owner: req.user._id
    }).select('-secretKey');

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Check if device is actually online (last seen within 5 mins)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (device.lastSeen && device.lastSeen < fiveMinutesAgo) {
      device.isOnline = false;
      await device.save();
    }

    res.status(200).json({
      success: true,
      device
    });
  } catch (error) {
    console.error('Get device status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get device status'
    });
  }
};

// @desc    Provision a new device (for manufacturers/admin)
// @route   POST /api/iot/devices/provision
exports.provisionDevice = async (req, res) => {
  try {
    const { type, sensors } = req.body;

    // Generate unique credentials
    const { deviceId, secretKey } = IoTDevice.generateDeviceCredentials();

    const device = await IoTDevice.create({
      deviceId,
      secretKey,
      type: type || 'multi_sensor',
      sensors: sensors || [
        { type: 'soil_moisture', enabled: true, unit: '%', thresholds: { min: 20, max: 80 } },
        { type: 'temperature', enabled: true, unit: '°C', thresholds: { min: 10, max: 40 } },
        { type: 'humidity', enabled: true, unit: '%', thresholds: { min: 30, max: 90 } }
      ]
    });

    // Return QR data for device provisioning
    res.status(201).json({
      success: true,
      message: 'Device provisioned successfully',
      device: {
        deviceId: device.deviceId,
        secretKey: device.secretKey, // Only return this once during provisioning!
        qrData: device.getQRData(),
        type: device.type,
        sensors: device.sensors
      }
    });
  } catch (error) {
    console.error('Provision device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to provision device'
    });
  }
};

// ==================== DEVICE DATA ENDPOINTS (for ESP32) ====================

// @desc    Device sends sensor data (called by ESP32)
// @route   POST /api/iot/device/data
exports.deviceSendData = async (req, res) => {
  try {
    const { deviceId, secretKey, readings } = req.body;

    if (!deviceId || !secretKey) {
      return res.status(401).json({
        success: false,
        message: 'Device credentials required'
      });
    }

    // Find and verify device
    const device = await IoTDevice.findOne({ deviceId });

    if (!device || !device.verifySecret(secretKey)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid device credentials'
      });
    }

    if (!device.isRegistered || !device.owner) {
      return res.status(403).json({
        success: false,
        message: 'Device not registered to any user'
      });
    }

    // Update device heartbeat
    await device.updateHeartbeat(readings);

    // Store each sensor reading
    const storedReadings = [];
    for (const reading of readings) {
      const sensorConfig = device.sensors.find(s => s.type === reading.type);

      // Determine status based on thresholds
      let status = 'normal';
      if (sensorConfig?.thresholds) {
        if (reading.value < sensorConfig.thresholds.min) status = 'warning';
        if (reading.value > sensorConfig.thresholds.max) status = 'critical';
      }

      const data = await IoTData.create({
        user: device.owner,
        deviceId: device.deviceId,
        deviceName: device.name,
        sensorType: reading.type,
        value: reading.value,
        unit: reading.unit || sensorConfig?.unit || '',
        location: device.location,
        thresholds: sensorConfig?.thresholds,
        status
      });

      storedReadings.push(data);

      // Send alert if critical
      if (status === 'critical' && device.settings.alertsEnabled) {
        await notificationService.sendIoTAlert(device.owner, {
          deviceName: device.name,
          sensorType: reading.type,
          value: reading.value,
          unit: reading.unit,
          status
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Data received',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Device send data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process data'
    });
  }
};

// @desc    Device heartbeat/ping
// @route   POST /api/iot/device/heartbeat
exports.deviceHeartbeat = async (req, res) => {
  try {
    const { deviceId, secretKey } = req.body;

    const device = await IoTDevice.findOne({ deviceId });

    if (!device || !device.verifySecret(secretKey)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    device.isOnline = true;
    device.lastSeen = new Date();
    await device.save();

    res.status(200).json({
      success: true,
      serverTime: new Date().toISOString(),
      settings: device.settings
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// ==================== ORIGINAL ENDPOINTS ====================

// @desc    Get all sensor data for user
// @route   GET /api/iot/sensors
exports.getSensorData = async (req, res) => {
  try {
    const userId = req.user._id;
    const targetLang = await getUserLanguage(req);

    // Get latest reading for each sensor type
    const sensorTypes = ['soil_moisture', 'temperature', 'humidity', 'ph', 'light', 'rain', 'wind'];

    const latestReadings = await Promise.all(
      sensorTypes.map(async (type) => {
        const reading = await IoTData.findOne({ user: userId, sensorType: type })
          .sort({ createdAt: -1 });
        return reading;
      })
    );

    // Filter out null readings
    let sensors = latestReadings.filter(reading => reading !== null);

    // Translate sensor data if needed
    if (targetLang !== 'en') {
      sensors = await Promise.all(
        sensors.map(sensor => translateSensorData(sensor, targetLang))
      );
    }

    res.status(200).json({
      success: true,
      sensors,
      lastUpdated: sensors.length > 0 ? sensors[0].createdAt : null
    });
  } catch (error) {
    console.error('Get sensor data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sensor data'
    });
  }
};

// @desc    Submit sensor reading
// @route   POST /api/iot/data
exports.addSensorData = async (req, res) => {
  try {
    const { deviceId, deviceName, sensorType, value, unit, location, thresholds } = req.body;
    const userId = req.user._id;

    // Determine status based on thresholds
    let status = 'normal';
    if (thresholds) {
      if (value < thresholds.min) status = 'warning';
      if (value > thresholds.max) status = 'critical';
    }

    const sensorData = await IoTData.create({
      user: userId,
      deviceId,
      deviceName: deviceName || 'Sensor',
      sensorType,
      value,
      unit,
      location,
      thresholds,
      status
    });

    // Send alert if status is not normal
    if (status !== 'normal') {
      await notificationService.sendIoTAlert(userId, {
        sensorType,
        value,
        unit,
        status
      });
    }

    res.status(201).json({
      success: true,
      data: sensorData
    });
  } catch (error) {
    console.error('Add sensor data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add sensor data'
    });
  }
};

// @desc    Get sensor data history
// @route   GET /api/iot/history
exports.getSensorHistory = async (req, res) => {
  try {
    const { sensorType, deviceId, startDate, endDate, limit = 100 } = req.query;
    const userId = req.user._id;
    const targetLang = await getUserLanguage(req);

    const query = { user: userId };
    if (sensorType) query.sensorType = sensorType;
    if (deviceId) query.deviceId = deviceId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    let history = await IoTData.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Translate history data if needed
    if (targetLang !== 'en') {
      history = await Promise.all(
        history.map(sensor => translateSensorData(sensor, targetLang))
      );
    }

    res.status(200).json({
      success: true,
      history,
      count: history.length
    });
  } catch (error) {
    console.error('Get sensor history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sensor history'
    });
  }
};

// @desc    Update alert thresholds
// @route   PUT /api/iot/thresholds
exports.updateThresholds = async (req, res) => {
  try {
    const { deviceId, sensorType, thresholds } = req.body;
    const userId = req.user._id;

    // Update thresholds for all matching sensors
    await IoTData.updateMany(
      { user: userId, deviceId, sensorType },
      { thresholds }
    );

    res.status(200).json({
      success: true,
      message: 'Thresholds updated successfully'
    });
  } catch (error) {
    console.error('Update thresholds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update thresholds'
    });
  }
};

// Generate mock IoT data for demo purposes
exports.generateMockData = async (req, res) => {
  try {
    const userId = req.user._id;
    const mockSensors = [
      { sensorType: 'soil_moisture', value: 65, unit: '%', deviceId: 'SENSOR001', deviceName: 'Field Sensor 1' },
      { sensorType: 'temperature', value: 28, unit: '°C', deviceId: 'SENSOR002', deviceName: 'Weather Station' },
      { sensorType: 'humidity', value: 72, unit: '%', deviceId: 'SENSOR002', deviceName: 'Weather Station' },
      { sensorType: 'ph', value: 6.5, unit: 'pH', deviceId: 'SENSOR003', deviceName: 'Soil Analyzer' },
      { sensorType: 'light', value: 850, unit: 'lux', deviceId: 'SENSOR004', deviceName: 'Light Sensor' }
    ];

    const createdData = await Promise.all(
      mockSensors.map(sensor =>
        IoTData.create({
          user: userId,
          ...sensor,
          status: 'normal',
          thresholds: { min: 0, max: 100 }
        })
      )
    );

    res.status(201).json({
      success: true,
      message: 'Mock data generated',
      data: createdData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate mock data'
    });
  }
};
