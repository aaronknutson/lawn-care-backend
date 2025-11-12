const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quote = sequelize.define('Quote', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true, // Can be null for non-logged-in users
    references: {
      model: 'users',
      key: 'id',
    },
  },
  // Contact Information (for non-logged-in users)
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Property Information
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  zipCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lotSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // Service Details
  serviceType: {
    type: DataTypes.STRING,
    allowNull: false, // e.g., "lawn-mowing", "landscaping", "fertilization"
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  preferredDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  // Photos
  photos: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: true,
  },
  // Quote Status
  status: {
    type: DataTypes.ENUM('pending', 'reviewed', 'quoted', 'accepted', 'declined', 'expired'),
    defaultValue: 'pending',
    allowNull: false,
  },
  // Admin Response
  estimatedPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  quotedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  respondedById: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'quotes',
  timestamps: true,
  underscored: true,
});

module.exports = Quote;
