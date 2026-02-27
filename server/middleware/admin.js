// Admin authorization middleware
// This is already exported from auth.js, but kept for reference
const adminAuth = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
};

module.exports = adminAuth;
