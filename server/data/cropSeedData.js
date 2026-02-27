module.exports = [
  {
    name: 'Rice',
    localNames: { hi: 'चावल', ta: 'அரிசி', te: 'బియ్యం', kn: 'ಅಕ್ಕಿ', ml: 'അരി', bn: 'চাল', mr: 'तांदूळ' },
    category: 'cereals',
    seasons: [
      {
        region: 'north',
        states: ['Punjab', 'Haryana', 'Uttar Pradesh'],
        sowingStartMonth: 6, sowingEndMonth: 7,
        harvestStartMonth: 10, harvestEndMonth: 11,
        daysToGermination: 7, daysToFlowering: 70, daysToHarvest: 120,
        seasonType: 'kharif'
      },
      {
        region: 'south',
        states: ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'],
        sowingStartMonth: 6, sowingEndMonth: 8,
        harvestStartMonth: 11, harvestEndMonth: 1,
        daysToGermination: 5, daysToFlowering: 65, daysToHarvest: 115,
        seasonType: 'kharif'
      }
    ],
    requirements: { soilType: ['clay', 'loam'], phRange: { min: 5.5, max: 7.0 }, temperatureRange: { min: 20, max: 37 }, rainfallRange: { min: 1000, max: 2000 } },
    rotation: { goodSuccessors: ['Wheat', 'Mustard', 'Chickpea'], badSuccessors: ['Rice'], family: 'Poaceae', soilEffect: 'heavy_feeder' },
    activities: [
      { name: 'First Fertilizer (Nitrogen)', daysFromSowing: 25, description: 'Apply nitrogen fertilizer', tips: 'Best applied in standing water' },
      { name: 'Second Fertilizer', daysFromSowing: 45, description: 'Top dressing with urea', tips: 'Drain field before application' }
    ],
    isActive: true
  },
  {
    name: 'Wheat',
    localNames: { hi: 'गेहूं', ta: 'கோதுமை', te: 'గోధుమ', kn: 'ಗೋಧಿ', ml: 'ഗോതമ്പ്', bn: 'গম', mr: 'गहू' },
    category: 'cereals',
    seasons: [
      {
        region: 'north',
        states: ['Punjab', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan'],
        sowingStartMonth: 10, sowingEndMonth: 11,
        harvestStartMonth: 3, harvestEndMonth: 4,
        daysToGermination: 7, daysToFlowering: 75, daysToHarvest: 130,
        seasonType: 'rabi'
      }
    ],
    requirements: { soilType: ['loam', 'clay loam'], phRange: { min: 6.0, max: 7.5 }, temperatureRange: { min: 10, max: 25 }, rainfallRange: { min: 400, max: 700 } },
    rotation: { goodSuccessors: ['Rice', 'Maize', 'Cotton', 'Soybean'], badSuccessors: ['Wheat', 'Barley'], family: 'Poaceae', soilEffect: 'heavy_feeder' },
    activities: [
      { name: 'First Irrigation (CRI Stage)', daysFromSowing: 21, description: 'Crown root initiation stage irrigation', tips: 'Critical for yield' },
      { name: 'Second Irrigation', daysFromSowing: 42, description: 'Tillering stage irrigation', tips: 'Important for tiller development' }
    ],
    isActive: true
  },
  {
    name: 'Cotton',
    localNames: { hi: 'कपास', ta: 'பருத்தி', te: 'పత్తి', kn: 'ಹತ್ತಿ', ml: 'പരുത്തി', bn: 'তুলা', mr: 'कापूस' },
    category: 'cash_crops',
    seasons: [
      {
        region: 'west',
        states: ['Gujarat', 'Maharashtra', 'Rajasthan'],
        sowingStartMonth: 5, sowingEndMonth: 6,
        harvestStartMonth: 10, harvestEndMonth: 12,
        daysToGermination: 10, daysToFlowering: 60, daysToHarvest: 150,
        seasonType: 'kharif'
      },
      {
        region: 'south',
        states: ['Karnataka', 'Andhra Pradesh', 'Telangana'],
        sowingStartMonth: 6, sowingEndMonth: 7,
        harvestStartMonth: 11, harvestEndMonth: 1,
        daysToGermination: 8, daysToFlowering: 55, daysToHarvest: 140,
        seasonType: 'kharif'
      }
    ],
    requirements: { soilType: ['black', 'loam'], phRange: { min: 6.0, max: 8.0 }, temperatureRange: { min: 21, max: 35 }, rainfallRange: { min: 600, max: 1000 } },
    rotation: { goodSuccessors: ['Wheat', 'Chickpea', 'Sorghum'], badSuccessors: ['Cotton'], family: 'Malvaceae', soilEffect: 'heavy_feeder' },
    activities: [
      { name: 'Thinning', daysFromSowing: 20, description: 'Remove excess seedlings', tips: 'Keep one healthy plant per hill' },
      { name: 'First Fertilizer', daysFromSowing: 30, description: 'Apply NPK fertilizer', tips: 'Apply before irrigation' }
    ],
    isActive: true
  },
  {
    name: 'Maize',
    localNames: { hi: 'मक्का', ta: 'மக்காச்சோளம்', te: 'మొక్కజొన్న', kn: 'ಮೆಕ್ಕೆಜೋಳ', ml: 'ചോളം', bn: 'ভুট্টা', mr: 'मका' },
    category: 'cereals',
    seasons: [
      {
        region: 'north',
        states: ['Bihar', 'Uttar Pradesh', 'Madhya Pradesh'],
        sowingStartMonth: 6, sowingEndMonth: 7,
        harvestStartMonth: 9, harvestEndMonth: 10,
        daysToGermination: 5, daysToFlowering: 55, daysToHarvest: 100,
        seasonType: 'kharif'
      }
    ],
    requirements: { soilType: ['loam', 'sandy loam'], phRange: { min: 5.5, max: 7.5 }, temperatureRange: { min: 21, max: 32 }, rainfallRange: { min: 500, max: 800 } },
    rotation: { goodSuccessors: ['Wheat', 'Potato', 'Chickpea'], badSuccessors: ['Maize'], family: 'Poaceae', soilEffect: 'heavy_feeder' },
    activities: [
      { name: 'Earthing Up', daysFromSowing: 30, description: 'Pile soil around base of plants', tips: 'Prevents lodging and supports roots' }
    ],
    isActive: true
  },
  {
    name: 'Soybean',
    localNames: { hi: 'सोयाबीन', ta: 'சோயா', te: 'సోయాబీన్', kn: 'ಸೋಯಾ', ml: 'സോയാബീൻ', bn: 'সয়াবিন', mr: 'सोयाबीन' },
    category: 'oilseeds',
    seasons: [
      {
        region: 'central',
        states: ['Madhya Pradesh', 'Maharashtra', 'Rajasthan'],
        sowingStartMonth: 6, sowingEndMonth: 7,
        harvestStartMonth: 10, harvestEndMonth: 11,
        daysToGermination: 5, daysToFlowering: 45, daysToHarvest: 100,
        seasonType: 'kharif'
      }
    ],
    requirements: { soilType: ['loam', 'clay loam'], phRange: { min: 6.0, max: 7.0 }, temperatureRange: { min: 20, max: 30 }, rainfallRange: { min: 600, max: 1000 } },
    rotation: { goodSuccessors: ['Wheat', 'Chickpea', 'Maize'], badSuccessors: ['Soybean'], family: 'Fabaceae', soilEffect: 'nitrogen_fixer' },
    activities: [
      { name: 'Rhizobium Inoculation', daysFromSowing: 0, description: 'Treat seeds with Rhizobium culture', tips: 'Improves nitrogen fixation' }
    ],
    isActive: true
  },
  {
    name: 'Chickpea',
    localNames: { hi: 'चना', ta: 'கொண்டைக்கடலை', te: 'శనగలు', kn: 'ಕಡಲೆ', ml: 'കടല', bn: 'ছোলা', mr: 'हरभरा' },
    category: 'pulses',
    seasons: [
      {
        region: 'central',
        states: ['Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Uttar Pradesh'],
        sowingStartMonth: 10, sowingEndMonth: 11,
        harvestStartMonth: 2, harvestEndMonth: 3,
        daysToGermination: 7, daysToFlowering: 55, daysToHarvest: 110,
        seasonType: 'rabi'
      }
    ],
    requirements: { soilType: ['loam', 'sandy loam'], phRange: { min: 6.0, max: 8.0 }, temperatureRange: { min: 15, max: 30 }, rainfallRange: { min: 300, max: 500 } },
    rotation: { goodSuccessors: ['Cotton', 'Sorghum', 'Maize'], badSuccessors: ['Chickpea', 'Lentil'], family: 'Fabaceae', soilEffect: 'nitrogen_fixer' },
    activities: [
      { name: 'Weeding', daysFromSowing: 25, description: 'Remove weeds', tips: 'Critical for yield' }
    ],
    isActive: true
  },
  {
    name: 'Tomato',
    localNames: { hi: 'टमाटर', ta: 'தக்காளி', te: 'టమాటో', kn: 'ಟೊಮೇಟೊ', ml: 'തക്കാളി', bn: 'টমেটো', mr: 'टोमॅटो' },
    category: 'vegetables',
    seasons: [
      {
        region: 'north',
        states: ['Uttar Pradesh', 'Bihar', 'Punjab'],
        sowingStartMonth: 9, sowingEndMonth: 10,
        harvestStartMonth: 12, harvestEndMonth: 3,
        daysToGermination: 7, daysToFlowering: 45, daysToHarvest: 75,
        seasonType: 'rabi'
      },
      {
        region: 'south',
        states: ['Karnataka', 'Tamil Nadu', 'Andhra Pradesh'],
        sowingStartMonth: 6, sowingEndMonth: 8,
        harvestStartMonth: 9, harvestEndMonth: 12,
        daysToGermination: 5, daysToFlowering: 40, daysToHarvest: 70,
        seasonType: 'kharif'
      }
    ],
    requirements: { soilType: ['loam', 'sandy loam'], phRange: { min: 6.0, max: 7.0 }, temperatureRange: { min: 18, max: 30 }, rainfallRange: { min: 400, max: 600 } },
    rotation: { goodSuccessors: ['Beans', 'Carrot', 'Cabbage'], badSuccessors: ['Tomato', 'Potato', 'Pepper'], family: 'Solanaceae', soilEffect: 'heavy_feeder' },
    activities: [
      { name: 'Staking', daysFromSowing: 30, description: 'Provide support to plants', tips: 'Use bamboo stakes' },
      { name: 'Pruning', daysFromSowing: 35, description: 'Remove suckers', tips: 'Improves fruit quality' }
    ],
    isActive: true
  },
  {
    name: 'Onion',
    localNames: { hi: 'प्याज', ta: 'வெங்காயம்', te: 'ఉల్లిపాయ', kn: 'ಈರುಳ್ಳಿ', ml: 'ഉള്ളി', bn: 'পেঁয়াজ', mr: 'कांदा' },
    category: 'vegetables',
    seasons: [
      {
        region: 'west',
        states: ['Maharashtra', 'Gujarat', 'Rajasthan'],
        sowingStartMonth: 10, sowingEndMonth: 11,
        harvestStartMonth: 3, harvestEndMonth: 4,
        daysToGermination: 10, daysToFlowering: 90, daysToHarvest: 150,
        seasonType: 'rabi'
      }
    ],
    requirements: { soilType: ['loam', 'sandy loam'], phRange: { min: 6.0, max: 7.0 }, temperatureRange: { min: 13, max: 24 }, rainfallRange: { min: 350, max: 550 } },
    rotation: { goodSuccessors: ['Rice', 'Maize', 'Cabbage'], badSuccessors: ['Onion', 'Garlic'], family: 'Amaryllidaceae', soilEffect: 'light_feeder' },
    activities: [
      { name: 'Transplanting', daysFromSowing: 45, description: 'Transplant seedlings to main field', tips: 'Water immediately after transplanting' }
    ],
    isActive: true
  },
  {
    name: 'Potato',
    localNames: { hi: 'आलू', ta: 'உருளைக்கிழங்கு', te: 'బంగాళదుంప', kn: 'ಆಲೂಗಡ್ಡೆ', ml: 'ഉരുളക്കിഴങ്ങ്', bn: 'আলু', mr: 'बटाटा' },
    category: 'vegetables',
    seasons: [
      {
        region: 'north',
        states: ['Uttar Pradesh', 'West Bengal', 'Bihar', 'Punjab'],
        sowingStartMonth: 10, sowingEndMonth: 11,
        harvestStartMonth: 2, harvestEndMonth: 3,
        daysToGermination: 14, daysToFlowering: 45, daysToHarvest: 100,
        seasonType: 'rabi'
      }
    ],
    requirements: { soilType: ['sandy loam', 'loam'], phRange: { min: 5.5, max: 6.5 }, temperatureRange: { min: 15, max: 25 }, rainfallRange: { min: 300, max: 500 } },
    rotation: { goodSuccessors: ['Maize', 'Wheat', 'Beans'], badSuccessors: ['Potato', 'Tomato'], family: 'Solanaceae', soilEffect: 'heavy_feeder' },
    activities: [
      { name: 'Earthing Up', daysFromSowing: 30, description: 'Hill up soil around plants', tips: 'Prevents greening of tubers' },
      { name: 'Second Earthing', daysFromSowing: 45, description: 'Repeat earthing up', tips: 'Promotes tuber development' }
    ],
    isActive: true
  },
  {
    name: 'Sugarcane',
    localNames: { hi: 'गन्ना', ta: 'கரும்பு', te: 'చెరకు', kn: 'ಕಬ್ಬು', ml: 'കരിമ്പ്', bn: 'আখ', mr: 'ऊस' },
    category: 'cash_crops',
    seasons: [
      {
        region: 'north',
        states: ['Uttar Pradesh', 'Bihar', 'Haryana', 'Punjab'],
        sowingStartMonth: 2, sowingEndMonth: 3,
        harvestStartMonth: 11, harvestEndMonth: 3,
        daysToGermination: 30, daysToFlowering: 270, daysToHarvest: 360,
        seasonType: 'year_round'
      },
      {
        region: 'south',
        states: ['Maharashtra', 'Karnataka', 'Tamil Nadu'],
        sowingStartMonth: 1, sowingEndMonth: 2,
        harvestStartMonth: 12, harvestEndMonth: 4,
        daysToGermination: 25, daysToFlowering: 250, daysToHarvest: 330,
        seasonType: 'year_round'
      }
    ],
    requirements: { soilType: ['loam', 'clay loam'], phRange: { min: 6.0, max: 7.5 }, temperatureRange: { min: 20, max: 35 }, rainfallRange: { min: 1200, max: 2000 } },
    rotation: { goodSuccessors: ['Wheat', 'Potato', 'Vegetables'], badSuccessors: ['Sugarcane'], family: 'Poaceae', soilEffect: 'heavy_feeder' },
    activities: [
      { name: 'Gap Filling', daysFromSowing: 30, description: 'Replace missing setts', tips: 'Use healthy setts from nursery' },
      { name: 'Earthing Up', daysFromSowing: 90, description: 'Hill up soil around plants', tips: 'Prevents lodging' }
    ],
    isActive: true
  }
];
