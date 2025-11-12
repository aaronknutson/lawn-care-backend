const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServicePackage = sequelize.define('ServicePackage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  features: {
    type: DataTypes.JSONB, // Array of feature strings
    allowNull: false,
    defaultValue: [],
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Pricing modifiers based on lot size
  pricingTiers: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      // Example: { "small": 1.0, "medium": 1.2, "large": 1.5, "xlarge": 2.0 }
      // Multipliers for different lot sizes
    },
  },
}, {
  tableName: 'service_packages',
  timestamps: true,
  underscored: true,
});

module.exports = ServicePackage;
