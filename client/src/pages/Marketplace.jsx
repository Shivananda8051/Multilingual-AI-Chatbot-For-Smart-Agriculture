import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiPlus, HiSearch, HiFilter, HiBookmark, HiShoppingCart,
  HiLocationMarker, HiCurrencyRupee, HiPhone, HiX, HiChevronDown,
  HiRefresh, HiTrendingUp, HiOutlineBookmark, HiPhotograph
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { marketplaceAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Marketplace = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  // State
  const [activeTab, setActiveTab] = useState('browse');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    state: '',
    minPrice: '',
    maxPrice: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [options, setOptions] = useState(null);
  const [trending, setTrending] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load options on mount
  useEffect(() => {
    loadOptions();
    loadTrending();
  }, []);

  // Load listings when tab or filters change
  useEffect(() => {
    setPage(1);
    setListings([]);
    loadListings(1);
  }, [activeTab, filters]);

  const loadOptions = async () => {
    try {
      const response = await marketplaceAPI.getOptions();
      setOptions(response.data);
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const loadTrending = async () => {
    try {
      const response = await marketplaceAPI.getTrendingCrops(user?.location?.state);
      setTrending(response.data.trending || []);
    } catch (error) {
      console.error('Failed to load trending:', error);
    }
  };

  const loadListings = async (pageNum = 1) => {
    setLoading(true);
    try {
      let response;
      const params = {
        page: pageNum,
        limit: 20,
        ...filters,
        cropName: searchQuery
      };

      if (activeTab === 'browse') {
        response = await marketplaceAPI.getListings(params);
      } else if (activeTab === 'my-listings') {
        response = await marketplaceAPI.getMyListings(params);
      } else if (activeTab === 'saved') {
        response = await marketplaceAPI.getSavedListings(params);
      }

      if (pageNum === 1) {
        setListings(response.data.listings);
      } else {
        setListings(prev => [...prev, ...response.data.listings]);
      }
      setHasMore(response.data.pagination.page < response.data.pagination.pages);
    } catch (error) {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveListing = async (listingId) => {
    try {
      const response = await marketplaceAPI.toggleSave(listingId);
      setListings(prev => prev.map(l =>
        l._id === listingId ? { ...l, isSaved: response.data.action === 'saved' } : l
      ));
      toast.success(response.data.action === 'saved' ? 'Listing saved!' : 'Removed from saved');
    } catch (error) {
      toast.error('Failed to save listing');
    }
  };

  const handleCreateListing = async (formData) => {
    try {
      await marketplaceAPI.createListing(formData);
      toast.success('Listing created successfully!');
      setShowCreateModal(false);
      loadListings(1);
    } catch (error) {
      toast.error('Failed to create listing');
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await marketplaceAPI.deleteListing(listingId);
      toast.success('Listing deleted');
      loadListings(1);
    } catch (error) {
      toast.error('Failed to delete listing');
    }
  };

  const categoryIcons = {
    crops: '🌾',
    seeds: '🌱',
    fertilizers: '🧪',
    pesticides: '🧴',
    equipment: '🚜',
    other: '📦'
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HiShoppingCart className="w-7 h-7 text-orange-500" />
            Marketplace
          </h1>
          <p className="text-gray-500 text-sm">Buy & sell agricultural products</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <HiPlus className="w-5 h-5" />
          Create Listing
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search crops, seeds, equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadListings(1)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl border ${showFilters
            ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/20 dark:border-orange-800'
            : 'border-gray-200 dark:border-gray-700'
            }`}
        >
          <HiFilter className="w-5 h-5" />
        </button>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="card p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <select
                value={filters.category}
                onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
                className="input"
              >
                <option value="">All Categories</option>
                {options?.categories?.map(cat => (
                  <option key={cat} value={cat}>{categoryIcons[cat]} {cat}</option>
                ))}
              </select>
              <select
                value={filters.type}
                onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
                className="input"
              >
                <option value="">Buy & Sell</option>
                <option value="sell">Selling</option>
                <option value="buy">Buying</option>
              </select>
              <select
                value={filters.state}
                onChange={(e) => setFilters(f => ({ ...f, state: e.target.value }))}
                className="input"
              >
                <option value="">All States</option>
                {options?.states?.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <button
                onClick={() => setFilters({ category: '', type: '', state: '', minPrice: '', maxPrice: '' })}
                className="btn btn-secondary text-sm"
              >
                Clear Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trending Crops */}
      {trending.length > 0 && activeTab === 'browse' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <span className="flex items-center gap-1 text-sm text-gray-500 whitespace-nowrap">
            <HiTrendingUp className="w-4 h-4" /> Trending:
          </span>
          {trending.slice(0, 5).map(crop => (
            <button
              key={crop.name}
              onClick={() => setSearchQuery(crop.name)}
              className="px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-full text-sm whitespace-nowrap hover:bg-orange-100"
            >
              {crop.name} ₹{crop.avgPrice}/q
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        {[
          { id: 'browse', label: 'Browse', icon: HiSearch },
          { id: 'my-listings', label: 'My Listings', icon: HiShoppingCart },
          { id: 'saved', label: 'Saved', icon: HiBookmark }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
              ? 'bg-white dark:bg-gray-700 text-orange-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Listings Grid */}
      {loading && listings.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent" />
        </div>
      ) : listings.length === 0 ? (
        <div className="card p-12 text-center">
          <HiShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {activeTab === 'browse' ? 'No listings found' :
              activeTab === 'my-listings' ? 'You haven\'t created any listings yet' :
                'No saved listings'}
          </p>
          {activeTab !== 'browse' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary mt-4"
            >
              Create Your First Listing
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing, idx) => (
            <ListingCard
              key={listing._id}
              listing={listing}
              onSave={() => handleSaveListing(listing._id)}
              onView={() => setSelectedListing(listing)}
              onDelete={activeTab === 'my-listings' ? () => handleDeleteListing(listing._id) : null}
              index={idx}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && !loading && listings.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setPage(p => p + 1);
              loadListings(page + 1);
            }}
            className="btn btn-secondary"
          >
            <HiRefresh className="w-4 h-4" />
            Load More
          </button>
        </div>
      )}

      {/* Create Listing Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateListingModal
            options={options}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateListing}
          />
        )}
      </AnimatePresence>

      {/* Listing Detail Modal */}
      <AnimatePresence>
        {selectedListing && (
          <ListingDetailModal
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
            onSave={() => handleSaveListing(selectedListing._id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Listing Card Component
const ListingCard = ({ listing, onSave, onView, onDelete, index }) => {
  const categoryIcons = {
    crops: '🌾', seeds: '🌱', fertilizers: '🧪',
    pesticides: '🧴', equipment: '🚜', other: '📦'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onView}
    >
      {/* Image */}
      <div className="relative h-40 bg-gray-100 dark:bg-gray-700">
        {listing.images?.length > 0 ? (
          <img
            src={listing.images[0].url}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {categoryIcons[listing.category]}
          </div>
        )}
        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${listing.type === 'sell'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
          }`}>
          {listing.type === 'sell' ? 'Selling' : 'Buying'}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onSave(); }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80"
        >
          {listing.isSaved ? (
            <HiBookmark className="w-5 h-5 text-orange-500" />
          ) : (
            <HiOutlineBookmark className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-1">{listing.title}</h3>
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
          <HiLocationMarker className="w-3 h-3" />
          {listing.location?.city}, {listing.location?.state}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-orange-600 font-bold">
            <HiCurrencyRupee className="w-4 h-4" />
            {listing.price?.amount?.toLocaleString()}
            <span className="text-xs text-gray-500 font-normal">
              /{listing.price?.unit?.replace('per_', '')}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {listing.quantity?.value} {listing.quantity?.unit}
          </span>
        </div>
        {listing.price?.negotiable && (
          <span className="text-xs text-green-600">Negotiable</span>
        )}
      </div>

      {/* Delete button for my listings */}
      {onDelete && (
        <div className="px-3 pb-3">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-full py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            Delete Listing
          </button>
        </div>
      )}
    </motion.div>
  );
};

// Create Listing Modal
const CreateListingModal = ({ options, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: 'sell',
    category: 'crops',
    title: '',
    description: '',
    cropDetails: { cropName: '', variety: '', organicCertified: false },
    quantity: { value: '', unit: 'quintal' },
    price: { amount: '', unit: 'per_quintal', negotiable: true },
    contactPreferences: { showPhone: true, allowWhatsApp: true }
  });
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const isBuyRequest = formData.type === 'buy';

  const handleSubmit = async (e) => {
    e.preventDefault();
    // For buy requests, only title and quantity are required
    if (isBuyRequest) {
      if (!formData.title || !formData.quantity.value) {
        toast.error('Please fill in what you want to buy and quantity');
        return;
      }
    } else {
      if (!formData.title || !formData.quantity.value || !formData.price.amount) {
        toast.error('Please fill in all required fields');
        return;
      }
    }

    setSubmitting(true);
    const data = new FormData();
    data.append('type', formData.type);
    data.append('category', formData.category);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('cropDetails', JSON.stringify(formData.cropDetails));
    data.append('quantity', JSON.stringify(formData.quantity));
    // For buy requests, price is optional (budget)
    data.append('price', JSON.stringify(isBuyRequest ? { ...formData.price, negotiable: true } : formData.price));
    data.append('contactPreferences', JSON.stringify(formData.contactPreferences));
    images.forEach(img => data.append('images', img));

    try {
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create Listing</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Type */}
          <div className="grid grid-cols-2 gap-2">
            {['sell', 'buy'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData(f => ({ ...f, type }))}
                className={`py-2 rounded-lg font-medium transition-colors ${formData.type === type
                  ? type === 'sell' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
              >
                {type === 'sell' ? '🏷️ I want to Sell' : '🛒 I want to Buy'}
              </button>
            ))}
          </div>

          {isBuyRequest && (
            <p className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
              💡 Post what you're looking to buy. Sellers will contact you!
            </p>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
              className="input w-full"
            >
              {options?.categories?.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {isBuyRequest ? 'What do you want to buy? *' : 'Title *'}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
              placeholder={isBuyRequest
                ? "e.g., Looking for Organic Rice, Need 50 bags of Fertilizer"
                : "e.g., Fresh Basmati Rice - Premium Quality"}
              className="input w-full"
              maxLength={100}
            />
          </div>

          {/* Crop Details (if crops category) */}
          {formData.category === 'crops' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Crop Name</label>
                <input
                  type="text"
                  value={formData.cropDetails.cropName}
                  onChange={(e) => setFormData(f => ({
                    ...f,
                    cropDetails: { ...f.cropDetails, cropName: e.target.value }
                  }))}
                  placeholder="e.g., Rice, Wheat"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Variety</label>
                <input
                  type="text"
                  value={formData.cropDetails.variety}
                  onChange={(e) => setFormData(f => ({
                    ...f,
                    cropDetails: { ...f.cropDetails, variety: e.target.value }
                  }))}
                  placeholder="e.g., Basmati"
                  className="input w-full"
                />
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {isBuyRequest ? 'How much do you need? *' : 'Quantity *'}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={formData.quantity.value}
                onChange={(e) => setFormData(f => ({
                  ...f,
                  quantity: { ...f.quantity, value: e.target.value }
                }))}
                placeholder="100"
                className="input flex-1"
              />
              <select
                value={formData.quantity.unit}
                onChange={(e) => setFormData(f => ({
                  ...f,
                  quantity: { ...f.quantity, unit: e.target.value }
                }))}
                className="input w-28"
              >
                {options?.units?.quantity?.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price - Required for Sell, Optional for Buy */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {isBuyRequest ? 'Your Budget (₹) - Optional' : 'Price (₹) *'}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={formData.price.amount}
                onChange={(e) => setFormData(f => ({
                  ...f,
                  price: { ...f.price, amount: e.target.value }
                }))}
                placeholder={isBuyRequest ? "Max budget (optional)" : "2500"}
                className="input flex-1"
              />
              <select
                value={formData.price.unit}
                onChange={(e) => setFormData(f => ({
                  ...f,
                  price: { ...f.price, unit: e.target.value }
                }))}
                className="input w-28"
              >
                {options?.units?.price?.map(unit => (
                  <option key={unit} value={unit}>{unit.replace('per_', '/')}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Negotiable - Only for Sell */}
          {!isBuyRequest && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.price.negotiable}
                onChange={(e) => setFormData(f => ({
                  ...f,
                  price: { ...f.price, negotiable: e.target.checked }
                }))}
                className="w-4 h-4 text-orange-500 rounded"
              />
              <span className="text-sm">Price is negotiable</span>
            </label>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe your product, quality, delivery options..."
              rows={3}
              className="input w-full resize-none"
              maxLength={2000}
            />
          </div>

          {/* Images - Optional for buy requests */}
          {!isBuyRequest && (
            <div>
              <label className="block text-sm font-medium mb-1">Images (up to 5)</label>
              <div className="flex gap-2 flex-wrap">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16">
                    <img
                      src={URL.createObjectURL(img)}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setImages(imgs => imgs.filter((_, i) => i !== idx))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-500">
                    <HiPhotograph className="w-6 h-6 text-gray-400" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        setImages(imgs => [...imgs, ...files].slice(0, 5));
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full btn py-3 ${isBuyRequest ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'btn-primary'}`}
          >
            {submitting ? 'Posting...' : isBuyRequest ? '🛒 Post Buy Request' : '🏷️ Create Listing'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Listing Detail Modal
const ListingDetailModal = ({ listing, onClose, onSave }) => {
  const [contacting, setContacting] = useState(false);

  const handleContact = async (method) => {
    setContacting(true);
    try {
      const response = await marketplaceAPI.recordInquiry(listing._id, {
        message: 'Interested in your listing',
        contactMethod: method
      });

      const phone = response.data.sellerPhone || listing.seller?.phone;
      if (phone) {
        if (method === 'whatsapp') {
          window.open(`https://wa.me/91${phone.replace(/\D/g, '')}?text=Hi, I'm interested in your listing: ${listing.title}`, '_blank');
        } else {
          window.open(`tel:+91${phone.replace(/\D/g, '')}`, '_blank');
        }
      }
      toast.success('Seller notified of your interest!');
    } catch (error) {
      toast.error('Failed to contact seller');
    } finally {
      setContacting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Image */}
        <div className="relative h-56 bg-gray-100 dark:bg-gray-700">
          {listing.images?.length > 0 ? (
            <img
              src={listing.images[0].url}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {listing.category === 'crops' ? '🌾' : '📦'}
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Title & Price */}
          <div>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${listing.type === 'sell'
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
              }`}>
              {listing.type === 'sell' ? 'For Sale' : 'Looking to Buy'}
            </span>
            <h2 className="text-xl font-bold">{listing.title}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl font-bold text-orange-600">
                ₹{listing.price?.amount?.toLocaleString()}
              </span>
              <span className="text-gray-500">/{listing.price?.unit?.replace('per_', '')}</span>
              {listing.price?.negotiable && (
                <span className="text-sm text-green-600 bg-green-50 px-2 py-0.5 rounded">Negotiable</span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <span className="text-gray-500">Quantity</span>
              <p className="font-semibold">{listing.quantity?.value} {listing.quantity?.unit}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <span className="text-gray-500">Category</span>
              <p className="font-semibold capitalize">{listing.category}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg col-span-2">
              <span className="text-gray-500">Location</span>
              <p className="font-semibold flex items-center gap-1">
                <HiLocationMarker className="w-4 h-4" />
                {listing.location?.city}, {listing.location?.state}
              </p>
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div>
              <h3 className="font-semibold mb-1">Description</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{listing.description}</p>
            </div>
          )}

          {/* Mandi Price Reference */}
          {listing.mandiPriceRef && (
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
              <h3 className="font-semibold text-orange-700 dark:text-orange-400 mb-1">
                <HiTrendingUp className="inline w-4 h-4 mr-1" />
                Mandi Price Reference
              </h3>
              <p className="text-sm text-orange-600">
                Market: {listing.mandiPriceRef.market} |
                Modal: ₹{listing.mandiPriceRef.modalPrice}/quintal
              </p>
            </div>
          )}

          {/* Seller Info */}
          <div className="flex items-center gap-3 py-3 border-t dark:border-gray-700">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold">
              {listing.seller?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <p className="font-semibold">{listing.seller?.name || 'Seller'}</p>
              <p className="text-sm text-gray-500">
                {listing.seller?.location?.city}, {listing.seller?.location?.state}
              </p>
            </div>
          </div>

          {/* Contact Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleContact('phone')}
              disabled={contacting}
              className="btn bg-green-500 hover:bg-green-600 text-white py-3"
            >
              <HiPhone className="w-5 h-5" />
              Call Now
            </button>
            <button
              onClick={() => handleContact('whatsapp')}
              disabled={contacting}
              className="btn bg-[#25D366] hover:bg-[#20BD5A] text-white py-3"
            >
              WhatsApp
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={onSave}
            className="w-full btn btn-secondary py-3"
          >
            {listing.isSaved ? (
              <>
                <HiBookmark className="w-5 h-5 text-orange-500" />
                Saved
              </>
            ) : (
              <>
                <HiOutlineBookmark className="w-5 h-5" />
                Save Listing
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Marketplace;
