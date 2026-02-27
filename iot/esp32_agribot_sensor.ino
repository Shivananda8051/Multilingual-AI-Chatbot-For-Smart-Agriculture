/*
 * AgriBot ESP32 IoT Sensor
 * --------------------------
 * This code connects your ESP32 to the AgriBot backend
 * and sends sensor data (soil moisture, temperature, humidity)
 *
 * Hardware Required:
 * - ESP32 Development Board
 * - DHT22 (Temperature & Humidity)
 * - Soil Moisture Sensor (Analog)
 * - Optional: pH Sensor, Light Sensor
 *
 * Libraries Required (Install via Arduino Library Manager):
 * - WiFi (built-in)
 * - HTTPClient (built-in)
 * - ArduinoJson (by Benoit Blanchon)
 * - DHT sensor library (by Adafruit)
 *
 * Setup Instructions:
 * 1. Flash this code to your ESP32
 * 2. The device will print its QR code data to Serial Monitor
 * 3. Generate QR code from that data
 * 4. Scan QR in AgriBot app to register device
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ============== CONFIGURATION ==============
// WiFi Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// AgriBot Server (change to your server IP/domain)
const char* SERVER_URL = "http://YOUR_SERVER_IP:5000/api/iot/device";

// Device Credentials (Get these from admin dashboard after provisioning)
// Or generate unique ones and register the device
const char* DEVICE_ID = "AGRI-XXXXXXXX";  // Will be generated
const char* SECRET_KEY = "your_secret_key_here";  // Will be generated

// Sensor Pins
#define DHT_PIN 4           // DHT22 Data Pin
#define SOIL_MOISTURE_PIN 34 // Analog pin for soil moisture
#define LIGHT_SENSOR_PIN 35  // Analog pin for light sensor (optional)

#define DHT_TYPE DHT22

// Reporting interval (milliseconds)
const unsigned long REPORT_INTERVAL = 60000;  // 60 seconds
const unsigned long HEARTBEAT_INTERVAL = 30000; // 30 seconds

// ============== GLOBALS ==============
DHT dht(DHT_PIN, DHT_TYPE);
unsigned long lastReportTime = 0;
unsigned long lastHeartbeatTime = 0;

// Generate unique Device ID from MAC address
String generateDeviceId() {
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char deviceId[20];
  snprintf(deviceId, sizeof(deviceId), "AGRI-%02X%02X%02X%02X",
           mac[2], mac[3], mac[4], mac[5]);
  return String(deviceId);
}

// Generate a simple secret key (in production, use proper crypto)
String generateSecretKey() {
  String key = "";
  const char chars[] = "0123456789abcdef";
  for (int i = 0; i < 32; i++) {
    key += chars[random(16)];
  }
  return key;
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n========================================");
  Serial.println("    AgriBot ESP32 IoT Sensor v1.0");
  Serial.println("========================================\n");

  // Initialize sensors
  dht.begin();
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(LIGHT_SENSOR_PIN, INPUT);

  // Connect to WiFi
  connectWiFi();

  // Print device info for QR code generation
  printDeviceInfo();
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n WiFi Connection Failed!");
    Serial.println("Check credentials and restart.");
  }
}

void printDeviceInfo() {
  String deviceId = generateDeviceId();

  Serial.println("\n========================================");
  Serial.println("         DEVICE INFORMATION");
  Serial.println("========================================");
  Serial.print("Device ID: ");
  Serial.println(deviceId);
  Serial.print("Secret Key: ");
  Serial.println(SECRET_KEY);
  Serial.println("\n--- QR CODE DATA ---");
  Serial.print("agribot://device/");
  Serial.print(deviceId);
  Serial.print("?key=");
  Serial.println(SECRET_KEY);
  Serial.println("\nGenerate a QR code with the above URL");
  Serial.println("and scan it in the AgriBot mobile app");
  Serial.println("========================================\n");
}

// Read sensor values
float readSoilMoisture() {
  int raw = analogRead(SOIL_MOISTURE_PIN);
  // Convert to percentage (calibrate based on your sensor)
  // Dry = 4095, Wet = 0 (for most capacitive sensors)
  float percentage = map(raw, 4095, 0, 0, 100);
  return constrain(percentage, 0, 100);
}

float readTemperature() {
  float temp = dht.readTemperature();
  if (isnan(temp)) {
    Serial.println("Failed to read temperature!");
    return -999;
  }
  return temp;
}

float readHumidity() {
  float humidity = dht.readHumidity();
  if (isnan(humidity)) {
    Serial.println("Failed to read humidity!");
    return -999;
  }
  return humidity;
}

float readLightLevel() {
  int raw = analogRead(LIGHT_SENSOR_PIN);
  // Convert to lux (approximate, calibrate for your sensor)
  float lux = map(raw, 0, 4095, 0, 10000);
  return lux;
}

// Send sensor data to server
void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Skipping data send.");
    connectWiFi();
    return;
  }

  // Read all sensors
  float soilMoisture = readSoilMoisture();
  float temperature = readTemperature();
  float humidity = readHumidity();
  float light = readLightLevel();

  // Create JSON payload
  StaticJsonDocument<512> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["secretKey"] = SECRET_KEY;

  JsonArray readings = doc.createNestedArray("readings");

  // Add soil moisture
  JsonObject soil = readings.createNestedObject();
  soil["type"] = "soil_moisture";
  soil["value"] = soilMoisture;
  soil["unit"] = "%";

  // Add temperature
  if (temperature != -999) {
    JsonObject temp = readings.createNestedObject();
    temp["type"] = "temperature";
    temp["value"] = temperature;
    temp["unit"] = "°C";
  }

  // Add humidity
  if (humidity != -999) {
    JsonObject hum = readings.createNestedObject();
    hum["type"] = "humidity";
    hum["value"] = humidity;
    hum["unit"] = "%";
  }

  // Add light level
  JsonObject lightObj = readings.createNestedObject();
  lightObj["type"] = "light";
  lightObj["value"] = light;
  lightObj["unit"] = "lux";

  // Serialize JSON
  String jsonPayload;
  serializeJson(doc, jsonPayload);

  // Send HTTP POST request
  HTTPClient http;
  String url = String(SERVER_URL) + "/data";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  Serial.println("\nSending sensor data...");
  Serial.println(jsonPayload);

  int httpCode = http.POST(jsonPayload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("Response (");
    Serial.print(httpCode);
    Serial.print("): ");
    Serial.println(response);
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
}

// Send heartbeat to server
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;

  StaticJsonDocument<128> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["secretKey"] = SECRET_KEY;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  HTTPClient http;
  String url = String(SERVER_URL) + "/heartbeat";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(jsonPayload);

  if (httpCode == 200) {
    Serial.println("Heartbeat sent successfully");
  }

  http.end();
}

void loop() {
  unsigned long currentTime = millis();

  // Send sensor data at regular intervals
  if (currentTime - lastReportTime >= REPORT_INTERVAL) {
    sendSensorData();
    lastReportTime = currentTime;
  }

  // Send heartbeat more frequently
  if (currentTime - lastHeartbeatTime >= HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeatTime = currentTime;
  }

  // Small delay to prevent overwhelming the loop
  delay(100);
}

/*
 * ============== WIRING DIAGRAM ==============
 *
 * ESP32          DHT22
 * -----          -----
 * 3.3V  ------>  VCC
 * GND   ------>  GND
 * GPIO4 ------>  DATA (with 10K pullup to VCC)
 *
 * ESP32          Soil Moisture Sensor
 * -----          --------------------
 * 3.3V  ------>  VCC
 * GND   ------>  GND
 * GPIO34 ----->  AOUT (Analog Output)
 *
 * ESP32          Light Sensor (LDR Module)
 * -----          ------------------------
 * 3.3V  ------>  VCC
 * GND   ------>  GND
 * GPIO35 ----->  AO (Analog Output)
 *
 * ============================================
 */
