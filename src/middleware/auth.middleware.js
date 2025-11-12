const { verifyAccessToken } = require('../utils/jwt');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    // Add user info to request
    req.user = {
      id: decoded.userId,
      userId: decoded.userId, // Keep for backward compatibility
      role: decoded.role,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message,
    });
  }
};

// Export as both default and named export for compatibility
module.exports = authMiddleware;
module.exports.authenticate = authMiddleware;
