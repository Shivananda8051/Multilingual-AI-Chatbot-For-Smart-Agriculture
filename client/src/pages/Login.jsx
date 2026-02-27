import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiPhone, HiShieldCheck, HiArrowRight, HiChatAlt2 } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getFCMToken } from '../config/firebase';

const Login = () => {
  const [step, setStep] = useState('phone'); // phone, choose-method, otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMethod, setOtpMethod] = useState(null); // 'whatsapp' or 'sms'
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const { login } = useAuth();
  const { t } = useLanguage();

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setStep('choose-method');
  };

  const handleSelectMethod = async (method) => {
    setOtpMethod(method);
    setLoading(true);

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

      if (method === 'whatsapp') {
        const response = await authAPI.sendWhatsAppOTP(formattedPhone);
        if (response.data.otp) {
          setDevOtp(response.data.otp);
          toast.success(`Dev Mode - OTP: ${response.data.otp}`);
        } else {
          toast.success('OTP sent to your WhatsApp!');
        }
      } else {
        // SMS OTP
        const response = await authAPI.sendSmsOTP(formattedPhone);
        if (response.data.otp) {
          setDevOtp(response.data.otp);
          toast.success(`Dev Mode - OTP: ${response.data.otp}`);
        } else {
          toast.success('OTP sent via SMS!');
        }
      }
      setStep('otp');
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

      // Get FCM token for push notifications
      let fcmToken = null;
      try {
        fcmToken = await getFCMToken();
      } catch (fcmError) {
        console.warn('Could not get FCM token:', fcmError);
      }

      // Both WhatsApp and SMS use the same verification endpoint
      const response = await authAPI.verifyWhatsAppOTP(formattedPhone, otp, fcmToken);
      toast.success('Login successful!');
      login(response.data.token, response.data.user, fcmToken);
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (otpMethod) {
      handleSelectMethod(otpMethod);
    }
  };

  const handleChangeNumber = () => {
    setStep('phone');
    setOtp('');
    setOtpMethod(null);
    setDevOtp('');
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('choose-method');
      setOtp('');
    } else if (step === 'choose-method') {
      setStep('phone');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-lg mb-4">
            <span className="text-4xl font-bold text-primary-600">A</span>
          </div>
          <h1 className="text-3xl font-bold text-white">AgriBot</h1>
          <p className="text-white/80 mt-2">Smart Agriculture Chatbot</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Phone Number */}
            {step === 'phone' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h2 className="text-2xl font-bold text-center mb-2">{t('welcomeBack')}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
                  Enter your phone number to continue
                </p>

                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('phone')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                        <HiPhone className="w-5 h-5 text-gray-400" />
                        <span className="ml-2 text-gray-500">+91</span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className="input pl-20"
                        maxLength={10}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={phone.length < 10}
                    className="btn btn-primary w-full py-3"
                  >
                    Continue
                    <HiArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 2: Choose OTP Method */}
            {step === 'choose-method' && (
              <motion.div
                key="choose-method"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h2 className="text-2xl font-bold text-center mb-2">Choose OTP Method</h2>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
                  How would you like to receive your OTP?
                </p>

                <div className="space-y-3">
                  {/* WhatsApp Option */}
                  <button
                    onClick={() => handleSelectMethod('whatsapp')}
                    disabled={loading}
                    className="w-full p-4 rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:border-green-500 hover:bg-green-100 dark:hover:bg-green-900/40 transition-all flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <FaWhatsapp className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-green-800 dark:text-green-200">WhatsApp</p>
                      <p className="text-sm text-green-600 dark:text-green-400">Receive OTP on WhatsApp</p>
                    </div>
                    {loading && otpMethod === 'whatsapp' ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent" />
                    ) : (
                      <HiArrowRight className="w-5 h-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>

                  {/* SMS Option */}
                  <button
                    onClick={() => handleSelectMethod('sms')}
                    disabled={loading}
                    className="w-full p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                      <HiChatAlt2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-blue-800 dark:text-blue-200">SMS</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Receive OTP via text message</p>
                    </div>
                    {loading && otpMethod === 'sms' ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
                    ) : (
                      <HiArrowRight className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                </div>

                <button
                  onClick={handleBack}
                  className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ← Change phone number
                </button>
              </motion.div>
            )}

            {/* Step 3: Enter OTP */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h2 className="text-2xl font-bold text-center mb-2">{t('verifyOTP')}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                  Enter the OTP sent to {otpMethod === 'whatsapp' ? 'your WhatsApp' : 'your phone'}
                </p>

                {/* Method indicator */}
                <div className={`mb-4 p-3 rounded-lg flex items-center justify-center gap-2 ${
                  otpMethod === 'whatsapp'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                }`}>
                  {otpMethod === 'whatsapp' ? (
                    <FaWhatsapp className="w-5 h-5" />
                  ) : (
                    <HiChatAlt2 className="w-5 h-5" />
                  )}
                  <span className="text-sm font-medium">+91 {phone}</span>
                </div>

                {/* Development Mode OTP Display */}
                {devOtp && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center">
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">Development Mode</p>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 tracking-widest">{devOtp}</p>
                  </div>
                )}

                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('enterOTP')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                        <HiShieldCheck className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                        className="input pl-12 text-center text-2xl tracking-widest"
                        maxLength={6}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="btn btn-primary w-full py-3"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        {t('verifyOTP')}
                        <HiArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={handleChangeNumber}
                      className="text-primary-600 hover:underline"
                    >
                      Change number
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-primary-600 hover:underline"
                    >
                      {t('resendOTP')}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-6">
          By continuing, you agree to our Terms of Service
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
