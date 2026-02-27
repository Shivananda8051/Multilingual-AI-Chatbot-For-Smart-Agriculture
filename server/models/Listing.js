const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['sell', 'buy'],
    required: true,
    default: 'sell'
  },
  category: {
    type: String,
    enum: ['crops', 'seeds', 'fertilizers', 'pesticides', 'equipment', 'other'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  cropDetails: {
    cropName: String,
    variety: String,
    grade: String,
    harvestDate: Date,
    organicCertified: {
      type: Boolean,
      default: false
    }
  },
  quantity: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['kg', 'quintal', 'ton', 'pieces', 'bags', 'liters'],
      required: true
    }
  },
  price: {
    amount: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['per_kg', 'per_quintal', 'per_ton', 'per_piece', 'per_bag', 'per_liter', 'total'],
      required: true
    },
    negotiable: {
      type: Boolean,
      default: true
    }
  },
  images: [{
    url: String,
    thumbnail: String
  }],
  location: {
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    deliveryRadius: {
      type: Number,
      default: 50
    }
  },
  contactPreferences: {
    showPhone: {
      type: Boolean,
      default: true
    },
    allowWhatsApp: {
      type: Boolean,
      default: true
    },
    preferredTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'anytime'],
      default: 'anytime'
    }
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'expired', 'paused', 'deleted'],
    default: 'active'
  },
  views: {
    type: Number,
    default: 0
  },
  inquiries: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    contactMethod: {
      type: String,
      enum: ['phone', 'whatsapp']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  mandiPriceRef: {
    market: String,
    modalPrice: Number,
    minPrice: Number,
    maxPrice: Number,
    fetchedAt: Date
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  language: {
    type: String,
    default: 'en'
  }
}, {
  timestamps: true
});

// Indexes
ListingSchema.index({ status: 1, createdAt: -1 });
ListingSchema.index({ category: 1, status: 1 });
ListingSchema.index({ 'location.state': 1, 'location.city': 1 });
ListingSchema.index({ seller: 1, status: 1 });
ListingSchema.index({ 'cropDetails.cropName': 1 });
ListingSchema.index({ expiresAt: 1 });

// Virtuals
ListingSchema.virtual('inquiryCount').get(function() {
  return this.inquiries.length;
});

ListingSchema.virtual('savedCount').get(function() {
  return this.savedBy.length;
});

ListingSchema.set('toJSON', { virtuals: true });
ListingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Listing', ListingSchema);
