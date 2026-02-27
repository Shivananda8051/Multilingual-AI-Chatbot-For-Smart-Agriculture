import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiDownload, HiX } from 'react-icons/hi';
import { usePWA } from '../../hooks/usePWA';

const InstallBanner = () => {
  const { isInstallable, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (!installed) {
      // User declined, don't show again this session
      setDismissed(true);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 left-4 right-4 lg:bottom-4 lg:left-auto lg:right-4 lg:w-80 z-50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🌾</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white">Install AgriBot</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Add to home screen for quick access
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="btn btn-primary btn-sm flex items-center gap-1"
                >
                  <HiDownload className="w-4 h-4" />
                  Install
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="btn btn-ghost btn-sm text-gray-500"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallBanner;
