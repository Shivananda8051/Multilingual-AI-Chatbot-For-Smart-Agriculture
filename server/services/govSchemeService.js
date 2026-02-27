/**
 * Government Scheme Fetcher Service
 * Fetches agricultural schemes from official government sources:
 * 1. data.gov.in API - Open Government Data Platform (FREE - requires registration)
 * 2. API Setu - myScheme API (requires registration)
 *
 * Setup Instructions:
 * 1. Register FREE at https://data.gov.in and get API key from "My Account"
 * 2. Add DATA_GOV_IN_API_KEY to your .env file
 *
 * No API Key? The app will use comprehensive seed data with real scheme info
 */

const axios = require('axios');
const Scheme = require('../models/Scheme');

// Government scheme data sources
const GOV_SOURCES = {
  DATA_GOV_IN: 'https://api.data.gov.in/resource',
  API_SETU: 'https://apisetu.gov.in/myscheme/v1',
  PMKISAN: 'https://pmkisan.gov.in',
  PMFBY: 'https://pmfby.gov.in'
};

// Official scheme URLs for direct linking
const SCHEME_PORTALS = {
  'PM-KISAN': {
    name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    website: 'https://pmkisan.gov.in',
    applyUrl: 'https://pmkisan.gov.in/RegistrationForm.aspx',
    checkStatus: 'https://pmkisan.gov.in/BeneficiaryStatus.aspx',
    helpline: '155261'
  },
  'PMFBY': {
    name: 'Pradhan Mantri Fasal Bima Yojana',
    website: 'https://pmfby.gov.in',
    applyUrl: 'https://pmfby.gov.in/farmerRegistrationForm',
    checkStatus: 'https://pmfby.gov.in/adminStatistics/dashboard',
    helpline: '14447'
  },
  'KCC': {
    name: 'Kisan Credit Card',
    website: 'https://www.pmkisan.gov.in/kccform',
    applyUrl: 'https://www.pmkisan.gov.in/kccform',
    helpline: '1800-102-5337'
  },
  'SOIL_HEALTH': {
    name: 'Soil Health Card Scheme',
    website: 'https://soilhealth.dac.gov.in',
    applyUrl: 'https://soilhealth.dac.gov.in/PublicReports/FarmerRegister',
    helpline: '1800-180-1551'
  },
  'PM_KUSUM': {
    name: 'PM-KUSUM',
    website: 'https://pmkusum.mnre.gov.in',
    applyUrl: 'https://pmkusum.mnre.gov.in/landing',
    helpline: '1800-180-3333'
  },
  'ENAM': {
    name: 'e-NAM (National Agriculture Market)',
    website: 'https://enam.gov.in',
    applyUrl: 'https://enam.gov.in/web/stakeholder-farmer',
    helpline: '1800-270-0224'
  },
  'SMAM': {
    name: 'Sub-Mission on Agricultural Mechanization',
    website: 'https://agrimachinery.nic.in',
    applyUrl: 'https://agrimachinery.nic.in/Index/farmerregistration',
    helpline: '1800-180-1551'
  },
  'PKVY': {
    name: 'Paramparagat Krishi Vikas Yojana',
    website: 'https://pgsindia-ncof.gov.in',
    applyUrl: 'https://pgsindia-ncof.gov.in/pgs_registration/farmer_registration.aspx',
    helpline: '1800-180-1551'
  },
  'AIF': {
    name: 'Agriculture Infrastructure Fund',
    website: 'https://agriinfra.dac.gov.in',
    applyUrl: 'https://agriinfra.dac.gov.in/Home/BenificiaryRegistration',
    helpline: '1800-180-1551'
  },
  'RKVY': {
    name: 'Rashtriya Krishi Vikas Yojana',
    website: 'https://rkvy.nic.in',
    applyUrl: 'https://rkvy.nic.in',
    helpline: '1800-180-1551'
  },
  'NMEO': {
    name: 'National Mission on Edible Oils',
    website: 'https://nmeo.dac.gov.in',
    applyUrl: 'https://nmeo.dac.gov.in/Farmer/FarmerRegistration',
    helpline: '1800-180-1551'
  },
  'PMKMY': {
    name: 'PM Kisan Maan-dhan Yojana',
    website: 'https://pmkmy.gov.in',
    applyUrl: 'https://pmkmy.gov.in/register',
    helpline: '1800-267-6888'
  },
  'PMKSY': {
    name: 'Pradhan Mantri Krishi Sinchayee Yojana',
    website: 'https://pmksy.gov.in',
    applyUrl: 'https://pmksy.gov.in',
    helpline: '1800-180-1551'
  },
  'NFSM': {
    name: 'National Food Security Mission',
    website: 'https://nfsm.gov.in',
    applyUrl: 'https://nfsm.gov.in',
    helpline: '1800-180-1551'
  },
  'NBM': {
    name: 'National Bamboo Mission',
    website: 'https://nbm.da.gov.in',
    applyUrl: 'https://nbm.da.gov.in',
    helpline: '1800-180-1551'
  }
};

/**
 * Fetch schemes from data.gov.in API
 * Requires API key from https://data.gov.in
 */
async function fetchFromDataGovIn() {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;

  if (!apiKey) {
    console.log('DATA_GOV_IN_API_KEY not configured. Skipping data.gov.in fetch.');
    return [];
  }

  try {
    // Agriculture schemes resource ID (you'll need to find specific resource IDs)
    const resourceIds = [
      '9ef84268-d588-465a-a308-a864a43d0070', // PM-KISAN data
      // Add more resource IDs as you find them on data.gov.in
    ];

    const schemes = [];

    for (const resourceId of resourceIds) {
      const response = await axios.get(`${GOV_SOURCES.DATA_GOV_IN}/${resourceId}`, {
        params: {
          'api-key': apiKey,
          format: 'json',
          limit: 100
        },
        timeout: 10000
      });

      if (response.data && response.data.records) {
        schemes.push(...response.data.records);
      }
    }

    return schemes;
  } catch (error) {
    console.error('Error fetching from data.gov.in:', error.message);
    return [];
  }
}

/**
 * Fetch schemes from API Setu myScheme API
 * Requires registration at https://apisetu.gov.in
 */
async function fetchFromApiSetu() {
  const apiKey = process.env.API_SETU_KEY;
  const clientId = process.env.API_SETU_CLIENT_ID;

  if (!apiKey || !clientId) {
    console.log('API_SETU credentials not configured. Skipping API Setu fetch.');
    return [];
  }

  try {
    const response = await axios.get(`${GOV_SOURCES.API_SETU}/schemes`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Client-Id': clientId,
        'Content-Type': 'application/json'
      },
      params: {
        category: 'agriculture',
        limit: 100
      },
      timeout: 15000
    });

    return response.data?.schemes || [];
  } catch (error) {
    console.error('Error fetching from API Setu:', error.message);
    return [];
  }
}

/**
 * Fetch schemes from myScheme.gov.in API
 * This is the official government scheme aggregator portal
 */
async function fetchFromMyScheme(category = 'Agriculture,Rural & Environment') {
  try {
    console.log('Fetching schemes from myScheme.gov.in...');

    // myScheme.gov.in has a public API for searching schemes
    const response = await axios.get('https://www.myscheme.gov.in/api/v1/schemes', {
      params: {
        lang: 'en',
        category: category,
        sort: 'relevance',
        page: 1,
        limit: 100
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://www.myscheme.gov.in',
        'Referer': 'https://www.myscheme.gov.in/search'
      },
      timeout: 15000
    });

    if (response.data && response.data.data) {
      console.log(`Found ${response.data.data.length} schemes from myScheme`);
      return response.data.data;
    }

    return [];
  } catch (error) {
    console.error('Error fetching from myScheme:', error.message);

    // Fallback: Try alternative endpoint
    try {
      const fallbackResponse = await axios.get('https://www.myscheme.gov.in/api/search', {
        params: {
          q: 'agriculture farmer',
          category: 'Agriculture,Rural & Environment'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      if (fallbackResponse.data?.schemes) {
        return fallbackResponse.data.schemes;
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError.message);
    }

    return [];
  }
}

/**
 * Fetch scheme details from myScheme.gov.in
 */
async function fetchSchemeDetails(schemeSlug) {
  try {
    const response = await axios.get(`https://www.myscheme.gov.in/api/v1/schemes/${schemeSlug}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    return response.data?.data || null;
  } catch (error) {
    console.error(`Error fetching scheme details for ${schemeSlug}:`, error.message);
    return null;
  }
}

/**
 * Fetch schemes from iGOD (Integrated Government Online Directory)
 */
async function fetchFromIGOD() {
  try {
    console.log('Fetching schemes from iGOD...');

    const response = await axios.get('https://igod.gov.in/api/schemes', {
      params: {
        ministry: 'Ministry of Agriculture and Farmers Welfare',
        limit: 50
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    if (response.data && Array.isArray(response.data)) {
      console.log(`Found ${response.data.length} schemes from iGOD`);
      return response.data;
    }

    return [];
  } catch (error) {
    console.error('Error fetching from iGOD:', error.message);
    return [];
  }
}

/**
 * Transform external scheme data to match our Scheme model
 */
function transformSchemeData(externalScheme, source) {
  // Map category from various formats
  const categoryMap = {
    'subsidy': 'subsidy',
    'loan': 'loan',
    'insurance': 'insurance',
    'credit': 'loan',
    'financial assistance': 'subsidy',
    'training': 'training',
    'equipment': 'equipment',
    'infrastructure': 'infrastructure',
    'marketing': 'marketing'
  };

  const baseScheme = {
    name: externalScheme.name || externalScheme.schemeName || externalScheme.title,
    shortDescription: externalScheme.description || externalScheme.shortDescription || '',
    fullDescription: externalScheme.fullDescription || externalScheme.details || '',
    category: categoryMap[externalScheme.category?.toLowerCase()] || 'other',
    status: 'active',
    source: source,
    externalId: externalScheme.id || externalScheme.schemeId,
    lastSyncedAt: new Date()
  };

  // Add implementing agency info if available
  if (externalScheme.ministry || externalScheme.department) {
    baseScheme.implementingAgency = {
      name: externalScheme.ministry || externalScheme.department,
      type: externalScheme.schemeType === 'central' ? 'central' : 'both',
      website: externalScheme.website || externalScheme.officialUrl,
      helplineNumber: externalScheme.helpline || externalScheme.contactNumber
    };
  }

  // Add application process if available
  if (externalScheme.applicationUrl || externalScheme.applyLink) {
    baseScheme.applicationProcess = {
      mode: 'online',
      onlinePortal: externalScheme.applicationUrl || externalScheme.applyLink,
      steps: externalScheme.applicationSteps || []
    };
  }

  // Add eligibility if available
  if (externalScheme.eligibility) {
    baseScheme.eligibility = {
      states: externalScheme.states || ['All India'],
      additionalCriteria: Array.isArray(externalScheme.eligibility)
        ? externalScheme.eligibility
        : [externalScheme.eligibility]
    };
  }

  // Add benefits if available
  if (externalScheme.benefits || externalScheme.amount) {
    baseScheme.benefits = {
      description: externalScheme.benefits || '',
      amount: parseFloat(externalScheme.amount) || undefined
    };
  }

  return baseScheme;
}

/**
 * Transform myScheme data to our format
 */
function transformMySchemeData(scheme) {
  const categoryMap = {
    'Agriculture,Rural & Environment': 'subsidy',
    'Financial Assistance': 'subsidy',
    'Loan': 'loan',
    'Insurance': 'insurance',
    'Training': 'training',
    'Equipment': 'equipment'
  };

  return {
    name: scheme.schemeName || scheme.name || scheme.title,
    nameHindi: scheme.schemeNameHi || scheme.nameHi,
    shortDescription: scheme.shortDescription || scheme.description?.substring(0, 200) || '',
    fullDescription: scheme.description || scheme.details || '',
    category: categoryMap[scheme.category] || 'other',
    status: 'active',
    source: 'myscheme.gov.in',
    externalId: scheme.id || scheme.slug || scheme.schemeId,
    externalUrl: scheme.slug ? `https://www.myscheme.gov.in/schemes/${scheme.slug}` : null,
    lastSyncedAt: new Date(),
    implementingAgency: {
      name: scheme.ministry || scheme.department || 'Ministry of Agriculture',
      type: scheme.schemeType === 'Central' ? 'central' : scheme.schemeType === 'State' ? 'state' : 'both',
      website: scheme.officialUrl || scheme.website
    },
    eligibility: {
      states: scheme.states || scheme.applicableStates || [],
      additionalCriteria: scheme.eligibility ?
        (Array.isArray(scheme.eligibility) ? scheme.eligibility : [scheme.eligibility]) : []
    },
    benefits: {
      description: scheme.benefits || scheme.benefitDescription || '',
      type: scheme.benefitType || 'financial'
    },
    applicationProcess: {
      mode: scheme.applicationMode || 'online',
      onlinePortal: scheme.applicationUrl || scheme.applyLink,
      steps: scheme.howToApply ? [scheme.howToApply] : []
    },
    tags: scheme.tags || [],
    documents: scheme.documentsRequired || []
  };
}

/**
 * Sync schemes from all government sources
 */
async function syncSchemesFromGovSources() {
  console.log('Starting government schemes sync...');

  const results = {
    total: 0,
    added: 0,
    updated: 0,
    errors: 0,
    sources: {}
  };

  try {
    // Fetch from all sources in parallel
    const [dataGovSchemes, apiSetuSchemes, mySchemeData, igodSchemes] = await Promise.all([
      fetchFromDataGovIn(),
      fetchFromApiSetu(),
      fetchFromMyScheme(),
      fetchFromIGOD()
    ]);

    results.sources = {
      dataGovIn: dataGovSchemes.length,
      apiSetu: apiSetuSchemes.length,
      myScheme: mySchemeData.length,
      igod: igodSchemes.length
    };

    // Combine all schemes
    const allExternalSchemes = [
      ...dataGovSchemes.map(s => ({ ...s, source: 'data.gov.in' })),
      ...apiSetuSchemes.map(s => ({ ...s, source: 'apisetu' })),
      ...mySchemeData.map(s => ({ ...s, source: 'myscheme' })),
      ...igodSchemes.map(s => ({ ...s, source: 'igod' }))
    ];

    results.total = allExternalSchemes.length;
    console.log(`Total schemes to process: ${results.total}`);

    // Process each scheme
    for (const extScheme of allExternalSchemes) {
      try {
        let schemeData;

        // Use appropriate transformer based on source
        if (extScheme.source === 'myscheme') {
          schemeData = transformMySchemeData(extScheme);
        } else {
          schemeData = transformSchemeData(extScheme, extScheme.source);
        }

        if (!schemeData.name) {
          console.log('Skipping scheme without name');
          continue;
        }

        // Check if scheme already exists
        const existingScheme = await Scheme.findOne({
          $or: [
            { externalId: schemeData.externalId },
            { name: schemeData.name }
          ]
        });

        if (existingScheme) {
          // Update existing scheme
          await Scheme.updateOne(
            { _id: existingScheme._id },
            {
              $set: {
                ...schemeData,
                updatedAt: new Date()
              }
            }
          );
          results.updated++;
        } else {
          // Create new scheme
          await Scheme.create(schemeData);
          results.added++;
        }
      } catch (err) {
        console.error('Error processing scheme:', err.message);
        results.errors++;
      }
    }

    // Also add/update official portals that might not be in API
    await syncOfficialPortals();

    console.log('Sync completed:', results);
    return results;

  } catch (error) {
    console.error('Error during sync:', error);
    throw error;
  }
}

/**
 * Sync official scheme portals to database
 */
async function syncOfficialPortals() {
  console.log('Syncing official scheme portals...');

  for (const [key, portal] of Object.entries(SCHEME_PORTALS)) {
    try {
      const existingScheme = await Scheme.findOne({
        $or: [
          { externalId: key },
          { name: portal.name }
        ]
      });

      const schemeData = {
        name: portal.name,
        externalId: key,
        source: 'official_portal',
        status: 'active',
        featured: true,
        applicationProcess: {
          mode: 'online',
          onlinePortal: portal.applyUrl
        },
        implementingAgency: {
          website: portal.website,
          helplineNumber: portal.helpline
        },
        lastSyncedAt: new Date()
      };

      if (existingScheme) {
        // Update portal info
        await Scheme.updateOne(
          { _id: existingScheme._id },
          {
            $set: {
              'applicationProcess.onlinePortal': portal.applyUrl,
              'implementingAgency.website': portal.website,
              'implementingAgency.helplineNumber': portal.helpline,
              featured: true,
              lastSyncedAt: new Date()
            }
          }
        );
      } else {
        // Create new
        await Scheme.create(schemeData);
      }
    } catch (err) {
      console.error(`Error syncing portal ${key}:`, err.message);
    }
  }
}

/**
 * Get list of official scheme portals with direct apply links
 */
function getOfficialSchemePortals() {
  return Object.values(SCHEME_PORTALS);
}

/**
 * Verify if a scheme portal is accessible
 */
async function verifySchemePortal(url) {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      validateStatus: (status) => status < 500
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Update scheme with latest portal information
 */
async function updateSchemePortalInfo(schemeId) {
  const scheme = await Scheme.findById(schemeId);
  if (!scheme) return null;

  // Find matching portal info
  const portalKey = Object.keys(SCHEME_PORTALS).find(key =>
    scheme.name.toLowerCase().includes(key.toLowerCase().replace(/_/g, ' '))
  );

  if (portalKey) {
    const portalInfo = SCHEME_PORTALS[portalKey];

    scheme.applicationProcess = {
      ...scheme.applicationProcess,
      mode: 'online',
      onlinePortal: portalInfo.applyUrl
    };

    scheme.implementingAgency = {
      ...scheme.implementingAgency,
      website: portalInfo.website,
      helplineNumber: portalInfo.helpline
    };

    await scheme.save();
    return scheme;
  }

  return null;
}

module.exports = {
  fetchFromDataGovIn,
  fetchFromApiSetu,
  fetchFromMyScheme,
  fetchFromIGOD,
  fetchSchemeDetails,
  syncSchemesFromGovSources,
  syncOfficialPortals,
  getOfficialSchemePortals,
  verifySchemePortal,
  updateSchemePortalInfo,
  SCHEME_PORTALS,
  GOV_SOURCES
};
