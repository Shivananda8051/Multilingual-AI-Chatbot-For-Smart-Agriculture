const SchemeApplication = require('../models/SchemeApplication');
const Scheme = require('../models/Scheme');
const notificationService = require('../services/notificationService');

// @desc    Get user's applications
// @route   GET /api/scheme-applications/my
// @access  Private
exports.getMyApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: req.user._id };

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [applications, total] = await Promise.all([
      SchemeApplication.find(query)
        .populate('scheme', 'name category shortDescription benefits applicationProcess')
        .select('applicationNumber status submittedAt benefitDetails createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SchemeApplication.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: applications.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: applications
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};

// @desc    Get single application
// @route   GET /api/scheme-applications/:id
// @access  Private
exports.getApplication = async (req, res) => {
  try {
    const application = await SchemeApplication.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('scheme');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message
    });
  }
};

// @desc    Start new application
// @route   POST /api/scheme-applications
// @access  Private
exports.createApplication = async (req, res) => {
  try {
    const { schemeId, applicantInfo, farmDetails } = req.body;

    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found'
      });
    }

    if (scheme.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This scheme is not accepting applications'
      });
    }

    const existingApplication = await SchemeApplication.findOne({
      user: req.user._id,
      scheme: schemeId,
      status: { $nin: ['rejected', 'cancelled'] }
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active application for this scheme',
        existingApplicationId: existingApplication._id
      });
    }

    const application = await SchemeApplication.create({
      user: req.user._id,
      scheme: schemeId,
      applicantInfo: applicantInfo || {
        name: req.user.name,
        phone: req.user.phone,
        address: {
          village: req.user.location?.village,
          district: req.user.location?.district,
          state: req.user.location?.state,
          pincode: req.user.location?.pincode
        }
      },
      farmDetails: farmDetails || {
        landArea: {
          value: req.user.farmDetails?.farmSize,
          unit: 'acres'
        },
        farmType: req.user.farmDetails?.farmType,
        cropTypes: req.user.farmDetails?.crops
      },
      statusHistory: [{
        status: 'draft',
        changedBy: req.user._id,
        remarks: 'Application created'
      }]
    });

    await application.populate('scheme', 'name category');

    res.status(201).json({
      success: true,
      message: 'Application draft created',
      data: application
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create application',
      error: error.message
    });
  }
};

// @desc    Update application draft
// @route   PUT /api/scheme-applications/:id
// @access  Private
exports.updateApplication = async (req, res) => {
  try {
    const application = await SchemeApplication.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'draft'
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or cannot be edited'
      });
    }

    const { applicantInfo, farmDetails, documents } = req.body;

    if (applicantInfo) application.applicantInfo = { ...application.applicantInfo, ...applicantInfo };
    if (farmDetails) application.farmDetails = { ...application.farmDetails, ...farmDetails };
    if (documents) application.documents = documents;

    await application.save();

    res.json({
      success: true,
      message: 'Application updated',
      data: application
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: error.message
    });
  }
};

// @desc    Submit application
// @route   POST /api/scheme-applications/:id/submit
// @access  Private
exports.submitApplication = async (req, res) => {
  try {
    const application = await SchemeApplication.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'draft'
    }).populate('scheme');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or already submitted'
      });
    }

    const mandatoryDocs = application.scheme.documents?.filter(d => d.isMandatory) || [];
    const uploadedDocTypes = application.documents.map(d => d.documentType);
    const missingDocs = mandatoryDocs.filter(d => !uploadedDocTypes.includes(d.name));

    if (missingDocs.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required documents',
        missingDocuments: missingDocs.map(d => d.name)
      });
    }

    application.status = 'submitted';
    application.submittedAt = new Date();
    application.statusHistory.push({
      status: 'submitted',
      changedBy: req.user._id,
      remarks: 'Application submitted for review'
    });

    await application.save();

    try {
      await notificationService.sendNotification(
        req.user._id,
        'scheme_application',
        'Application Submitted',
        `Your application for ${application.scheme.name} has been submitted. Application No: ${application.applicationNumber}`,
        { applicationId: application._id }
      );
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationNumber: application.applicationNumber,
        status: application.status
      }
    });
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
};

// @desc    Cancel application
// @route   POST /api/scheme-applications/:id/cancel
// @access  Private
exports.cancelApplication = async (req, res) => {
  try {
    const application = await SchemeApplication.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: { $in: ['draft', 'submitted', 'under_review', 'documents_pending'] }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or cannot be cancelled'
      });
    }

    application.status = 'cancelled';
    application.statusHistory.push({
      status: 'cancelled',
      changedBy: req.user._id,
      remarks: req.body.reason || 'Cancelled by applicant'
    });

    await application.save();

    res.json({
      success: true,
      message: 'Application cancelled',
      data: application
    });
  } catch (error) {
    console.error('Cancel application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel application',
      error: error.message
    });
  }
};

// @desc    Track application by number
// @route   GET /api/scheme-applications/track/:applicationNumber
// @access  Private
exports.trackApplication = async (req, res) => {
  try {
    const application = await SchemeApplication.findOne({
      applicationNumber: req.params.applicationNumber
    })
      .populate('scheme', 'name category')
      .select('applicationNumber status statusHistory submittedAt benefitDetails');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Track application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track application',
      error: error.message
    });
  }
};

// @desc    Update application status (Admin)
// @route   PUT /api/scheme-applications/:id/status
// @access  Admin
exports.updateStatus = async (req, res) => {
  try {
    const { status, remarks, benefitDetails } = req.body;

    const application = await SchemeApplication.findById(req.params.id)
      .populate('scheme', 'name');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = status;
    application.statusHistory.push({
      status,
      changedBy: req.user._id,
      remarks
    });

    if (status === 'approved') {
      application.approvedAt = new Date();
    } else if (status === 'rejected') {
      application.rejectedAt = new Date();
      application.rejectionReason = remarks;
    } else if (status === 'under_review' && !application.reviewStartedAt) {
      application.reviewStartedAt = new Date();
    }

    if (benefitDetails) {
      application.benefitDetails = { ...application.benefitDetails, ...benefitDetails };
    }

    await application.save();

    try {
      const statusMessages = {
        under_review: 'Your application is now under review',
        documents_pending: 'Additional documents are required',
        approved: 'Your application has been approved!',
        rejected: `Your application was not approved. Reason: ${remarks}`,
        disbursed: 'Benefits have been disbursed to your account'
      };

      if (statusMessages[status]) {
        await notificationService.sendNotification(
          application.user,
          'scheme_application',
          `Application ${status.replace('_', ' ').toUpperCase()}`,
          statusMessages[status],
          { applicationId: application._id }
        );
      }
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.json({
      success: true,
      message: 'Application status updated',
      data: application
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

// @desc    Get all applications (Admin)
// @route   GET /api/scheme-applications
// @access  Admin
exports.getAllApplications = async (req, res) => {
  try {
    const { status, schemeId, state, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status) query.status = status;
    if (schemeId) query.scheme = schemeId;
    if (state) query['applicantInfo.address.state'] = state;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [applications, total] = await Promise.all([
      SchemeApplication.find(query)
        .populate('user', 'name phone')
        .populate('scheme', 'name category')
        .select('applicationNumber status applicantInfo submittedAt createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SchemeApplication.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: applications.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: applications
    });
  } catch (error) {
    console.error('Get all applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};

// @desc    Get application stats (Admin)
// @route   GET /api/scheme-applications/stats
// @access  Admin
exports.getStats = async (req, res) => {
  try {
    const stats = await SchemeApplication.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalApplications = await SchemeApplication.countDocuments();
    const thisMonth = await SchemeApplication.countDocuments({
      createdAt: { $gte: new Date(new Date().setDate(1)) }
    });

    res.json({
      success: true,
      data: {
        statusBreakdown: stats,
        totalApplications,
        thisMonth
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
};
