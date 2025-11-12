// Import all models
const User = require('./User');
const Property = require('./Property');
const ServicePackage = require('./ServicePackage');
const Service = require('./Service');
const CrewMember = require('./CrewMember');
const Appointment = require('./Appointment');
const AppointmentService = require('./AppointmentService');
const Payment = require('./Payment');
const Review = require('./Review');
const Referral = require('./Referral');
const PropertyPhoto = require('./PropertyPhoto');
const Notification = require('./Notification');
const Quote = require('./Quote');

// Define associations

// User associations
User.hasMany(Property, { foreignKey: 'userId', as: 'properties' });
User.hasMany(Appointment, { foreignKey: 'userId', as: 'appointments' });
User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
User.hasMany(Referral, { foreignKey: 'referrerId', as: 'referrals' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
User.hasMany(Quote, { foreignKey: 'userId', as: 'quotes' });

// Property associations
Property.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Property.hasMany(Appointment, { foreignKey: 'propertyId', as: 'appointments' });
Property.hasMany(PropertyPhoto, { foreignKey: 'propertyId', as: 'photos' });

// ServicePackage associations
ServicePackage.hasMany(Appointment, { foreignKey: 'servicePackageId', as: 'appointments' });

// Service associations
Service.belongsToMany(Appointment, {
  through: AppointmentService,
  foreignKey: 'serviceId',
  as: 'appointments'
});

// CrewMember associations
CrewMember.hasMany(Appointment, { foreignKey: 'crewMemberId', as: 'appointments' });

// Appointment associations
Appointment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Appointment.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
Appointment.belongsTo(ServicePackage, { foreignKey: 'servicePackageId', as: 'servicePackage' });
Appointment.belongsTo(CrewMember, { foreignKey: 'crewMemberId', as: 'crewMember' });
Appointment.belongsToMany(Service, {
  through: AppointmentService,
  foreignKey: 'appointmentId',
  as: 'addOnServices'
});
Appointment.hasMany(AppointmentService, { foreignKey: 'appointmentId', as: 'appointmentServices' });
Appointment.hasOne(Payment, { foreignKey: 'appointmentId', as: 'payment' });
Appointment.hasOne(Review, { foreignKey: 'appointmentId', as: 'review' });
Appointment.hasMany(PropertyPhoto, { foreignKey: 'appointmentId', as: 'photos' });

// AppointmentService associations
AppointmentService.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
AppointmentService.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

// Payment associations
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Payment.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

// Review associations
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Review.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

// Referral associations
Referral.belongsTo(User, { foreignKey: 'referrerId', as: 'referrer' });
Referral.belongsTo(User, { foreignKey: 'referredUserId', as: 'referredUser' });

// PropertyPhoto associations
PropertyPhoto.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
PropertyPhoto.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Quote associations
Quote.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Quote.belongsTo(User, { foreignKey: 'respondedById', as: 'respondedBy' });

// Get sequelize instance
const sequelize = require('../config/database');

// Export all models and sequelize instance
module.exports = {
  sequelize,
  User,
  Property,
  ServicePackage,
  Service,
  CrewMember,
  Appointment,
  AppointmentService,
  Payment,
  Review,
  Referral,
  PropertyPhoto,
  Notification,
  Quote,
};
