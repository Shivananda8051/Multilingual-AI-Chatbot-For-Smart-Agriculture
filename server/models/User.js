const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true
  },
  firebaseUid: {
    type: String,
    sparse: true,
    index: true
  },
  fcmToken: {
    type: String
  },
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  location: {
    city: String,
    state: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    pincode: String
  },
  farmDetails: {
    farmSize: String,
    farmType: String, // organic, conventional, mixed
    mainCrops: [String]
  },
  cropsGrown: [{
    type: String
  }],
  preferredLanguage: {
    type: String,
    enum: ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'bn', 'mr'],
    default: 'en'
  },
  role: {
    type: String,
    enum: ['farmer', 'admin'],
    default: 'farmer'
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  otp: {
    code: String,
    expiresAt: Date
  },
  notificationSettings: {
    push: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
    weather: { type: Boolean, default: true },
    community: { type: Boolean, default: true }
  },
  isCommunityMember: {
    type: Boolean,
    default: false
  },
  communityJoinedAt: {
    type: Date
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate JWT token
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Generate OTP
UserSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  };
  return otp;
};

// Verify OTP
UserSchema.methods.verifyOTP = function(inputOTP) {
  if (!this.otp || !this.otp.code) return false;
  if (new Date() > this.otp.expiresAt) return false;
  return this.otp.code === inputOTP;
};

// Update last active
UserSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

module.exports = mongoose.model('User', UserSchema);
