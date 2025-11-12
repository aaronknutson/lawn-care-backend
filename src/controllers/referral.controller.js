const Referral = require('../models/Referral');
const User = require('../models/User');

/**
 * Get user's referral code
 * @route GET /api/referrals/code
 * @access Private
 */
const getReferralCode = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'email'],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate referral code based on user ID (simple version)
    // In production, use a proper unique code generator
    const referralCode = `GREEN${userId.slice(0, 8).toUpperCase()}`;

    res.json({
      success: true,
      data: {
        code: referralCode,
        shareUrl: `${process.env.FRONTEND_URL}/register?ref=${referralCode}`,
      },
    });
  } catch (error) {
    console.error('Error fetching referral code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referral code',
      error: error.message,
    });
  }
};

/**
 * Get referral statistics
 * @route GET /api/referrals/stats
 * @access Private
 */
const getReferralStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Count referrals made by this user
    const referrals = await Referral.findAll({
      where: { referrerId: userId },
      include: [
        {
          model: User,
          as: 'referred',
          attributes: ['firstName', 'lastName', 'createdAt'],
        },
      ],
    });

    // Calculate stats
    const totalReferrals = referrals.length;
    const totalEarned = referrals.reduce((sum, ref) => sum + parseFloat(ref.rewardAmount || 0), 0);
    const pendingRewards = referrals
      .filter(ref => ref.status === 'pending')
      .reduce((sum, ref) => sum + parseFloat(ref.rewardAmount || 0), 0);

    res.json({
      success: true,
      data: {
        totalReferrals,
        totalEarned,
        pendingRewards,
        referrals: referrals.map(ref => ({
          id: ref.id,
          name: `${ref.referred.firstName} ${ref.referred.lastName}`,
          date: ref.createdAt,
          status: ref.status,
          reward: parseFloat(ref.rewardAmount || 0),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referral statistics',
      error: error.message,
    });
  }
};

module.exports = {
  getReferralCode,
  getReferralStats,
};
