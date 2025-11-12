const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Property = sequelize.define('Property', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
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
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  lotSize: {
    type: DataTypes.INTEGER, // in square feet
    allowNull: false,
  },
  specialInstructions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  gateCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  hasBackyard: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  hasDogs: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isPrimary: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'properties',
  timestamps: true,
  underscored: true,
});

module.exports = Property;
