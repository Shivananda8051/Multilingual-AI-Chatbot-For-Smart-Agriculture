  1. Install ESP32 Board Package in Arduino IDE:
    - Open Arduino IDE
    - Go to File > Preferences
    - Add this URL to "Additional Board Manager URLs":
    https://espressif.github.io/arduino-esp32/package_esp32_index.json       
    - Go to Tools > Board > Boards Manager
    - Search for "ESP32" and install esp32 by Espressif Systems
  2. Install Required Libraries:
    - Go to Sketch > Include Library > Manage Libraries
    - Install:
        - ArduinoJson by Benoit Blanchon
      - DHT sensor library by Adafruit
  3. Restart VS Code after installation

  The red squiggles in VS Code are just IntelliSense warnings - the code will compile correctly in Arduino IDE even with these warnings showing. The .ino file is designed to be compiled with Arduino IDE or PlatformIO, not as a standalone C++ project.

  Alternative: If you prefer VS Code for ESP32 development, consider installing the PlatformIO extension which handles all library dependencies automatically.