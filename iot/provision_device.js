/**
 * Device Provisioning Script
 * --------------------------
 * Run this script to provision new IoT devices and generate QR codes
 *
 * Usage:
 *   node provision_device.js
 *
 * This will:
 * 1. Call the backend API to create a new device
 * 2. Generate a QR code image
 * 3. Save the QR code as PNG file
 *
 * Requirements:
 *   npm install qrcode axios
 */

const axios = require('axios');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:5000/api';
const ADMIN_TOKEN = 'YOUR_ADMIN_JWT_TOKEN'; // Get this after admin login

async function provisionDevice(type = 'multi_sensor') {
  try {
    console.log('\n========================================');
    console.log('    AgriBot Device Provisioning Tool');
    console.log('========================================\n');

    // Call provision API
    console.log('Provisioning new device...');
    const response = await axios.post(
      `${API_URL}/iot/devices/provision`,
      { type },
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const device = response.data.device;

    console.log('\nDevice Provisioned Successfully!');
    console.log('--------------------------------');
    console.log(`Device ID: ${device.deviceId}`);
    console.log(`Secret Key: ${device.secretKey}`);
    console.log(`Type: ${device.type}`);
    console.log(`QR Data: ${device.qrData}`);

    // Generate QR code
    const qrFileName = `qr_${device.deviceId}.png`;
    const qrFilePath = path.join(__dirname, 'qrcodes', qrFileName);

    // Create qrcodes directory if it doesn't exist
    const qrDir = path.join(__dirname, 'qrcodes');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir);
    }

    // Generate QR code image
    await QRCode.toFile(qrFilePath, device.qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    console.log(`\nQR Code saved: ${qrFilePath}`);
    console.log('\n========================================');
    console.log('         DEVICE CREDENTIALS');
    console.log('========================================');
    console.log(`\nFor ESP32 Arduino code, use:`);
    console.log(`const char* DEVICE_ID = "${device.deviceId}";`);
    console.log(`const char* SECRET_KEY = "${device.secretKey}";`);
    console.log('\n========================================\n');

    // Also save credentials to a file
    const credFile = path.join(__dirname, 'qrcodes', `${device.deviceId}_credentials.txt`);
    const credContent = `
AgriBot Device Credentials
==========================
Device ID: ${device.deviceId}
Secret Key: ${device.secretKey}
Type: ${device.type}
QR Data: ${device.qrData}

ESP32 Code:
-----------
const char* DEVICE_ID = "${device.deviceId}";
const char* SECRET_KEY = "${device.secretKey}";

Generated: ${new Date().toISOString()}
`;
    fs.writeFileSync(credFile, credContent);
    console.log(`Credentials saved: ${credFile}`);

    return device;
  } catch (error) {
    console.error('Error provisioning device:', error.response?.data || error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  // Check if admin token is set
  if (ADMIN_TOKEN === 'YOUR_ADMIN_JWT_TOKEN') {
    console.log('ERROR: Please set ADMIN_TOKEN in the script');
    console.log('1. Login to admin dashboard');
    console.log('2. Get JWT token from localStorage');
    console.log('3. Replace YOUR_ADMIN_JWT_TOKEN with actual token');
    process.exit(1);
  }

  provisionDevice()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { provisionDevice };
