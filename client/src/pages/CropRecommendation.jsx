import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiSparkles,
  HiLocationMarker,
  HiBeaker,
  HiSun,
  HiClock,
  HiCurrencyRupee,
  HiChartBar,
  HiRefresh,
  HiInformationCircle,
  HiCheck,
  HiX
} from 'react-icons/hi';
import { useLanguage } from '../context/LanguageContext';
import { cropRecommendationAPI } from '../services/api';
import toast from 'react-hot-toast';

const CropRecommendation = () => {
  const { t } = useLanguage();
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [profitLoading, setProfitLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    soilType: '',
    state: '',
    season: '',
    waterAvailability: '',
    landSize: 1
  });

  // Translation maps for dropdown options
  const soilTypeLabels = {
    alluvial: t('soilAlluvial') || 'Alluvial Soil',
    black: t('soilBlack') || 'Black Soil (Regur)',
    red: t('soilRed') || 'Red Soil',
    laterite: t('soilLaterite') || 'Laterite Soil',
    sandy: t('soilSandy') || 'Sandy Soil',
    clay: t('soilClay') || 'Clay Soil',
    loamy: t('soilLoamy') || 'Loamy Soil'
  };

  const seasonLabels = {
    kharif: t('seasonKharif') || 'Kharif (Monsoon - Jun to Oct)',
    rabi: t('seasonRabi') || 'Rabi (Winter - Oct to Mar)',
    zaid: t('seasonZaid') || 'Zaid (Summer - Mar to Jun)'
  };

  const waterLabels = {
    irrigated: t('waterIrrigated') || 'Irrigated (Sufficient water)',
    rainfed: t('waterRainfed') || 'Rainfed (Dependent on rain)',
    limited: t('waterLimited') || 'Limited (Scarce water)'
  };

  const stateLabels = {
    'Andhra Pradesh': t('stateAP') || 'Andhra Pradesh',
    'Bihar': t('stateBihar') || 'Bihar',
    'Chhattisgarh': t('stateChhattisgarh') || 'Chhattisgarh',
    'Gujarat': t('stateGujarat') || 'Gujarat',
    'Haryana': t('stateHaryana') || 'Haryana',
    'Himachal Pradesh': t('stateHP') || 'Himachal Pradesh',
    'Jharkhand': t('stateJharkhand') || 'Jharkhand',
    'Karnataka': t('stateKarnataka') || 'Karnataka',
    'Kerala': t('stateKerala') || 'Kerala',
    'Madhya Pradesh': t('stateMP') || 'Madhya Pradesh',
    'Maharashtra': t('stateMaharashtra') || 'Maharashtra',
    'Odisha': t('stateOdisha') || 'Odisha',
    'Punjab': t('statePunjab') || 'Punjab',
    'Rajasthan': t('stateRajasthan') || 'Rajasthan',
    'Tamil Nadu': t('stateTN') || 'Tamil Nadu',
    'Telangana': t('stateTelangana') || 'Telangana',
    'Uttar Pradesh': t('stateUP') || 'Uttar Pradesh',
    'Uttarakhand': t('stateUttarakhand') || 'Uttarakhand',
    'West Bengal': t('stateWB') || 'West Bengal'
  };

  // Fetch options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await cropRecommendationAPI.getOptions();
        if (response.data?.success) {
          setOptions(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch options:', error);
        toast.error('Failed to load options');
      } finally {
        setOptionsLoading(false);
      }
    };
    fetchOptions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.soilType || !formData.state || !formData.season || !formData.waterAvailability) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    setRecommendations(null);
    setSelectedCrop(null);
    setProfitData(null);

    try {
      const response = await cropRecommendationAPI.getRecommendations(formData);
      if (response.data?.success) {
        setRecommendations(response.data.data);
      }
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      toast.error('Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleCropSelect = async (crop) => {
    setSelectedCrop(crop);
    setProfitLoading(true);
    setProfitData(null);

    try {
      const response = await cropRecommendationAPI.getProfitEstimation({
        cropName: crop.id,
        landSize: formData.landSize || 1,
        state: formData.state
      });
      if (response.data?.success) {
        setProfitData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to get profit estimation:', error);
    } finally {
      setProfitLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProfitabilityBadge = (profitability) => {
    const styles = {
      high: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-gray-100 text-gray-700'
    };
    return styles[profitability] || styles.medium;
  };

  const getDifficultyBadge = (difficulty) => {
    const styles = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      hard: 'bg-red-100 text-red-700'
    };
    return styles[difficulty] || styles.medium;
  };

  if (optionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
            <HiSparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('cropGuide') || 'Crop Guide'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('cropGuideDesc') || 'Get AI-powered crop suggestions based on your conditions'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Input Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
          {t('enterConditions') || 'Enter Your Conditions'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Soil Type */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                <HiBeaker className="w-5 h-5 text-primary-500" />
                {t('soilType') || 'Soil Type'} <span className="text-red-500">*</span>
              </label>
              <select
                name="soilType"
                value={formData.soilType}
                onChange={handleInputChange}
                className="input-field w-full"
                required
              >
                <option value="">{t('selectSoilType') || 'Select Soil Type'}</option>
                {options?.soilTypes?.map(soil => (
                  <option key={soil.value} value={soil.value}>{soilTypeLabels[soil.value] || soil.label}</option>
                ))}
              </select>
            </div>

            {/* State */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                <HiLocationMarker className="w-5 h-5 text-primary-500" />
                {t('state') || 'State'} <span className="text-red-500">*</span>
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="input-field w-full"
                required
              >
                <option value="">{t('selectState') || 'Select State'}</option>
                {options?.states?.map(state => (
                  <option key={state} value={state}>{stateLabels[state] || state}</option>
                ))}
              </select>
            </div>

            {/* Season */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                <HiSun className="w-5 h-5 text-yellow-500" />
                {t('season') || 'Season'} <span className="text-red-500">*</span>
              </label>
              <select
                name="season"
                value={formData.season}
                onChange={handleInputChange}
                className="input-field w-full"
                required
              >
                <option value="">{t('selectSeason') || 'Select Season'}</option>
                {options?.seasons?.map(season => (
                  <option key={season.value} value={season.value}>{seasonLabels[season.value] || season.label}</option>
                ))}
              </select>
            </div>

            {/* Water Availability */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                <HiChartBar className="w-5 h-5 text-blue-500" />
                {t('waterAvailability') || 'Water Availability'} <span className="text-red-500">*</span>
              </label>
              <select
                name="waterAvailability"
                value={formData.waterAvailability}
                onChange={handleInputChange}
                className="input-field w-full"
                required
              >
                <option value="">{t('selectWater') || 'Select Water Availability'}</option>
                {options?.waterAvailability?.map(water => (
                  <option key={water.value} value={water.value}>{waterLabels[water.value] || water.label}</option>
                ))}
              </select>
            </div>

            {/* Land Size */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {t('landSize') || 'Land Size (in acres)'}
              </label>
              <input
                type="number"
                name="landSize"
                value={formData.landSize}
                onChange={handleInputChange}
                min="0.5"
                step="0.5"
                className="input-field w-full"
                placeholder="Enter land size"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('analyzing') || 'Analyzing...'}
              </>
            ) : (
              <>
                <HiSparkles className="w-5 h-5" />
                {t('getRecommendations') || 'Get Recommendations'}
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Recommendations */}
      {recommendations && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('recommendedCrops') || 'Recommended Crops'}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('season')}: {recommendations.season}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.recommendations?.map((crop, index) => (
              <motion.div
                key={crop.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`card p-4 cursor-pointer transition-all ${
                  selectedCrop?.id === crop.id
                    ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleCropSelect(crop)}
              >
                {/* Score Badge */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {crop.name}
                    </h3>
                    <p className="text-xs text-gray-500">{crop.nameHi}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-sm font-bold ${getScoreColor(crop.score)}`}>
                    {crop.score}%
                  </span>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getProfitabilityBadge(crop.profitability)}`}>
                    {crop.profitability} profit
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyBadge(crop.difficulty)}`}>
                    {crop.difficulty}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <HiClock className="w-3 h-3" />
                    <span>{crop.growingPeriod}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <HiChartBar className="w-3 h-3" />
                    <span>Water: {crop.waterRequirement}</span>
                  </div>
                  {crop.marketData && (
                    <div className="flex items-center gap-1 text-green-600">
                      <HiCurrencyRupee className="w-3 h-3" />
                      <span>₹{crop.marketData.avgPrice}/qt</span>
                    </div>
                  )}
                </div>

                {/* Reasons */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="space-y-1">
                    {crop.reasons?.slice(0, 2).map((reason, i) => (
                      <div key={i} className="flex items-start gap-1 text-xs text-gray-500">
                        <HiCheck className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Profit Estimation */}
      {selectedCrop && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('profitEstimation') || 'Profit Estimation'} - {selectedCrop.name}
          </h2>

          {profitLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : profitData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{t('expectedYield') || 'Expected Yield'}</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {profitData.estimation.expectedYield}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{t('marketPrice') || 'Market Price'}</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {profitData.estimation.currentMarketPrice}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{t('estimatedCost') || 'Estimated Cost'}</p>
                  <p className="font-semibold text-red-600">
                    {profitData.estimation.estimatedCost}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{t('netProfit') || 'Net Profit'}</p>
                  <p className={`font-bold text-lg ${profitData.estimation.profitable ? 'text-green-600' : 'text-red-600'}`}>
                    {profitData.estimation.netProfit}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <HiInformationCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {profitData.disclaimer}
                </p>
              </div>

              {/* Tips */}
              {selectedCrop.tips?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {t('farmingTips') || 'Farming Tips'}
                  </h3>
                  <ul className="space-y-2">
                    {selectedCrop.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <HiCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              {t('selectCropForProfit') || 'Click on a crop to see profit estimation'}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default CropRecommendation;
