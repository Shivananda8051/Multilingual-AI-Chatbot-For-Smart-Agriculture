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
      <div className="flex justify-between items-start mb-2 sm:mb-3">
        <span className={`text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full ${categoryColors[scheme.category]}`}>
          {scheme.category}
        </span>
        {scheme.featured && (
          <span className="text-[10px] sm:text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-0.5 sm:py-1 rounded-full">
            Featured
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
            onClick={() => onApply(scheme._id)}
            disabled={eligibility && !eligibility.isEligible}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
          >
            {eligibility && !eligibility.isEligible ? 'Not Eligible to Apply' : 'Start Application'}
          </button>
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
  const [recommendations, setRecommendations] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchSchemes();
    }
  }, [search, selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schemesRes, recommendationsRes, categoriesRes, applicationsRes] = await Promise.all([
        schemesAPI.getSchemes({ featured: 'true', limit: 10 }),
        schemesAPI.getRecommendations(),
        schemesAPI.getCategories(),
        schemeApplicationsAPI.getMyApplications()
      ]);

      setSchemes(schemesRes.data?.data || []);
      setRecommendations(recommendationsRes.data?.data || []);
      setCategories(categoriesRes.data?.data || []);
      setMyApplications(applicationsRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load schemes');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchemes = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;

      const res = await schemesAPI.getSchemes(params);
      setSchemes(res.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch schemes:', error);
    }
  };

  const handleCheckEligibility = async (schemeId) => {
    try {
      const res = await schemesAPI.checkEligibility(schemeId);
      setEligibility(res.data?.data);

      const scheme = schemes.find(s => s._id === schemeId) ||
                     recommendations.find(r => r.scheme._id === schemeId)?.scheme;

      if (scheme) {
        const fullSchemeRes = await schemesAPI.getScheme(schemeId);
        setSelectedScheme(fullSchemeRes.data?.data);
      }
    } catch (error) {
      console.error('Failed to check eligibility:', error);
      toast.error('Failed to check eligibility');
    }
  };

  const handleSelectScheme = async (scheme) => {
    try {
      const res = await schemesAPI.getScheme(scheme._id);
      setSelectedScheme(res.data?.data);
      setEligibility(null);
    } catch (error) {
      console.error('Failed to fetch scheme details:', error);
    }
  };

  const handleApply = async (schemeId) => {
    try {
      const res = await schemeApplicationsAPI.createApplication({ schemeId });
      toast.success('Application started! Complete and submit your application.');
      setSelectedScheme(null);
      setActiveTab('applications');
      fetchData();
    } catch (error) {
      console.error('Failed to start application:', error);
      toast.error(error.response?.data?.message || 'Failed to start application');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
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
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
          Discover and apply for agricultural subsidies and government benefits
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
          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <HiLightBulb className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                <h2 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Recommended for You</h2>
              </div>
              <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
                {recommendations.slice(0, 4).map((rec, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectScheme(rec.scheme)}
                    className="flex-shrink-0 bg-gradient-to-br from-primary-50 to-green-50 dark:from-primary-900/20 dark:to-green-900/20 rounded-xl p-3 sm:p-4 min-w-[220px] sm:min-w-[280px] cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white line-clamp-2">{rec.scheme.name}</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 capitalize">{rec.scheme.category}</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 line-clamp-2">
                      {rec.scheme.shortDescription}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] sm:text-xs text-primary-600 line-clamp-1">{rec.reason}</span>
                      <span className="text-[10px] sm:text-xs bg-white dark:bg-gray-700 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                        {rec.matchScore}% match
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.category} value={cat.category}>
                  {cat.category} ({cat.count})
                </option>
              ))}
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
