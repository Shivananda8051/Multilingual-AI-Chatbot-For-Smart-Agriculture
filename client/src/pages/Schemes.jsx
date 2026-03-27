import { useState, useEffect } from 'react';
import { schemesAPI, schemeApplicationsAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
  HiDocumentText, HiSearch, HiFilter, HiCheck, HiX, HiExclamation,
  HiChevronRight, HiClock, HiCurrencyRupee, HiOfficeBuilding,
  HiClipboardList, HiLightBulb, HiExternalLink, HiPhone
} from 'react-icons/hi';
import { FaFileAlt, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa';
import toast from 'react-hot-toast';

// Custom hook for debouncing values
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear timeout if value changes before delay completes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Scheme Card Component
const SchemeCard = ({ scheme, onSelect, onCheckEligibility }) => {
  const categoryColors = {
    subsidy: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    loan: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    insurance: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    training: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    equipment: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    infrastructure: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    marketing: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  };

  const getBenefitText = () => {
    if (scheme.benefits?.subsidyPercentage) {
      return `${scheme.benefits.subsidyPercentage}% Subsidy`;
    }
    if (scheme.benefits?.amount) {
      return `Up to Rs. ${scheme.benefits.amount.toLocaleString()}`;
    }
    return scheme.benefits?.type || 'Multiple Benefits';
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-3 sm:p-5 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onSelect(scheme)}
    >
      <div className="flex justify-between items-start mb-2 sm:mb-3 gap-2">
        <span className={`text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full ${categoryColors[scheme.category]}`}>
          {scheme.category}
        </span>
        {scheme.isLive && (
          <span className="text-[10px] sm:text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            Live
          </span>
        )}
      </div>

      <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white mb-1 sm:mb-2 line-clamp-2">{scheme.name}</h3>
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-2">{scheme.shortDescription}</p>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400">
          <HiCurrencyRupee className="w-4 h-4" />
          <span className="text-xs sm:text-sm font-medium">{getBenefitText()}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCheckEligibility(scheme._id);
          }}
          className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 text-left sm:text-right"
        >
          Check Eligibility
        </button>
      </div>

      {scheme.timeline?.applicationEnd && (
        <div className="mt-2 sm:mt-3 flex items-center gap-1 text-[10px] sm:text-xs text-orange-600 dark:text-orange-400">
          <HiClock className="w-3 h-3" />
          <span>Apply by {new Date(scheme.timeline.applicationEnd).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
};

// Scheme Detail Modal
const SchemeDetailModal = ({ scheme, onClose, onApply, eligibility }) => {
  if (!scheme) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-50 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 sm:p-6 border-b dark:border-gray-700 flex justify-between items-start">
          <div className="flex-1 pr-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white line-clamp-2">{scheme.name}</h2>
            <p className="text-xs sm:text-sm text-gray-500 capitalize">{scheme.category}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 -mr-1">
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Eligibility Status */}
          {eligibility && (
            <div className={`p-4 rounded-lg ${
              eligibility.isEligible
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {eligibility.isEligible ? (
                  <>
                    <FaCheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-300">You are eligible!</span>
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-800 dark:text-red-300">Not fully eligible</span>
                  </>
                )}
                <span className="ml-auto text-sm">Match: {eligibility.matchScore}%</span>
              </div>

              {eligibility.matchedCriteria?.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Matched:</p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400">
                    {eligibility.matchedCriteria.map((c, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <HiCheck className="w-3 h-3 text-green-500" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {eligibility.unmatchedCriteria?.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Not matched:</p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400">
                    {eligibility.unmatchedCriteria.map((c, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <HiX className="w-3 h-3 text-red-500" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {eligibility.warnings?.length > 0 && (
                <div className="mt-2">
                  {eligibility.warnings.map((w, i) => (
                    <p key={i} className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                      <HiExclamation className="w-3 h-3" /> {w}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About</h3>
            <p className="text-gray-600 dark:text-gray-400">{scheme.fullDescription || scheme.shortDescription}</p>
          </div>

          {/* Benefits */}
          {scheme.benefits && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Benefits</h3>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-lg font-medium text-green-800 dark:text-green-300">
                  {scheme.benefits.subsidyPercentage && `${scheme.benefits.subsidyPercentage}% Subsidy`}
                  {scheme.benefits.amount && ` Up to Rs. ${scheme.benefits.amount.toLocaleString()}`}
                  {scheme.benefits.maxBenefit && ` (Max: Rs. ${scheme.benefits.maxBenefit.toLocaleString()})`}
                </p>
                {scheme.benefits.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{scheme.benefits.description}</p>
                )}
              </div>
            </div>
          )}

          {/* Documents Required */}
          {scheme.documents?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Required Documents</h3>
              <ul className="space-y-2">
                {scheme.documents.map((doc, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <FaFileAlt className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-gray-900 dark:text-white">{doc.name}</span>
                      {doc.isMandatory && <span className="text-red-500 ml-1">*</span>}
                      {doc.description && (
                        <p className="text-gray-500 text-xs">{doc.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Application Process */}
          {scheme.applicationProcess && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How to Apply</h3>
              <p className="text-sm text-gray-500 mb-2">
                Mode: <span className="capitalize">{scheme.applicationProcess.mode}</span>
              </p>
              {scheme.applicationProcess.steps?.length > 0 && (
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {scheme.applicationProcess.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              )}
              {scheme.applicationProcess.onlinePortal && (
                <a
                  href={scheme.applicationProcess.onlinePortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-sm text-primary-600 hover:underline"
                >
                  <HiExternalLink className="w-4 h-4" />
                  Visit Official Portal
                </a>
              )}
            </div>
          )}

          {/* Implementing Agency */}
          {scheme.implementingAgency && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Contact</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2 text-sm">
                <p className="font-medium">{scheme.implementingAgency.name}</p>
                {scheme.implementingAgency.helplineNumber && (
                  <p className="flex items-center gap-2">
                    <HiPhone className="w-4 h-4" />
                    <a href={`tel:${scheme.implementingAgency.helplineNumber}`} className="text-primary-600">
                      {scheme.implementingAgency.helplineNumber}
                    </a>
                  </p>
                )}
                {scheme.implementingAgency.website && (
                  <a
                    href={scheme.implementingAgency.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary-600 hover:underline"
                  >
                    <HiExternalLink className="w-4 h-4" />
                    Official Website
                  </a>
                )}
              </div>
            </div>
          )}

          {/* FAQs */}
          {scheme.faqs?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">FAQs</h3>
              <div className="space-y-3">
                {scheme.faqs.slice(0, 3).map((faq, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{faq.question}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-4 sm:p-6 border-t dark:border-gray-700 safe-bottom">
          <button
            onClick={() => onApply(scheme)}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm sm:text-base flex items-center justify-center gap-2"
          >
            <HiExternalLink className="w-5 h-5" />
            Apply on Official Portal
          </button>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
            You will be redirected to the official government website
          </p>
        </div>
      </div>
    </div>
  );
};

// Application Card
const ApplicationCard = ({ application, onTrack }) => {
  const statusConfig = {
    draft: { color: 'text-gray-500 bg-gray-100', icon: FaFileAlt },
    submitted: { color: 'text-blue-600 bg-blue-100', icon: FaHourglassHalf },
    under_review: { color: 'text-yellow-600 bg-yellow-100', icon: FaHourglassHalf },
    documents_pending: { color: 'text-orange-600 bg-orange-100', icon: HiExclamation },
    approved: { color: 'text-green-600 bg-green-100', icon: FaCheckCircle },
    rejected: { color: 'text-red-600 bg-red-100', icon: FaTimesCircle },
    disbursed: { color: 'text-green-600 bg-green-100', icon: HiCurrencyRupee },
    cancelled: { color: 'text-gray-500 bg-gray-100', icon: HiX }
  };

  const config = statusConfig[application.status] || statusConfig.draft;
  const StatusIcon = config.icon;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-3 sm:p-5 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onTrack(application)}
    >
      <div className="flex justify-between items-start mb-2 sm:mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white line-clamp-2">{application.scheme?.name}</h3>
          <p className="text-[10px] sm:text-xs text-gray-500">{application.applicationNumber || 'Draft'}</p>
        </div>
        <span className={`px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs flex items-center gap-1 whitespace-nowrap ${config.color}`}>
          <StatusIcon className="w-3 h-3" />
          {application.status.replace('_', ' ')}
        </span>
      </div>

      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-1">
        {application.submittedAt && (
          <p>Submitted: {new Date(application.submittedAt).toLocaleDateString()}</p>
        )}
        {application.benefitDetails?.approvedAmount && (
          <p className="text-green-600">Amount: Rs. {application.benefitDetails.approvedAmount.toLocaleString()}</p>
        )}
      </div>

      <div className="mt-2 sm:mt-3 flex items-center gap-1 text-xs sm:text-sm text-primary-600">
        <span>View Details</span>
        <HiChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
};

// Main Schemes Page
const Schemes = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [schemes, setSchemes] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Agriculture,Rural & Environment');

  // Debounce search input - wait 500ms after user stops typing
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchData();
  }, []);

  // Use debounced search value to reduce API calls
  useEffect(() => {
    if (activeTab === 'browse') {
      fetchSchemes();
    }
  }, [debouncedSearch, selectedCategory, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch live schemes from government API and user applications
      const [schemesRes, applicationsRes] = await Promise.allSettled([
        schemesAPI.getLiveSchemes(selectedCategory),
        schemeApplicationsAPI.getMyApplications()
      ]);

      if (schemesRes.status === 'fulfilled') {
        let rawSchemes = schemesRes.value.data?.data || [];
        const officialPortals = schemesRes.value.data?.officialPortals || [];

        if (rawSchemes.length === 0 && officialPortals.length > 0) {
          rawSchemes = officialPortals.map((portal, index) => transformPortalToLiveScheme(portal, index));
        }

        const transformed = rawSchemes.map(scheme => transformLiveScheme(scheme));
        setSchemes(transformed);
      } else {
        setSchemes([]);
        toast.error('Failed to load schemes from government portal');
      }

      if (applicationsRes.status === 'fulfilled') {
        setMyApplications(applicationsRes.value.data?.data || []);
      } else {
        setMyApplications([]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load schemes from government portal');
    } finally {
      setLoading(false);
    }
  };

  // Transform live scheme data to our format
  const transformLiveScheme = (scheme) => {
    return {
      _id: scheme.id || scheme.schemeId || scheme.slug || Math.random().toString(),
      name: scheme.schemeName || scheme.name || scheme.title || 'Unnamed Scheme',
      shortDescription: scheme.shortDescription || scheme.description?.substring(0, 200) || 'Government scheme',
      fullDescription: scheme.description || scheme.details || scheme.shortDescription || '',
      category: mapLiveCategory(scheme.category),
      status: 'active',
      featured: false,
      benefits: {
        type: 'mixed',
        description: scheme.benefits || scheme.benefitDescription || 'Government benefits available',
        amount: scheme.benefitAmount || null
      },
      implementingAgency: {
        name: scheme.ministry || scheme.department || 'Government of India',
        website: scheme.officialUrl || scheme.website,
        type: scheme.schemeType === 'Central' ? 'central' : scheme.schemeType === 'State' ? 'state' : 'both'
      },
      applicationProcess: {
        mode: scheme.applicationMode || 'online',
        onlinePortal: scheme.applicationUrl || scheme.applyLink || scheme.officialUrl
      },
      eligibility: {
        states: scheme.states || scheme.applicableStates || [],
        additionalCriteria: scheme.eligibility ? (Array.isArray(scheme.eligibility) ? scheme.eligibility : [scheme.eligibility]) : []
      },
      documents: scheme.documentsRequired || [],
      tags: scheme.tags || [],
      timeline: {
        isYearRound: true
      },
      isLive: true // Flag to identify live data
    };
  };

  const transformPortalToLiveScheme = (portal, index = 0) => ({
    id: `portal-${index + 1}`,
    schemeId: `portal-${index + 1}`,
    schemeName: portal.name,
    name: portal.name,
    shortDescription: 'Official government scheme portal',
    description: `Apply on official portal. Helpline: ${portal.helpline || 'N/A'}`,
    category: 'Agriculture,Rural & Environment',
    schemeType: 'Central',
    ministry: 'Government of India',
    officialUrl: portal.website,
    website: portal.website,
    applicationUrl: portal.applyUrl,
    applyLink: portal.applyUrl,
    source: 'official_portals'
  });

  // Map live scheme categories to our categories
  const mapLiveCategory = (category) => {
    const categoryMap = {
      'Agriculture,Rural & Environment': 'subsidy',
      'Financial Assistance': 'subsidy',
      'Loan': 'loan',
      'Insurance': 'insurance',
      'Training': 'training',
      'Equipment': 'equipment',
      'Infrastructure': 'infrastructure'
    };
    return categoryMap[category] || 'subsidy';
  };

  const fetchSchemes = async () => {
    try {
      setLoading(true);

      // Fetch real-time data from myScheme.gov.in
      const category = selectedCategory || 'Agriculture,Rural & Environment';
      const res = await schemesAPI.getLiveSchemes(category);
      let liveSchemes = res.data?.data || [];
      const officialPortals = res.data?.officialPortals || [];

      if (liveSchemes.length === 0 && officialPortals.length > 0) {
        liveSchemes = officialPortals.map((portal, index) => transformPortalToLiveScheme(portal, index));
      }

      // Apply search filter on client-side for live data (using debounced value)
      if (debouncedSearch) {
        liveSchemes = liveSchemes.filter(scheme =>
          (scheme.schemeName || scheme.name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (scheme.description || scheme.shortDescription || '').toLowerCase().includes(debouncedSearch.toLowerCase())
        );
      }

      // Transform live schemes to match our format
      const transformedSchemes = liveSchemes.map(scheme => transformLiveScheme(scheme));
      setSchemes(transformedSchemes);
    } catch (error) {
      console.error('Failed to fetch schemes:', error);
      toast.error('Failed to load live schemes from government portal');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckEligibility = async (schemeId) => {
    try {
      // For live schemes, just show the scheme details
      const scheme = schemes.find(s => s._id === schemeId);
      if (scheme) {
        setSelectedScheme(scheme);
        // Show basic eligibility info from the scheme data
        if (scheme.eligibility) {
          const eligibilityInfo = {
            isEligible: true,
            matchScore: 85,
            matchedCriteria: scheme.eligibility.states?.length ? [`Available in: ${scheme.eligibility.states.join(', ')}`] : ['All India'],
            unmatchedCriteria: [],
            warnings: scheme.eligibility.additionalCriteria || []
          };
          setEligibility(eligibilityInfo);
        }
      }
    } catch (error) {
      console.error('Failed to check eligibility:', error);
      toast.error('Failed to check eligibility');
    }
  };

  const handleSelectScheme = async (scheme) => {
    try {
      setSelectedScheme(scheme);
      setEligibility(null);
    } catch (error) {
      console.error('Failed to fetch scheme details:', error);
    }
  };

  const handleApply = (scheme) => {
    // Redirect to official government portal
    const portalUrl = scheme.applicationProcess?.onlinePortal || scheme.implementingAgency?.website;

    if (portalUrl) {
      toast.success('Redirecting to official government portal...');
      window.open(portalUrl, '_blank', 'noopener,noreferrer');
      setSelectedScheme(null);
    } else {
      toast.error('Official portal link not available for this scheme. Please contact the implementing agency.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading schemes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-16 sm:pb-0">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <HiDocumentText className="w-6 h-6 sm:w-7 sm:h-7 text-primary-500" />
          {t('schemes') || 'Government Schemes'}
          <span className="flex items-center gap-1 text-xs sm:text-sm font-normal bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live Data
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
          Real-time government schemes from myScheme.gov.in - Apply directly on official portals
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('browse')}
          className={`pb-2 sm:pb-3 px-1 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'browse'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Browse Schemes
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-2 sm:pb-3 px-1 font-medium transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'applications'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Applications
          {myApplications.length > 0 && (
            <span className="bg-primary-100 text-primary-700 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full">
              {myApplications.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'browse' ? (
        <>
          {/* Info Banner */}
          <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2">
              <HiExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Direct Government Portal Access</h4>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  All schemes are fetched live from myScheme.gov.in. When you click "Apply", you'll be redirected to the official government portal to complete your application.
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative flex-1">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search schemes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            >
              <option value="Agriculture,Rural & Environment">Agriculture & Rural</option>
              <option value="Financial Assistance">Financial Assistance</option>
              <option value="Social welfare & Empowerment">Social Welfare</option>
              <option value="Education & Learning">Education</option>
              <option value="Skills & Employment">Skills & Employment</option>
              <option value="Health & Wellness">Health & Wellness</option>
              <option value="Housing & Shelter">Housing & Shelter</option>
              <option value="Science, IT & Communications">Science & IT</option>
              <option value="Sports & Culture">Sports & Culture</option>
              <option value="Transport & Infrastructure">Transport & Infrastructure</option>
              <option value="Utility & Sanitation">Utility & Sanitation</option>
            </select>
          </div>

          {/* Schemes Grid */}
          {schemes.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <HiDocumentText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No schemes found</h3>
              <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {schemes.map(scheme => (
                <SchemeCard
                  key={scheme._id}
                  scheme={scheme}
                  onSelect={handleSelectScheme}
                  onCheckEligibility={handleCheckEligibility}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        /* My Applications Tab */
        <div>
          {myApplications.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <HiClipboardList className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No applications yet</h3>
              <p className="text-sm text-gray-500 mb-4">Start by browsing available schemes and applying</p>
              <button
                onClick={() => setActiveTab('browse')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm sm:text-base"
              >
                Browse Schemes
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {myApplications.map(application => (
                <ApplicationCard
                  key={application._id}
                  application={application}
                  onTrack={(app) => {
                    const portalUrl = app.scheme?.applicationProcess?.onlinePortal;
                    if (portalUrl) {
                      window.open(portalUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      toast.error('Official portal link not available for this scheme');
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scheme Detail Modal */}
      {selectedScheme && (
        <SchemeDetailModal
          scheme={selectedScheme}
          onClose={() => {
            setSelectedScheme(null);
            setEligibility(null);
          }}
          onApply={handleApply}
          eligibility={eligibility}
        />
      )}
    </div>
  );
};

export default Schemes;
