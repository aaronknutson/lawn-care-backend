const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CrewMember = sequelize.define('CrewMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'technician',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  hireDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  photoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'crew_members',
  timestamps: true,
  underscored: true,
});

module.exports = CrewMember;
