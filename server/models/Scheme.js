const mongoose = require('mongoose');

const SchemeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  localNames: {
    hi: String,
    ta: String,
    te: String,
    bn: String,
    mr: String,
    gu: String,
    kn: String,
    pa: String
  },
  shortDescription: {
    type: String,
    required: true
  },
  fullDescription: String,
  category: {
    type: String,
    enum: ['subsidy', 'loan', 'insurance', 'training', 'equipment', 'infrastructure', 'marketing', 'other'],
    required: true
  },
  implementingAgency: {
    name: String,
    type: { type: String, enum: ['central', 'state', 'both'] },
    website: String,
    contactEmail: String,
    helplineNumber: String
  },
  eligibility: {
    states: [{
      type: String
    }],
    minFarmSize: {
      value: Number,
      unit: { type: String, default: 'acres' }
    },
    maxFarmSize: {
      value: Number,
      unit: { type: String, default: 'acres' }
    },
    farmTypes: [{
      type: String,
      enum: ['organic', 'conventional', 'mixed']
    }],
    eligibleCrops: [String],
    incomeLimit: {
      value: Number,
      currency: { type: String, default: 'INR' }
    },
    landOwnership: [{
      type: String,
      enum: ['owner', 'tenant', 'sharecropper']
    }],
    gender: {
      type: String,
      enum: ['all', 'male', 'female']
    },
    minAge: Number,
    maxAge: Number,
    additionalCriteria: [String]
  },
  benefits: {
    type: {
      type: String,
      enum: ['cash', 'subsidy_percentage', 'equipment', 'training', 'loan', 'insurance', 'mixed']
    },
    amount: Number,
    subsidyPercentage: Number,
    maxBenefit: Number,
    description: String,
    disbursementMode: {
      type: String,
      enum: ['direct_transfer', 'cheque', 'equipment', 'reimbursement']
    }
  },
  documents: [{
    name: { type: String, required: true },
    description: String,
    isMandatory: { type: Boolean, default: true },
    sampleUrl: String
  }],
  applicationProcess: {
    mode: {
      type: String,
      enum: ['online', 'offline', 'both']
    },
    onlinePortal: String,
    officeAddress: String,
    steps: [String]
  },
  timeline: {
    applicationStart: Date,
    applicationEnd: Date,
    processingDays: Number,
    isYearRound: { type: Boolean, default: false }
  },
  tags: [String],
  faqs: [{
    question: String,
    answer: String
  }],
  relatedSchemes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scheme'
  }],
  statistics: {
    totalBeneficiaries: { type: Number, default: 0 },
    totalAmountDisbursed: { type: Number, default: 0 },
    applicationsThisYear: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['active', 'upcoming', 'closed', 'suspended'],
    default: 'active'
  },
  featured: { type: Boolean, default: false },
  priority: { type: Number, default: 0 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

SchemeSchema.index({ name: 'text', shortDescription: 'text', tags: 'text' });
SchemeSchema.index({ category: 1, status: 1 });
SchemeSchema.index({ 'eligibility.states': 1 });
SchemeSchema.index({ featured: 1, priority: -1 });

module.exports = mongoose.model('Scheme', SchemeSchema);
