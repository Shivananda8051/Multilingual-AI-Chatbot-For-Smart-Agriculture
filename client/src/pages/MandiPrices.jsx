import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiSearch, HiFilter, HiLocationMarker, HiCurrencyRupee,
  HiTrendingUp, HiRefresh, HiChevronDown, HiExternalLink,
  HiArrowUp, HiArrowDown, HiInformationCircle
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { mandiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MandiPrices = () => {
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState('prices');
  const [prices, setPrices] = useState([]);
  const [trending, setTrending] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState([]);
  const [filters, setFilters] = useState({
    state: user?.location?.state || '',
    commodity: '',
    market: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState(null);

  // Load states on mount
  useEffect(() => {
    loadStates();
    loadTrending();
  }, []);

  // Load prices when filters change
  useEffect(() => {
    loadPrices();
  }, [filters]);

  const loadStates = async () => {
    try {
      const response = await mandiAPI.getStates();
      setStates(response.data.states || []);
    } catch (error) {
      console.error('Failed to load states:', error);
    }
  };

  const loadTrending = async () => {
    try {
      const response = await mandiAPI.getTrending(filters.state || null);
      setTrending(response.data.trending || []);
    } catch (error) {
      console.error('Failed to load trending:', error);
    }
  };

  const loadPrices = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 50,
        ...(filters.state && { state: filters.state }),
        ...(filters.commodity && { commodity: filters.commodity }),
        ...(filters.market && { market: filters.market })
      };

      const response = await mandiAPI.getPrices(params);
      setPrices(response.data.records || []);
    } catch (error) {
      toast.error('Failed to load mandi prices');
      console.error('Load prices error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async (commodity) => {
    setSelectedCommodity(commodity);
    setActiveTab('compare');
    try {
      const response = await mandiAPI.getPriceComparison(commodity, filters.state || null);
      setComparison(response.data);
    } catch (error) {
      toast.error('Failed to load price comparison');
      console.error('Load comparison error:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setFilters(prev => ({ ...prev, commodity: searchQuery.trim() }));
    }
  };

  const clearFilters = () => {
    setFilters({ state: '', commodity: '', market: '' });
    setSearchQuery('');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Price Card Component
  const PriceCard = ({ item }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{item.commodity}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{item.variety || 'Standard'}</p>
        </div>
        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
          {item.grade || 'FAQ'}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
        <HiLocationMarker className="text-red-500" />
        <span>{item.market}, {item.district}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">Min</p>
          <p className="font-semibold text-gray-900 dark:text-white">{formatPrice(item.minPrice)}</p>
        </div>
        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">Modal</p>
          <p className="font-bold text-green-600 dark:text-green-400">{formatPrice(item.modalPrice)}</p>
        </div>
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">Max</p>
          <p className="font-semibold text-gray-900 dark:text-white">{formatPrice(item.maxPrice)}</p>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <span>{item.arrivalDate}</span>
        <span>{item.priceUnit}</span>
      </div>

      <button
        onClick={() => loadComparison(item.commodity)}
        className="mt-3 w-full py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
      >
        Compare Prices
      </button>
    </motion.div>
  );

  // Trending Card Component
  const TrendingCard = ({ item, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => {
        setFilters(prev => ({ ...prev, commodity: item.commodity }));
        setSearchQuery(item.commodity);
      }}
      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl cursor-pointer hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
    >
      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
        {index + 1}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900 dark:text-white">{item.commodity}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{item.marketCount} markets</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-green-600 dark:text-green-400">{formatPrice(item.avgPrice)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">avg/quintal</p>
      </div>
    </motion.div>
  );

  // Comparison View
  const ComparisonView = () => (
    <div className="space-y-4">
      {comparison && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {comparison.commodity} - Market Comparison
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Comparing prices across {comparison.comparison?.length || 0} markets
            </p>
          </div>

          {comparison.bestMarket && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <HiArrowUp className="text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Best Price</span>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">{comparison.bestMarket.market}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{comparison.bestMarket.district}, {comparison.bestMarket.state}</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-2">
                {formatPrice(comparison.bestMarket.avgPrice)}/quintal
              </p>
            </div>
          )}

          {comparison.lowestMarket && comparison.bestMarket?.market !== comparison.lowestMarket?.market && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-2">
                <HiArrowDown className="text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-400">Lowest Price</span>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">{comparison.lowestMarket.market}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{comparison.lowestMarket.district}, {comparison.lowestMarket.state}</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-2">
                {formatPrice(comparison.lowestMarket.avgPrice)}/quintal
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white">All Markets</h4>
            {comparison.comparison?.map((market, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{market.market}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{market.district}, {market.state}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">{formatPrice(market.avgPrice)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatPrice(market.minPrice)} - {formatPrice(market.maxPrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Mandi Prices</h1>
            <p className="text-primary-100 text-sm">Live market prices from data.gov.in</p>
          </div>
          <button
            onClick={() => {
              loadPrices();
              loadTrending();
            }}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <HiRefresh className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search commodity (Rice, Wheat, Onion...)"
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </form>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="flex">
          {[
            { id: 'prices', label: 'Market Prices' },
            { id: 'trending', label: 'Trending' },
            { id: 'compare', label: 'Compare' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm"
          >
            <HiFilter />
            Filters
            <HiChevronDown className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {filters.state && (
            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm">
              {filters.state}
            </span>
          )}

          {(filters.state || filters.commodity || filters.market) && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Clear all
            </button>
          )}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 space-y-3 overflow-hidden"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                <select
                  value={filters.state}
                  onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All States</option>
                  {states.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Market</label>
                <input
                  type="text"
                  value={filters.market}
                  onChange={(e) => setFilters(prev => ({ ...prev, market: e.target.value }))}
                  placeholder="Enter market name"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'prices' && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
                    <div className="grid grid-cols-3 gap-2">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : prices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prices.map((item, index) => (
                  <PriceCard key={index} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <HiInformationCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No prices found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'trending' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <HiTrendingUp className="text-primary-600 dark:text-primary-400" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Trending Commodities</h2>
            </div>
            {trending.length > 0 ? (
              trending.map((item, index) => (
                <TrendingCard key={item.commodity} item={item} index={index} />
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No trending data available</p>
            )}
          </div>
        )}

        {activeTab === 'compare' && (
          selectedCommodity ? (
            <ComparisonView />
          ) : (
            <div className="text-center py-12">
              <HiInformationCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Select a commodity to compare prices</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Click "Compare Prices" on any price card
              </p>
            </div>
          )
        )}
      </div>

      {/* Source Attribution */}
      <div className="p-4 text-center">
        <a
          href="https://data.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
        >
          Data Source: Open Government Data Platform India
          <HiExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

export default MandiPrices;
