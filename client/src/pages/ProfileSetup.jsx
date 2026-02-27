import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiUser, HiLocationMarker, HiCheck, HiArrowRight } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { useLanguage, languages } from '../context/LanguageContext';

const cropOptions = [
  'Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Maize', 'Soybean',
  'Groundnut', 'Pulses', 'Vegetables', 'Fruits', 'Spices', 'Tea/Coffee'
];

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { updateUser, user } = useAuth();
  const { t, changeLanguage } = useLanguage();
  const { location, getLocation, loading: locationLoading } = useGeolocation();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    preferredLanguage: 'en',
    cropsGrown: [],
    location: null
  });

  useEffect(() => {
    if (user?.isProfileComplete) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (location) {
      // Reverse geocode to get city/state (simplified)
      setFormData(prev => ({
        ...prev,
        location: {
          coordinates: { lat: location.lat, lng: location.lng }
        }
      }));
    }
  }, [location]);

  const handleCropToggle = (crop) => {
    setFormData(prev => ({
      ...prev,
      cropsGrown: prev.cropsGrown.includes(crop)
        ? prev.cropsGrown.filter(c => c !== crop)
        : [...prev.cropsGrown, crop]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.setupProfile(formData);
      updateUser(response.data.user);
      changeLanguage(formData.preferredLanguage);
      toast.success('Profile setup complete!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to setup profile');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4">
                <HiUser className="w-10 h-10 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold">What's your name?</h2>
              <p className="text-gray-500 mt-2">This helps us personalize your experience</p>
            </div>

            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your name"
              className="input text-center text-lg"
            />

            <button
              onClick={() => setStep(2)}
              disabled={!formData.name}
              className="btn btn-primary w-full py-3"
            >
              Continue <HiArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold">Choose your language</h2>
              <p className="text-gray-500 mt-2">Select your preferred language</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setFormData({ ...formData, preferredLanguage: lang.code })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.preferredLanguage === lang.code
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{lang.nativeName}</div>
                  <div className="text-sm text-gray-500">{lang.name}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(3)}
              className="btn btn-primary w-full py-3"
            >
              Continue <HiArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold">What crops do you grow?</h2>
              <p className="text-gray-500 mt-2">Select all that apply</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {cropOptions.map((crop) => (
                <button
                  key={crop}
                  onClick={() => handleCropToggle(crop)}
                  className={`p-3 rounded-lg border-2 text-sm transition-all ${
                    formData.cropsGrown.includes(crop)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  {formData.cropsGrown.includes(crop) && (
                    <HiCheck className="w-4 h-4 inline mr-1" />
                  )}
                  {crop}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(4)}
              className="btn btn-primary w-full py-3"
            >
              Continue <HiArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4">
                <HiLocationMarker className="w-10 h-10 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold">Enable Location</h2>
              <p className="text-gray-500 mt-2">
                We need your location to provide weather updates and local farming advice
              </p>
            </div>

            {formData.location ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                <HiCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 dark:text-green-400">Location enabled!</p>
              </div>
            ) : (
              <button
                onClick={getLocation}
                disabled={locationLoading}
                className="btn btn-outline w-full py-3"
              >
                {locationLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent" />
                ) : (
                  <>
                    <HiLocationMarker className="w-5 h-5" />
                    Allow Location Access
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn btn-primary w-full py-3"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Complete Setup <HiCheck className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              onClick={handleSubmit}
              className="text-gray-500 hover:text-gray-700 text-sm w-full"
            >
              Skip for now
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step ? 'w-8 bg-primary-500' : s < step ? 'w-2 bg-primary-500' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
