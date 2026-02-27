const mongoose = require('mongoose');

const SchemeApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheme: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scheme',
    required: true
  },
  applicationNumber: {
    type: String,
    unique: true,
    sparse: true  // Allow multiple null values for drafts
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'documents_pending', 'approved', 'rejected', 'disbursed', 'cancelled'],
    default: 'draft'
  },
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    remarks: String
  }],
  applicantInfo: {
    name: String,
    phone: String,
    email: String,
    address: {
      village: String,
      district: String,
      state: String,
      pincode: String
    },
    aadhaarNumber: String,
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branchName: String
    }
  },
  farmDetails: {
    landArea: {
      value: Number,
      unit: String
    },
    landOwnership: String,
    cropTypes: [String],
    farmType: String,
    surveyNumber: String,
    khataNumber: String
  },
  documents: [{
    documentType: String,
    fileName: String,
    fileUrl: String,
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    remarks: String
  }],
  eligibilityCheck: {
    isEligible: Boolean,
    matchScore: Number,
    matchedCriteria: [String],
    unmatchedCriteria: [String],
    warnings: [String],
    checkedAt: Date
  },
  benefitDetails: {
    expectedAmount: Number,
    approvedAmount: Number,
    disbursedAmount: Number,
    disbursementDate: Date,
    transactionId: String
  },
  adminNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: { type: Date, default: Date.now }
  }],
  submittedAt: Date,
  reviewStartedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  priority: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Generate application number before saving
SchemeApplicationSchema.pre('save', async function(next) {
  if (!this.applicationNumber && this.status !== 'draft') {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.applicationNumber = `AGR${year}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

SchemeApplicationSchema.index({ user: 1, status: 1 });
SchemeApplicationSchema.index({ scheme: 1, status: 1 });
SchemeApplicationSchema.index({ 'applicantInfo.address.state': 1, status: 1 });
SchemeApplicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SchemeApplication', SchemeApplicationSchema);
