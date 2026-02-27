// Script to seed government agricultural schemes
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');

const schemes = [
  {
    name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    localNames: {
      hi: 'प्रधानमंत्री किसान सम्मान निधि',
      ta: 'பிரதமர் கிசான் சம்மான் நிதி',
      te: 'ప్రధాన మంత్రి కిసాన్ సమ్మాన్ నిధి',
      bn: 'প্রধানমন্ত্রী কিষান সম্মান নিধি',
      mr: 'प्रधानमंत्री किसान सन्मान निधी',
      gu: 'પ્રધાનમંત્રી કિસાન સન્માન નિધિ',
      kn: 'ಪ್ರಧಾನ ಮಂತ್ರಿ ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ',
      pa: 'ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਕਿਸਾਨ ਸਨਮਾਨ ਨਿਧੀ'
    },
    shortDescription: 'Income support of ₹6,000 per year to all farmer families across the country in three equal installments.',
    fullDescription: 'PM-KISAN is a Central Sector scheme with 100% funding from Government of India. Under the scheme, income support of Rs.6000/- per year is provided to all farmer families across the country in three equal installments of Rs.2000/- each every four months. The fund is directly transferred to the bank accounts of the beneficiaries.',
    category: 'subsidy',
    implementingAgency: {
      name: 'Ministry of Agriculture & Farmers Welfare',
      type: 'central',
      website: 'https://pmkisan.gov.in',
      contactEmail: 'pmkisan-ict@gov.in',
      helplineNumber: '155261'
    },
    eligibility: {
      states: ['All India'],
      farmTypes: ['organic', 'conventional', 'mixed'],
      eligibleCrops: ['All crops'],
      landOwnership: ['owner'],
      gender: 'all',
      additionalCriteria: [
        'Must be a land-holding farmer family',
        'Exclusion: Institutional land holders, farmer families holding constitutional posts, serving or retired officers, income tax payers, professionals like doctors, engineers, lawyers, chartered accountants'
      ]
    },
    benefits: {
      type: 'cash',
      amount: 6000,
      maxBenefit: 6000,
      description: '₹6,000 per year in 3 installments of ₹2,000 each',
      disbursementMode: 'direct_transfer'
    },
    documents: [
      { name: 'Aadhaar Card', description: 'For identity verification and DBT', isMandatory: true },
      { name: 'Land Records', description: 'Land ownership documents (Khatauni/RoR)', isMandatory: true },
      { name: 'Bank Account Details', description: 'Aadhaar-linked bank account for fund transfer', isMandatory: true },
      { name: 'Mobile Number', description: 'For OTP verification and updates', isMandatory: true }
    ],
    applicationProcess: {
      mode: 'both',
      onlinePortal: 'https://pmkisan.gov.in/RegistrationForm.aspx',
      officeAddress: 'Common Service Centre (CSC) or Agriculture Department Office',
      steps: [
        'Visit the PM-KISAN portal or nearest CSC',
        'Click on "New Farmer Registration"',
        'Enter Aadhaar number and captcha',
        'Fill in personal details, bank account, and land information',
        'Upload required documents',
        'Submit the application',
        'Track status using registered mobile number'
      ]
    },
    timeline: {
      isYearRound: true,
      processingDays: 30
    },
    tags: ['income support', 'direct benefit transfer', 'central scheme', 'farmer welfare'],
    faqs: [
      {
        question: 'Who is eligible for PM-KISAN?',
        answer: 'All landholding farmer families are eligible, subject to certain exclusion criteria like income tax payers, government employees, etc.'
      },
      {
        question: 'How much money will I receive?',
        answer: 'You will receive ₹6,000 per year in three installments of ₹2,000 each.'
      },
      {
        question: 'How can I check my payment status?',
        answer: 'Visit pmkisan.gov.in and click on "Beneficiary Status" to check using Aadhaar or mobile number.'
      }
    ],
    statistics: {
      totalBeneficiaries: 110000000,
      totalAmountDisbursed: 250000000000,
      applicationsThisYear: 5000000
    },
    status: 'active',
    featured: true,
    priority: 100
  },
  {
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    localNames: {
      hi: 'प्रधानमंत्री फसल बीमा योजना',
      ta: 'பிரதமர் பயிர் காப்பீட்டுத் திட்டம்',
      te: 'ప్రధాన మంత్రి పంట బీమా పథకం',
      bn: 'প্রধানমন্ত্রী ফসল বীমা যোজনা',
      mr: 'प्रधानमंत्री पीक विमा योजना',
      gu: 'પ્રધાનમંત્રી ફસલ બીમા યોજના',
      kn: 'ಪ್ರಧಾನ ಮಂತ್ರಿ ಫಸಲ್ ಬೀಮಾ ಯೋಜನೆ',
      pa: 'ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਫ਼ਸਲ ਬੀਮਾ ਯੋਜਨਾ'
    },
    shortDescription: 'Crop insurance scheme providing financial support to farmers in case of crop failure due to natural calamities, pests, and diseases.',
    fullDescription: 'PMFBY provides comprehensive insurance coverage against crop loss/damage arising out of unforeseen events. It covers all Food & Oilseed crops and Annual Commercial/Horticultural Crops for which past yield data is available. Premium rates are very low - 2% for Kharif crops, 1.5% for Rabi crops, and 5% for commercial/horticultural crops.',
    category: 'insurance',
    implementingAgency: {
      name: 'Ministry of Agriculture & Farmers Welfare',
      type: 'central',
      website: 'https://pmfby.gov.in',
      contactEmail: 'help.agri-insurance@gov.in',
      helplineNumber: '14447'
    },
    eligibility: {
      states: ['All India'],
      farmTypes: ['organic', 'conventional', 'mixed'],
      eligibleCrops: ['Rice', 'Wheat', 'Pulses', 'Oilseeds', 'Cotton', 'Sugarcane', 'Vegetables', 'Fruits'],
      landOwnership: ['owner', 'tenant', 'sharecropper'],
      gender: 'all',
      additionalCriteria: [
        'Both loanee and non-loanee farmers can apply',
        'Voluntary for all farmers since Kharif 2020',
        'Must apply before sowing deadline for the season'
      ]
    },
    benefits: {
      type: 'insurance',
      subsidyPercentage: 95,
      description: 'Premium subsidy up to 95%. Full sum insured payable in case of total crop loss.',
      disbursementMode: 'direct_transfer'
    },
    documents: [
      { name: 'Aadhaar Card', description: 'Identity proof', isMandatory: true },
      { name: 'Land Records', description: 'RoR, Khata, or lease agreement for tenant farmers', isMandatory: true },
      { name: 'Bank Account Details', description: 'For premium deduction and claim settlement', isMandatory: true },
      { name: 'Sowing Certificate', description: 'From village officer/patwari', isMandatory: true },
      { name: 'Crop Photos', description: 'Geotagged photos at sowing and harvesting (via app)', isMandatory: false }
    ],
    applicationProcess: {
      mode: 'both',
      onlinePortal: 'https://pmfby.gov.in/farmerRegistrationForm',
      officeAddress: 'Bank branch, CSC, or Agriculture office',
      steps: [
        'Visit PMFBY portal or nearest bank/CSC',
        'Select your state, district, and block',
        'Choose the crop and season for insurance',
        'Enter land details and area to be insured',
        'Calculate and pay the premium',
        'Submit application and collect acknowledgment',
        'Download the AIDE app for crop photos',
        'Report crop loss within 72 hours via app or helpline'
      ]
    },
    timeline: {
      applicationStart: new Date('2025-04-01'),
      applicationEnd: new Date('2025-07-31'),
      processingDays: 45,
      isYearRound: false
    },
    tags: ['crop insurance', 'risk protection', 'natural calamity', 'premium subsidy'],
    faqs: [
      {
        question: 'What is the premium rate for farmers?',
        answer: 'Farmers pay only 2% for Kharif crops, 1.5% for Rabi crops, and 5% for horticultural crops. Rest is subsidized by government.'
      },
      {
        question: 'What risks are covered?',
        answer: 'Coverage includes yield losses, prevented sowing, post-harvest losses, localized calamities, and damage by wild animals.'
      },
      {
        question: 'How to report crop damage?',
        answer: 'Report within 72 hours through AIDE app, toll-free number 14447, or visit your bank/agriculture office.'
      }
    ],
    statistics: {
      totalBeneficiaries: 50000000,
      totalAmountDisbursed: 150000000000,
      applicationsThisYear: 20000000
    },
    status: 'active',
    featured: true,
    priority: 95
  },
  {
    name: 'Kisan Credit Card (KCC)',
    localNames: {
      hi: 'किसान क्रेडिट कार्ड',
      ta: 'கிசான் கிரெடிட் கார்டு',
      te: 'కిసాన్ క్రెడిట్ కార్డ్',
      bn: 'কিষাণ ক্রেডিট কার্ড',
      mr: 'किसान क्रेडिट कार्ड',
      gu: 'કિસાન ક્રેડિટ કાર્ડ',
      kn: 'ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್',
      pa: 'ਕਿਸਾਨ ਕ੍ਰੈਡਿਟ ਕਾਰਡ'
    },
    shortDescription: 'Flexible credit facility for farmers to meet agricultural and allied activities needs at subsidized interest rate of 4%.',
    fullDescription: 'Kisan Credit Card scheme provides affordable credit to farmers for their cultivation needs, post-harvest expenses, farm maintenance, and allied activities. Credit limit is based on land holding, cropping pattern, and scale of finance. Interest subvention brings effective rate to just 4% for timely repayment.',
    category: 'loan',
    implementingAgency: {
      name: 'NABARD / All Scheduled Banks',
      type: 'central',
      website: 'https://www.nabard.org/content1.aspx?id=591&catid=23&mid=23',
      contactEmail: 'nabloansection@nabard.org',
      helplineNumber: '1800-102-5337'
    },
    eligibility: {
      states: ['All India'],
      farmTypes: ['organic', 'conventional', 'mixed'],
      eligibleCrops: ['All crops'],
      landOwnership: ['owner', 'tenant', 'sharecropper'],
      gender: 'all',
      additionalCriteria: [
        'Individual farmers - owner cultivators',
        'Tenant farmers, oral lessees and sharecroppers',
        'Self Help Groups (SHGs) or Joint Liability Groups (JLGs)',
        'Fishermen and Animal Husbandry farmers also eligible'
      ]
    },
    benefits: {
      type: 'loan',
      subsidyPercentage: 3,
      maxBenefit: 300000,
      description: 'Credit up to ₹3 lakh at 4% interest (with subvention). Free ATM card and personal accident insurance up to ₹50,000.',
      disbursementMode: 'direct_transfer'
    },
    documents: [
      { name: 'Identity Proof', description: 'Aadhaar Card/Voter ID/Passport', isMandatory: true },
      { name: 'Address Proof', description: 'Aadhaar/Utility Bill/Ration Card', isMandatory: true },
      { name: 'Land Documents', description: 'Land ownership proof or lease agreement', isMandatory: true },
      { name: 'Passport Size Photos', description: 'Two recent photographs', isMandatory: true },
      { name: 'Crop Cultivation Proof', description: 'Certificate from revenue officer', isMandatory: false }
    ],
    applicationProcess: {
      mode: 'both',
      onlinePortal: 'https://www.pmkisan.gov.in/kccform',
      officeAddress: 'Any nationalized bank, cooperative bank, or regional rural bank branch',
      steps: [
        'Visit your bank branch or apply online through PM-KISAN portal',
        'Fill the KCC application form',
        'Submit required documents',
        'Bank will verify land records and assess credit limit',
        'Credit limit sanctioned based on crops and land area',
        'KCC issued with validity of 5 years',
        'Withdraw as per need using card at ATM or branch'
      ]
    },
    timeline: {
      isYearRound: true,
      processingDays: 14
    },
    tags: ['agricultural credit', 'farm loan', 'subsidized interest', 'working capital'],
    faqs: [
      {
        question: 'What is the interest rate on KCC?',
        answer: 'Banks charge 7% but with government subvention, farmers get loans at 4% for timely repayment up to ₹3 lakh.'
      },
      {
        question: 'What expenses can I use KCC for?',
        answer: 'Seeds, fertilizers, pesticides, labor wages, irrigation, farm equipment, post-harvest expenses, and allied activities.'
      },
      {
        question: 'Is collateral required?',
        answer: 'No collateral needed for loans up to ₹1.6 lakh. For higher amounts, land or other assets as collateral.'
      }
    ],
    statistics: {
      totalBeneficiaries: 75000000,
      totalAmountDisbursed: 800000000000,
      applicationsThisYear: 10000000
    },
    status: 'active',
    featured: true,
    priority: 90
  },
  {
    name: 'Soil Health Card Scheme',
    localNames: {
      hi: 'मृदा स्वास्थ्य कार्ड योजना',
      ta: 'மண் ஆரோக்கிய அட்டை திட்டம்',
      te: 'మట్టి ఆరోగ్య కార్డు పథకం',
      bn: 'মৃত্তিকা স্বাস্থ্য কার্ড যোজনা',
      mr: 'मृदा आरोग्य कार्ड योजना',
      gu: 'જમીન આરોગ્ય કાર્ડ યોજના',
      kn: 'ಮಣ್ಣು ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಯೋಜನೆ',
      pa: 'ਮਿੱਟੀ ਸਿਹਤ ਕਾਰਡ ਯੋਜਨਾ'
    },
    shortDescription: 'Free soil testing and nutrient recommendations to help farmers improve soil health and crop productivity.',
    fullDescription: 'The Soil Health Card scheme provides farmers with information about nutrient status of their soil along with recommendations on appropriate dosage of nutrients to improve soil health and fertility. Cards are issued every 2 years covering all 12 parameters including N, P, K, S, Zn, Fe, Cu, Mn, B, pH, EC, and Organic Carbon.',
    category: 'other',
    implementingAgency: {
      name: 'Ministry of Agriculture & Farmers Welfare',
      type: 'central',
      website: 'https://soilhealth.dac.gov.in',
      contactEmail: 'soilhealth-dac@gov.in',
      helplineNumber: '1800-180-1551'
    },
    eligibility: {
      states: ['All India'],
      farmTypes: ['organic', 'conventional', 'mixed'],
      eligibleCrops: ['All crops'],
      landOwnership: ['owner', 'tenant', 'sharecropper'],
      gender: 'all',
      additionalCriteria: [
        'All farmers owning or cultivating agricultural land',
        'No minimum land holding requirement',
        'Free of cost for all farmers'
      ]
    },
    benefits: {
      type: 'training',
      amount: 0,
      description: 'Free soil testing with detailed nutrient analysis. Personalized fertilizer recommendations. Helps reduce input costs by 10-15%.',
      disbursementMode: 'equipment'
    },
    documents: [
      { name: 'Aadhaar Card', description: 'Identity proof', isMandatory: true },
      { name: 'Land Details', description: 'Survey number, area, and location of field', isMandatory: true },
      { name: 'Mobile Number', description: 'For receiving soil health card', isMandatory: true }
    ],
    applicationProcess: {
      mode: 'both',
      onlinePortal: 'https://soilhealth.dac.gov.in/PublicReports/FarmerRegister',
      officeAddress: 'Block Agriculture Office or Krishi Vigyan Kendra',
      steps: [
        'Register on Soil Health Card portal or visit local agriculture office',
        'Provide land details (survey number, village, area)',
        'Soil sample collected by agriculture department staff',
        'Sample tested at soil testing laboratory',
        'Soil Health Card generated with recommendations',
        'Download card from portal or receive SMS link',
        'Follow fertilizer recommendations for better yield'
      ]
    },
    timeline: {
      isYearRound: true,
      processingDays: 21
    },
    tags: ['soil testing', 'nutrient management', 'fertilizer recommendation', 'sustainable agriculture'],
    faqs: [
      {
        question: 'How often can I get a Soil Health Card?',
        answer: 'A new card is issued every 2 years as soil health changes over time based on cropping patterns.'
      },
      {
        question: 'What parameters are tested?',
        answer: '12 parameters: Nitrogen, Phosphorus, Potassium, Sulphur, Zinc, Iron, Copper, Manganese, Boron, pH, EC, and Organic Carbon.'
      },
      {
        question: 'Is there any fee for soil testing?',
        answer: 'No, the scheme is completely free for all farmers.'
      }
    ],
    statistics: {
      totalBeneficiaries: 230000000,
      totalAmountDisbursed: 0,
      applicationsThisYear: 30000000
    },
    status: 'active',
    featured: true,
    priority: 85
  },
  {
    name: 'PM-KUSUM (Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan)',
    localNames: {
      hi: 'प्रधानमंत्री किसान ऊर्जा सुरक्षा एवं उत्थान महाभियान',
      ta: 'பிரதமர் கிசான் ஊர்ஜா சுரக்ஷா மற்றும் உத்தான் மகாபியான்',
      te: 'ప్రధాన మంత్రి కిసాన్ ఊర్జా సురక్షా మరియు ఉత్థాన్ మహాభియాన్',
      bn: 'প্রধানমন্ত্রী কিষান ঊর্জা সুরক্ষা ও উত্থান মহাভিযান',
      mr: 'प्रधानमंत्री किसान ऊर्जा सुरक्षा आणि उत्थान महाअभियान',
      gu: 'પ્રધાનમંત્રી કિસાન ઊર્જા સુરક્ષા અને ઉત્થાન મહાઅભિયાન',
      kn: 'ಪ್ರಧಾನ ಮಂತ್ರಿ ಕಿಸಾನ್ ಊರ್ಜಾ ಸುರಕ್ಷಾ ಮತ್ತು ಉತ್ಥಾನ್ ಮಹಾಭಿಯಾನ್',
      pa: 'ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਕਿਸਾਨ ਊਰਜਾ ਸੁਰੱਖਿਆ ਤੇ ਉੱਥਾਨ ਮਹਾਂਅਭਿਆਨ'
    },
    shortDescription: 'Subsidized solar pumps and solar power plants for farmers to reduce irrigation costs and earn additional income.',
    fullDescription: 'PM-KUSUM aims to add solar capacity of 30.8 GW by 2026. It has three components: (A) Setting up 10,000 MW of decentralized ground/stilt mounted grid-connected solar power plants, (B) Installation of 20 lakh standalone solar pumps, (C) Solarization of 15 lakh grid-connected agriculture pumps. Farmers get 60% subsidy on solar pumps.',
    category: 'equipment',
    implementingAgency: {
      name: 'Ministry of New & Renewable Energy',
      type: 'both',
      website: 'https://pmkusum.mnre.gov.in',
      contactEmail: 'kusum-mnre@gov.in',
      helplineNumber: '1800-180-3333'
    },
    eligibility: {
      states: ['All India'],
      farmTypes: ['organic', 'conventional', 'mixed'],
      eligibleCrops: ['All crops'],
      landOwnership: ['owner'],
      gender: 'all',
      additionalCriteria: [
        'Individual farmers, groups, FPOs, cooperatives, panchayats',
        'Water resources like borewell, tube well, canal, pond required',
        'Component A: Minimum 0.5 acres land near substation',
        'Component B: Any farmer for standalone pump (2-10 HP)',
        'Component C: Existing grid-connected pump owners'
      ]
    },
    benefits: {
      type: 'subsidy_percentage',
      subsidyPercentage: 60,
      maxBenefit: 174000,
      description: '60% subsidy (30% Central + 30% State). Farmer pays only 40%. Additional income by selling surplus power to grid.',
      disbursementMode: 'equipment'
    },
    documents: [
      { name: 'Aadhaar Card', description: 'Identity proof', isMandatory: true },
      { name: 'Land Documents', description: 'Proof of land ownership', isMandatory: true },
      { name: 'Bank Account Details', description: 'For subsidy disbursement', isMandatory: true },
      { name: 'Electricity Bill', description: 'For Component C - existing grid connection', isMandatory: false },
      { name: 'Water Source Proof', description: 'Borewell/tubewell registration', isMandatory: true }
    ],
    applicationProcess: {
      mode: 'online',
      onlinePortal: 'https://pmkusum.mnre.gov.in/landing',
      officeAddress: 'State Renewable Energy Development Agency',
      steps: [
        'Visit PM-KUSUM portal and register',
        'Select the component (A, B, or C) based on your requirement',
        'Fill application with land and water source details',
        'Upload required documents',
        'Pay farmer share (40% of cost) or apply for bank loan',
        'Application verified by state nodal agency',
        'Solar pump installed by empaneled vendor',
        'Claim subsidy through portal after installation'
      ]
    },
    timeline: {
      isYearRound: true,
      processingDays: 90
    },
    tags: ['solar pump', 'renewable energy', 'irrigation', 'subsidy', 'green energy'],
    faqs: [
      {
        question: 'What size solar pump can I get?',
        answer: 'Standalone pumps from 2 HP to 10 HP based on water source depth and irrigation needs.'
      },
      {
        question: 'Can I sell excess power?',
        answer: 'Yes, under Component A and C, you can sell surplus power to DISCOM at pre-fixed tariff and earn additional income.'
      },
      {
        question: 'Is bank loan available for farmer share?',
        answer: 'Yes, banks provide loans for the 40% farmer contribution at priority sector lending rates.'
      }
    ],
    statistics: {
      totalBeneficiaries: 1000000,
      totalAmountDisbursed: 50000000000,
      applicationsThisYear: 500000
    },
    status: 'active',
    featured: true,
    priority: 88
  },
  {
    name: 'e-NAM (National Agriculture Market)',
    localNames: {
      hi: 'राष्ट्रीय कृषि बाजार',
      ta: 'தேசிய வேளாண் சந்தை',
      te: 'జాతీయ వ్యవసాయ మార్కెట్',
      bn: 'জাতীয় কৃষি বাজার',
      mr: 'राष्ट्रीय कृषी बाजार',
      gu: 'રાષ્ટ્રીય કૃષિ બજાર',
      kn: 'ರಾಷ್ಟ್ರೀಯ ಕೃಷಿ ಮಾರುಕಟ್ಟೆ',
      pa: 'ਰਾਸ਼ਟਰੀ ਖੇਤੀਬਾੜੀ ਬਾਜ਼ਾਰ'
    },
    shortDescription: 'Pan-India electronic trading portal to sell agricultural produce online and get better prices through transparent bidding.',
    fullDescription: 'e-NAM is a unified national market for agricultural commodities by networking existing APMC mandis. Farmers can sell their produce to buyers across the country through online bidding, ensuring competitive prices. Currently 1,361 mandis across 23 states are integrated. Platform offers quality testing, transparent pricing, and online payment.',
    category: 'marketing',
    implementingAgency: {
      name: 'Ministry of Agriculture & Farmers Welfare / SFAC',
      type: 'central',
      website: 'https://enam.gov.in',
      contactEmail: 'helpdesk@enam.gov.in',
      helplineNumber: '1800-270-0224'
    },
    eligibility: {
      states: ['Andhra Pradesh', 'Chhattisgarh', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Chandigarh', 'Puducherry', 'Jammu & Kashmir', 'Ladakh', 'Goa'],
      farmTypes: ['organic', 'conventional', 'mixed'],
      eligibleCrops: ['Rice', 'Wheat', 'Maize', 'Pulses', 'Oilseeds', 'Onion', 'Potato', 'Vegetables', 'Fruits', 'Spices', 'Cotton', 'Jute', 'Sugarcane'],
      landOwnership: ['owner', 'tenant', 'sharecropper'],
      gender: 'all',
      additionalCriteria: [
        'Any farmer, FPO, or trader can register',
        'Must have produce to sell',
        'Bank account for receiving payments'
      ]
    },
    benefits: {
      type: 'mixed',
      description: 'Better prices through competitive bidding. Real-time price discovery. Reduced intermediaries. Online payment within 24-48 hours. Access to buyers across India.',
      disbursementMode: 'direct_transfer'
    },
    documents: [
      { name: 'Aadhaar Card', description: 'Identity verification', isMandatory: true },
      { name: 'Bank Account Details', description: 'For receiving payment', isMandatory: true },
      { name: 'Mobile Number', description: 'For OTP and updates', isMandatory: true },
      { name: 'Land Records', description: 'Optional but helps in verification', isMandatory: false }
    ],
    applicationProcess: {
      mode: 'both',
      onlinePortal: 'https://enam.gov.in/web/stakeholder-farmer',
      officeAddress: 'Nearest e-NAM integrated mandi',
      steps: [
        'Register on e-NAM portal or mobile app',
        'Complete KYC with Aadhaar',
        'Bring produce to nearest e-NAM mandi',
        'Get quality testing and grading done',
        'Lot created and put for online bidding',
        'Accept best bid price',
        'Receive payment in bank account',
        'Download e-receipt from portal'
      ]
    },
    timeline: {
      isYearRound: true,
      processingDays: 2
    },
    tags: ['online trading', 'APMC', 'fair price', 'digital market', 'transparent bidding'],
    faqs: [
      {
        question: 'Is there any registration fee?',
        answer: 'No, farmer registration on e-NAM is completely free.'
      },
      {
        question: 'What commodities can I sell?',
        answer: 'Over 200 commodities including cereals, pulses, oilseeds, vegetables, fruits, spices, and fibres.'
      },
      {
        question: 'How will I receive payment?',
        answer: 'Payment is transferred directly to your bank account within 24-48 hours after sale.'
      }
    ],
    statistics: {
      totalBeneficiaries: 18000000,
      totalAmountDisbursed: 300000000000,
      applicationsThisYear: 8000000
    },
    status: 'active',
    featured: true,
    priority: 82
  },
  {
    name: 'Sub-Mission on Agricultural Mechanization (SMAM)',
    localNames: {
      hi: 'कृषि मशीनीकरण पर उप-मिशन',
      ta: 'வேளாண் இயந்திரமயமாக்கல் உப-இயக்கம்',
      te: 'వ్యవసాయ యాంత్రీకరణపై ఉప-మిషన్',
      bn: 'কৃষি যান্ত্রিকীকরণ উপ-মিশন',
      mr: 'कृषी यांत्रिकीकरण उप-अभियान',
      gu: 'કૃષિ યાંત્રિકીકરણ ઉપ-મિશન',
      kn: 'ಕೃಷಿ ಯಾಂತ್ರೀಕರಣದ ಉಪ-ಮಿಷನ್',
      pa: 'ਖੇਤੀਬਾੜੀ ਮਸ਼ੀਨੀਕਰਨ ਉੱਤੇ ਉਪ-ਮਿਸ਼ਨ'
    },
    shortDescription: 'Subsidies up to 80% on agricultural machinery and equipment to promote farm mechanization.',
    fullDescription: 'SMAM promotes farm mechanization through subsidies on purchase of agricultural machinery. Coverage includes tractors, power tillers, harvesters, planters, sprayers, and other implements. Scheme provides higher subsidies for SC/ST, small and marginal farmers, women, and NE states. Also supports Custom Hiring Centres and Farm Machinery Banks.',
    category: 'equipment',
    implementingAgency: {
      name: 'Ministry of Agriculture & Farmers Welfare',
      type: 'central',
      website: 'https://agrimachinery.nic.in',
      contactEmail: 'smam-agri@gov.in',
      helplineNumber: '1800-180-1551'
    },
    eligibility: {
      states: ['All India'],
      maxFarmSize: { value: 10, unit: 'acres' },
      farmTypes: ['organic', 'conventional', 'mixed'],
      eligibleCrops: ['All crops'],
      landOwnership: ['owner', 'tenant', 'sharecropper'],
      gender: 'all',
      additionalCriteria: [
        'Priority to SC/ST, small & marginal farmers, women',
        'Higher subsidy (50%) for hilly/NE states',
        'One machine per category per farmer per 3 years',
        'Groups/FPOs eligible for Custom Hiring Centres'
      ]
    },
    benefits: {
      type: 'subsidy_percentage',
      subsidyPercentage: 50,
      maxBenefit: 500000,
      description: '40-50% subsidy on machinery cost. Up to 80% for Custom Hiring Centres. Additional 10% for women/SC/ST/NE states.',
      disbursementMode: 'direct_transfer'
    },
    documents: [
      { name: 'Aadhaar Card', description: 'Identity proof', isMandatory: true },
      { name: 'Land Documents', description: 'Land ownership/lease proof', isMandatory: true },
      { name: 'Bank Account Details', description: 'Aadhaar-linked account for DBT', isMandatory: true },
      { name: 'Caste Certificate', description: 'For SC/ST applicants claiming higher subsidy', isMandatory: false },
      { name: 'Quotation', description: 'Price quotation from authorized dealer', isMandatory: true }
    ],
    applicationProcess: {
      mode: 'online',
      onlinePortal: 'https://agrimachinery.nic.in/Index/farmerregistration',
      officeAddress: 'District Agriculture Office',
      steps: [
        'Register on Agricultural Machinery portal',
        'Login and select machinery component/category',
        'Choose the machinery from approved list',
        'Get quotation from authorized dealer',
        'Fill application and upload documents',
        'Submit application online',
        'District officer verifies and approves',
        'Purchase machinery after approval',
        'Upload invoice and photos for subsidy release',
        'Subsidy credited to bank account'
      ]
    },
    timeline: {
      isYearRound: true,
      processingDays: 45
    },
    tags: ['farm machinery', 'mechanization', 'subsidy', 'tractor', 'harvester', 'equipment'],
    faqs: [
      {
        question: 'What machines are covered under SMAM?',
        answer: 'Tractors, power tillers, combine harvesters, rice transplanters, potato planters, sprayers, chaff cutters, and many more implements.'
      },
      {
        question: 'What is the subsidy percentage?',
        answer: '40-50% for individual farmers. Up to 80% for Custom Hiring Centres. Additional 10% for women, SC/ST, and NE states.'
      },
      {
        question: 'Can I get subsidy on tractor?',
        answer: 'Yes, up to 35% subsidy on tractors up to 20 HP with annual income ceiling of ₹6 lakhs.'
      }
    ],
    statistics: {
      totalBeneficiaries: 5000000,
      totalAmountDisbursed: 100000000000,
      applicationsThisYear: 1000000
    },
    status: 'active',
    featured: false,
    priority: 75
  },
  {
    name: 'Paramparagat Krishi Vikas Yojana (PKVY)',
    localNames: {
      hi: 'परम्परागत कृषि विकास योजना',
      ta: 'பரம்பரகத் கிருஷி விகாஸ் யோஜனா',
      te: 'పరంపరాగత కృషి వికాస్ యోజన',
      bn: 'পরম্পরাগত কৃষি বিকাশ যোজনা',
      mr: 'परंपरागत कृषी विकास योजना',
      gu: 'પરંપરાગત કૃષિ વિકાસ યોજના',
      kn: 'ಪರಂಪರಾಗತ ಕೃಷಿ ವಿಕಾಸ ಯೋಜನೆ',
      pa: 'ਪਰੰਪਰਾਗਤ ਖੇਤੀ ਵਿਕਾਸ ਯੋਜਨਾ'
    },
    shortDescription: 'Financial assistance of ₹50,000 per hectare for organic farming conversion with certification support.',
    fullDescription: 'PKVY promotes organic farming through adoption of organic village clusters. Farmers receive ₹50,000/ha over 3 years for organic inputs, certification, and marketing. Scheme covers cluster formation, training, organic inputs procurement, certification under PGS-India, and market linkages. Groups of 50+ farmers with 50+ hectare cluster required.',
    category: 'subsidy',
    implementingAgency: {
      name: 'Ministry of Agriculture & Farmers Welfare',
      type: 'central',
      website: 'https://pgsindia-ncof.gov.in',
      contactEmail: 'ncof-dac@gov.in',
      helplineNumber: '1800-180-1551'
    },
    eligibility: {
      states: ['All India'],
      minFarmSize: { value: 1, unit: 'acres' },
      farmTypes: ['organic', 'mixed'],
      eligibleCrops: ['All crops'],
      landOwnership: ['owner', 'tenant'],
      gender: 'all',
      additionalCriteria: [
        'Farmers must form cluster of minimum 50 farmers',
        'Cluster area should be 50+ hectares (contiguous preferred)',
        'Commitment to convert to 100% organic within 3 years',
        'No chemical inputs allowed in PGS area'
      ]
    },
    benefits: {
      type: 'cash',
      amount: 50000,
      maxBenefit: 50000,
      description: '₹50,000 per hectare over 3 years: ₹31,000 for organic inputs + ₹8,800 for certification + ₹10,200 for value addition/marketing.',
      disbursementMode: 'direct_transfer'
    },
    documents: [
      { name: 'Aadhaar Card', description: 'Identity proof', isMandatory: true },
      { name: 'Land Documents', description: 'Land records with survey number', isMandatory: true },
      { name: 'Bank Account Details', description: 'For DBT', isMandatory: true },
      { name: 'Cluster Formation Document', description: 'List of 50 farmers with consent', isMandatory: true },
      { name: 'Declaration', description: 'Commitment to organic farming', isMandatory: true }
    ],
    applicationProcess: {
      mode: 'both',
      onlinePortal: 'https://pgsindia-ncof.gov.in/pgs_registration/farmer_registration.aspx',
      officeAddress: 'Block/District Agriculture Office or Regional Council for Organic Farming',
      steps: [
        'Form a group of 50+ farmers with contiguous land',
        'Select Lead Resource Person (LRP) from group',
        'Register on PGS-India portal as Local Group',
        'Apply through state agriculture department',
        'Get land inspected and soil tested',
        'Receive training on organic practices',
        'Start conversion process (3 year period)',
        'Get PGS certification after conversion',
        'Receive financial assistance in installments'
      ]
    },
    timeline: {
      isYearRound: true,
      processingDays: 60
    },
    tags: ['organic farming', 'chemical-free', 'PGS certification', 'sustainable agriculture', 'cluster approach'],
    faqs: [
      {
        question: 'What is PGS certification?',
        answer: 'Participatory Guarantee System is a peer-based quality assurance system for organic products, valid across India.'
      },
      {
        question: 'Can individual farmers apply?',
        answer: 'No, minimum 50 farmers must form a cluster. This ensures collective adoption and peer monitoring.'
      },
      {
        question: 'What inputs are covered?',
        answer: 'Organic seeds, bio-fertilizers, vermicompost, bio-pesticides, and establishment of vermicompost units.'
      }
    ],
    statistics: {
      totalBeneficiaries: 2000000,
      totalAmountDisbursed: 30000000000,
      applicationsThisYear: 300000
    },
    status: 'active',
    featured: false,
    priority: 70
  },
  {
    name: 'Agriculture Infrastructure Fund (AIF)',
    localNames: {
      hi: 'कृषि अवसंरचना कोष',
      ta: 'வேளாண் உள்கட்டமைப்பு நிதி',
      te: 'వ్యవసాయ మౌలిక సదుపాయాల నిధి',
      bn: 'কৃষি অবকাঠামো তহবিল',
      mr: 'कृषी पायाभूत सुविधा निधी',
      gu: 'કૃષિ ઈન્ફ્રાસ્ટ્રક્ચર ફંડ',
      kn: 'ಕೃಷಿ ಮೂಲಸೌಕರ್ಯ ನಿಧಿ',
      pa: 'ਖੇਤੀਬਾੜੀ ਬੁਨਿਆਦੀ ਢਾਂਚਾ ਫੰਡ'
    },
    shortDescription: 'Subsidized loans for post-harvest infrastructure like warehouses, cold storage, processing units with 3% interest subvention.',
    fullDescription: 'AIF provides medium-long term credit for post-harvest management infrastructure including warehouses, silos, cold storage, processing units, sorting/grading facilities, and primary processing. Loans carry 3% interest subvention and credit guarantee coverage. Total fund size is ₹1 lakh crore with disbursement till 2032-33.',
    category: 'infrastructure',
    implementingAgency: {
      name: 'Ministry of Agriculture & Farmers Welfare / NABARD',
      type: 'central',
      website: 'https://agriinfra.dac.gov.in',
      contactEmail: 'aif-dac@gov.in',
      helplineNumber: '1800-180-1551'
    },
    eligibility: {
      states: ['All India'],
      farmTypes: ['organic', 'conventional', 'mixed'],
      eligibleCrops: ['All crops'],
      landOwnership: ['owner'],
      gender: 'all',
      additionalCriteria: [
        'Individual farmers, FPOs, PACS, cooperatives, SHGs, entrepreneurs',
        'Agri-startups, joint liability groups, agri-tech companies',
        'State agencies, APMCs, marketing boards',
        'Project DPR required for loan sanction'
      ]
    },
    benefits: {
      type: 'loan',
      subsidyPercentage: 3,
      maxBenefit: 20000000,
      description: '3% interest subvention on loans up to ₹2 crore. Credit guarantee of up to ₹2 crore under CGTMSE/FPO scheme. Moratorium up to 2 years.',
      disbursementMode: 'direct_transfer'
    },
    documents: [
      { name: 'Identity Proof', description: 'Aadhaar/PAN/Passport', isMandatory: true },
      { name: 'Project Report (DPR)', description: 'Detailed project report with cost estimates', isMandatory: true },
      { name: 'Land Documents', description: 'Ownership/lease deed for project site', isMandatory: true },
      { name: 'Entity Registration', description: 'For FPOs/cooperatives - registration certificate', isMandatory: false },
      { name: 'Bank Statements', description: 'Last 6 months statements', isMandatory: true },
      { name: 'Quotations', description: 'Equipment/construction quotations', isMandatory: true }
    ],
    applicationProcess: {
      mode: 'online',
      onlinePortal: 'https://agriinfra.dac.gov.in/Home/BenificiaryRegistration',
      officeAddress: 'Any scheduled commercial bank, cooperative bank, RRB, or NABARD',
      steps: [
        'Register on AIF portal',
        'Prepare detailed project report (DPR)',
        'Apply online with project details',
        'Select preferred bank for loan',
        'Bank evaluates project viability',
        'Loan sanctioned with interest subvention',
        'Implement project and draw funds',
        'Submit utilization certificates',
        'Interest subvention credited to loan account'
      ]
    },
    timeline: {
      isYearRound: true,
      processingDays: 60
    },
    tags: ['infrastructure', 'warehouse', 'cold storage', 'processing', 'post-harvest', 'subsidized loan'],
    faqs: [
      {
        question: 'What projects are eligible?',
        answer: 'Warehouses, silos, cold storage, ripening chambers, processing units, sorting/grading units, pack houses, e-marketing platforms.'
      },
      {
        question: 'What is the maximum loan amount?',
        answer: 'No upper limit on loan. Interest subvention of 3% applicable on loans up to ₹2 crore per project.'
      },
      {
        question: 'What is the loan repayment period?',
        answer: 'Minimum 4 years and maximum as per bank norms. Moratorium period of up to 2 years for principal.'
      }
    ],
    statistics: {
      totalBeneficiaries: 100000,
      totalAmountDisbursed: 500000000000,
      applicationsThisYear: 30000
    },
    status: 'active',
    featured: false,
    priority: 72
  },
  {
    name: 'National Mission on Edible Oils - Oil Palm (NMEO-OP)',
    localNames: {
      hi: 'खाद्य तेल पर राष्ट्रीय मिशन - पाम तेल',
      ta: 'உண்ணக்கூடிய எண்ணெய்கள் மீதான தேசிய இயக்கம் - பனை எண்ணெய்',
      te: 'ఆహార నూనెలపై జాతీయ మిషన్ - పామాయిల్',
      bn: 'ভোজ্য তেল জাতীয় মিশন - পাম তেল',
      mr: 'खाद्यतेलावर राष्ट्रीय अभियान - पाम तेल',
      gu: 'ખાદ્ય તેલ પર રાષ્ટ્રીય મિશન - પામ તેલ',
      kn: 'ಖಾದ್ಯ ತೈಲಗಳ ರಾಷ್ಟ್ರೀಯ ಮಿಷನ್ - ತಾಳೆ ಎಣ್ಣೆ',
      pa: 'ਖਾਣ ਵਾਲੇ ਤੇਲਾਂ ਬਾਰੇ ਰਾਸ਼ਟਰੀ ਮਿਸ਼ਨ - ਪਾਮ ਤੇਲ'
    },
    shortDescription: 'Financial assistance for oil palm cultivation including planting material subsidy and price assurance.',
    fullDescription: 'NMEO-OP aims to increase domestic edible oil production by expanding oil palm area to 10 lakh hectares by 2025-26. Farmers receive subsidies for planting material, drip irrigation, maintenance for 4 years, and assured price through Viability Price mechanism. Focus on NE states and Andaman & Nicobar Islands with higher subsidies.',
    category: 'subsidy',
    implementingAgency: {
      name: 'Ministry of Agriculture & Farmers Welfare',
      type: 'central',
      website: 'https://nmeo.dac.gov.in',
      contactEmail: 'nmeo-dac@gov.in',
      helplineNumber: '1800-180-1551'
    },
    eligibility: {
      states: ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Kerala', 'Gujarat', 'Odisha', 'Bihar', 'Assam', 'Arunachal Pradesh', 'Mizoram', 'Nagaland', 'Meghalaya', 'Manipur', 'Tripura', 'Andaman & Nicobar'],
      minFarmSize: { value: 1, unit: 'acres' },
      farmTypes: ['conventional', 'mixed'],
      eligibleCrops: ['Oil Palm'],
      landOwnership: ['owner', 'tenant'],
      gender: 'all',
      additionalCriteria: [
        'Land should be suitable for oil palm (rainfall >1500mm)',
        'Assured irrigation source required',
        'MoU with oil processing company recommended'
      ]
    },
    benefits: {
      type: 'mixed',
      subsidyPercentage: 85,
      maxBenefit: 105000,
      description: '85% subsidy on planting material (₹12,000/ha). Maintenance cost support for 4 years (₹56,000/ha). Price assurance at 14.3% of CPO price.',
      disbursementMode: 'direct_transfer'
    },
    documents: [
      { name: 'Aadhaar Card', description: 'Identity proof', isMandatory: true },
      { name: 'Land Documents', description: 'Ownership/lease documents', isMandatory: true },
      { name: 'Bank Account Details', description: 'For subsidy transfer', isMandatory: true },
      { name: 'Soil Test Report', description: 'Suitability for oil palm', isMandatory: false },
      { name: 'Irrigation Proof', description: 'Source of assured irrigation', isMandatory: true }
    ],
    applicationProcess: {
      mode: 'both',
      onlinePortal: 'https://nmeo.dac.gov.in/Farmer/FarmerRegistration',
      officeAddress: 'State Horticulture Department or Oil Palm Company office',
      steps: [
        'Register on NMEO portal',
        'Submit land and irrigation details',
        'Get soil tested for suitability',
        'Select oil palm company for MoU',
        'Procure quality seedlings from nursery',
        'Plant and maintain as per guidelines',
        'Submit survival certificate after 1 year',
        'Receive subsidies in installments',
        'Sell FFBs to company at assured price'
      ]
    },
    timeline: {
      applicationStart: new Date('2025-03-01'),
      applicationEnd: new Date('2025-08-31'),
      processingDays: 30,
      isYearRound: false
    },
    tags: ['oil palm', 'edible oil', 'plantation', 'price assurance', 'northeast'],
    faqs: [
      {
        question: 'When does oil palm start yielding?',
        answer: 'Oil palm starts yielding after 4 years of planting and continues for 25-30 years.'
      },
      {
        question: 'What is the Viability Price mechanism?',
        answer: 'Government ensures farmers receive a minimum price of 14.3% of international CPO price for their Fresh Fruit Bunches (FFBs).'
      },
      {
        question: 'What is the expected income?',
        answer: 'At full bearing (8th year onwards), income can be ₹3-4 lakh per hectare per year.'
      }
    ],
    statistics: {
      totalBeneficiaries: 200000,
      totalAmountDisbursed: 20000000000,
      applicationsThisYear: 50000
    },
    status: 'active',
    featured: false,
    priority: 65
  },
  {
    name: 'Rashtriya Krishi Vikas Yojana - RAFTAAR',
    localNames: {
      hi: 'राष्ट्रीय कृषि विकास योजना - रफ्तार',
      ta: 'ராஷ்டிரிய கிருஷி விகாஸ் யோஜனா - ரஃப்டார்',
      te: 'రాష్ట్రీయ కృషి వికాస్ యోజన - రఫ్తార్',
      bn: 'রাষ্ট্রীয় কৃষি বিকাশ যোজনা - রাফতার',
      mr: 'राष्ट्रीय कृषी विकास योजना - राफ्तार',
      gu: 'રાષ્ટ્રીય કૃષિ વિકાસ યોજના - રફ્તાર',
      kn: 'ರಾಷ್ಟ್ರೀಯ ಕೃಷಿ ವಿಕಾಸ ಯೋಜನೆ - ರಫ್ತಾರ್',
      pa: 'ਰਾਸ਼ਟਰੀ ਖੇਤੀ ਵਿਕਾਸ ਯੋਜਨਾ - ਰਫ਼ਤਾਰ'
    },
    shortDescription: 'Flexible funding for states to implement agriculture development programs and support agri-entrepreneurship.',
    fullDescription: 'RKVY-RAFTAAR (Remunerative Approaches for Agriculture and Allied sector Rejuvenation) provides states flexibility to plan and implement agriculture projects based on local needs. It supports value chain development, agri-startups through innovation & agri-entrepreneurship, and infrastructure creation. 60% funds for regular projects, 20% for value chains, 10% for agri-startups.',
    category: 'other',
    implementingAgency: {
      name: 'Ministry of Agriculture & Farmers Welfare',
      type: 'both',
      website: 'https://rkvy.nic.in',
      contactEmail: 'rkvy-dac@gov.in',
      helplineNumber: '1800-180-1551'
    },
    eligibility: {
      states: ['All India'],
      farmTypes: ['organic', 'conventional', 'mixed'],
      eligibleCrops: ['All crops'],
      landOwnership: ['owner', 'tenant', 'sharecropper'],
      gender: 'all',
      additionalCriteria: [
        'Individual farmers for specific state projects',
        'Agri-startups with innovative ideas',
        'FPOs, cooperatives, and agri-entrepreneurs',
        'Students for Agri Business Incubator support'
      ]
    },
    benefits: {
      type: 'mixed',
      maxBenefit: 5000000,
      description: 'Varies by state project. Agri-startups can get up to ₹25 lakh funding through R-ABI incubators. Infrastructure projects funded as per state plans.',
      disbursementMode: 'direct_transfer'
    },
    documents: [
      { name: 'Aadhaar Card', description: 'Identity proof', isMandatory: true },
      { name: 'Business Plan', description: 'For agri-startup applicants', isMandatory: false },
      { name: 'Bank Account Details', description: 'For fund transfer', isMandatory: true },
      { name: 'Entity Registration', description: 'For startups/FPOs', isMandatory: false },
      { name: 'Project Proposal', description: 'Detailed project proposal', isMandatory: false }
    ],
    applicationProcess: {
      mode: 'both',
      onlinePortal: 'https://rkvy.nic.in',
      officeAddress: 'State Agriculture Department or R-ABI Centers',
      steps: [
        'Check state-specific projects on RKVY portal',
        'For agri-startup: Apply through nearest R-ABI',
        'Submit business plan or project proposal',
        'Selection through state-level committee',
        'Sign agreement and start implementation',
        'Submit progress reports and utilization',
        'Receive funds in tranches based on progress'
      ]
    },
    timeline: {
      isYearRound: true,
      processingDays: 90
    },
    tags: ['agri-startup', 'innovation', 'value chain', 'state scheme', 'entrepreneurship'],
    faqs: [
      {
        question: 'How can I apply for agri-startup funding?',
        answer: 'Apply through R-ABI (Rashtriya Krishi Vikas Yojana - Agri Business Incubator) centers located across India. Find nearest center at rkvy.nic.in.'
      },
      {
        question: 'What types of projects are funded?',
        answer: 'Farm machinery hubs, processing units, value chain infrastructure, cold chains, agri-tech innovations, and capacity building.'
      },
      {
        question: 'Is there state contribution required?',
        answer: 'Center:State funding ratio is 60:40 (90:10 for NE/Hill states), managed by state government.'
      }
    ],
    statistics: {
      totalBeneficiaries: 10000000,
      totalAmountDisbursed: 250000000000,
      applicationsThisYear: 500000
    },
    status: 'active',
    featured: false,
    priority: 68
  },
  {
    name: 'Interest Subvention Scheme for Farmers',
    localNames: {
      hi: 'किसानों के लिए ब्याज सबवेंशन योजना',
      ta: 'விவசாயிகளுக்கான வட்டி மானியத் திட்டம்',
      te: 'రైతుల కోసం వడ్డీ రాయితీ పథకం',
      bn: 'কৃষকদের জন্য সুদ ভর্তুকি প্রকল্প',
      mr: 'शेतकऱ्यांसाठी व्याज अनुदान योजना',
      gu: 'ખેડૂતો માટે વ્યાજ સબવેન્શન યોજના',
      kn: 'ರೈತರಿಗೆ ಬಡ್ಡಿ ಸಬ್ವೆನ್ಷನ್ ಯೋಜನೆ',
      pa: 'ਕਿਸਾਨਾਂ ਲਈ ਵਿਆਜ ਸਬਵੈਂਸ਼ਨ ਯੋਜਨਾ'
    },
    shortDescription: 'Reduced interest rate of 4% on short-term crop loans up to ₹3 lakh for prompt repayment.',
    fullDescription: 'The scheme provides interest subvention of 2% to banks for lending short-term crop loans to farmers at 7%. An additional 3% incentive is given to farmers who repay promptly, bringing effective rate to just 4%. Covers crop loans, post-harvest loans, and loans for Allied activities through Kisan Credit Card.',
    category: 'loan',
    implementingAgency: {
      name: 'Ministry of Agriculture & Reserve Bank of India',
      type: 'central',
      website: 'https://rbi.org.in',
      contactEmail: 'helpdoc@rbi.org.in',
      helplineNumber: '1800-102-5337'
    },
    eligibility: {
      states: ['All India'],
      farmTypes: ['organic', 'conventional', 'mixed'],
      eligibleCrops: ['All crops'],
      landOwnership: ['owner', 'tenant', 'sharecropper'],
      gender: 'all',
      additionalCriteria: [
        'Farmers with KCC or crop loan account',
        'Loan amount up to ₹3 lakh only',
        'Must repay within one year to get 3% additional benefit',
        'Available through all scheduled commercial banks, RRBs, and cooperative banks'
      ]
    },
    benefits: {
      type: 'loan',
      subsidyPercentage: 3,
      maxBenefit: 300000,
      description: '2% interest subvention reducing rate from 9% to 7%. Additional 3% incentive for timely repayment (within 1 year), bringing effective rate to 4%.',
      disbursementMode: 'direct_transfer'
    },
    documents: [
      { name: 'KCC Account', description: 'Existing Kisan Credit Card', isMandatory: true },
      { name: 'Aadhaar Card', description: 'Identity proof', isMandatory: true },
      { name: 'Land Records', description: 'If applying for fresh loan', isMandatory: false }
    ],
    applicationProcess: {
      mode: 'offline',
      onlinePortal: 'https://www.pmkisan.gov.in/kccform',
      officeAddress: 'Your KCC issuing bank branch',
      steps: [
        'Get Kisan Credit Card from your bank (if not already)',
        'Avail crop loan up to sanctioned limit',
        'Interest subvention automatically applied by bank',
        'Repay the loan within due date (usually 1 year)',
        'Get additional 3% benefit for timely repayment',
        'Net interest rate becomes 4% only'
      ]
    },
    timeline: {
      isYearRound: true,
      processingDays: 7
    },
    tags: ['interest rate', 'crop loan', 'KCC', 'subsidized lending', 'prompt repayment'],
    faqs: [
      {
        question: 'How do I get 4% interest rate?',
        answer: 'Take crop loan through KCC and repay within one year of disbursement. Bank will charge only 4% effective interest.'
      },
      {
        question: 'What if I cannot repay on time?',
        answer: 'You will be charged 7% instead of 4%, losing the 3% prompt repayment incentive.'
      },
      {
        question: 'Is this applicable for all banks?',
        answer: 'Yes, all public sector banks, private banks, RRBs, and cooperative banks provide this benefit.'
      }
    ],
    statistics: {
      totalBeneficiaries: 60000000,
      totalAmountDisbursed: 120000000000,
      applicationsThisYear: 15000000
    },
    status: 'active',
    featured: true,
    priority: 80
  }
];

const seedSchemes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-agriculture');
    console.log('Connected to MongoDB');

    // Clear existing schemes
    await Scheme.deleteMany({});
    console.log('Cleared existing schemes');

    // Insert new schemes
    const insertedSchemes = await Scheme.insertMany(schemes);
    console.log(`Successfully inserted ${insertedSchemes.length} schemes`);

    // Log inserted schemes
    insertedSchemes.forEach((scheme, index) => {
      console.log(`${index + 1}. ${scheme.name}`);
    });

    console.log('\nSchemes seeding complete!');

  } catch (error) {
    console.error('Error seeding schemes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

seedSchemes();
