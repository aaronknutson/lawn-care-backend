const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PropertyPhoto = sequelize.define('PropertyPhoto', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  propertyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'properties',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  appointmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'appointments',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  photoUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  photoType: {
    type: DataTypes.ENUM('before', 'after', 'general'),
    defaultValue: 'general',
    allowNull: false,
  },
  caption: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  takenAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'property_photos',
  timestamps: true,
  underscored: true,
});

module.exports = PropertyPhoto;
