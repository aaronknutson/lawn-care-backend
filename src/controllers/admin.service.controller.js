const ServicePackage = require('../models/ServicePackage');
const Service = require('../models/Service');
const CrewMember = require('../models/CrewMember');

// ============= SERVICE PACKAGES =============

/**
 * Get all service packages (admin view with inactive)
 * @route GET /api/admin/services/packages
 * @access Private (admin only)
 */
const getAllServicePackages = async (req, res) => {
  try {
    const packages = await ServicePackage.findAll({
      order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']],
    });

    res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    console.error('Error fetching service packages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service packages',
      error: error.message,
    });
  }
};

/**
 * Create new service package
 * @route POST /api/admin/services/packages
 * @access Private (admin only)
 */
const createServicePackage = async (req, res) => {
  try {
    const { name, description, basePrice, features, pricingTiers, isActive, sortOrder } = req.body;

    const servicePackage = await ServicePackage.create({
      name,
      description,
      basePrice,
      features: features || [],
      pricingTiers: pricingTiers || {},
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0,
    });

    res.status(201).json({
      success: true,
      message: 'Service package created successfully',
      data: servicePackage,
    });
  } catch (error) {
    console.error('Error creating service package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service package',
      error: error.message,
    });
  }
};

/**
 * Update service package
 * @route PUT /api/admin/services/packages/:id
 * @access Private (admin only)
 */
const updateServicePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, basePrice, features, pricingTiers, isActive, sortOrder } = req.body;

    const servicePackage = await ServicePackage.findByPk(id);

    if (!servicePackage) {
      return res.status(404).json({
        success: false,
        message: 'Service package not found',
      });
    }

    // Update fields
    if (name !== undefined) servicePackage.name = name;
    if (description !== undefined) servicePackage.description = description;
    if (basePrice !== undefined) servicePackage.basePrice = basePrice;
    if (features !== undefined) servicePackage.features = features;
    if (pricingTiers !== undefined) servicePackage.pricingTiers = pricingTiers;
    if (isActive !== undefined) servicePackage.isActive = isActive;
    if (sortOrder !== undefined) servicePackage.sortOrder = sortOrder;

    await servicePackage.save();

    res.json({
      success: true,
      message: 'Service package updated successfully',
      data: servicePackage,
    });
  } catch (error) {
    console.error('Error updating service package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service package',
      error: error.message,
    });
  }
};

/**
 * Delete service package
 * @route DELETE /api/admin/services/packages/:id
 * @access Private (admin only)
 */
const deleteServicePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const servicePackage = await ServicePackage.findByPk(id);

    if (!servicePackage) {
      return res.status(404).json({
        success: false,
        message: 'Service package not found',
      });
    }

    await servicePackage.destroy();

    res.json({
      success: true,
      message: 'Service package deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting service package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service package',
      error: error.message,
    });
  }
};

// ============= ADD-ON SERVICES =============

/**
 * Get all add-on services (admin view with inactive)
 * @route GET /api/admin/services/add-ons
 * @access Private (admin only)
 */
const getAllAddOnServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']],
    });

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Error fetching add-on services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch add-on services',
      error: error.message,
    });
  }
};

/**
 * Create new add-on service
 * @route POST /api/admin/services/add-ons
 * @access Private (admin only)
 */
const createAddOnService = async (req, res) => {
  try {
    const { name, description, price, category, isActive, icon, sortOrder } = req.body;

    const service = await Service.create({
      name,
      description,
      price,
      category: category || 'addon',
      isActive: isActive !== undefined ? isActive : true,
      icon,
      sortOrder: sortOrder || 0,
    });

    res.status(201).json({
      success: true,
      message: 'Add-on service created successfully',
      data: service,
    });
  } catch (error) {
    console.error('Error creating add-on service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create add-on service',
      error: error.message,
    });
  }
};

/**
 * Update add-on service
 * @route PUT /api/admin/services/add-ons/:id
 * @access Private (admin only)
 */
const updateAddOnService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, isActive, icon, sortOrder } = req.body;

    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Add-on service not found',
      });
    }

    // Update fields
    if (name !== undefined) service.name = name;
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = price;
    if (category !== undefined) service.category = category;
    if (isActive !== undefined) service.isActive = isActive;
    if (icon !== undefined) service.icon = icon;
    if (sortOrder !== undefined) service.sortOrder = sortOrder;

    await service.save();

    res.json({
      success: true,
      message: 'Add-on service updated successfully',
      data: service,
    });
  } catch (error) {
    console.error('Error updating add-on service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update add-on service',
      error: error.message,
    });
  }
};

/**
 * Delete add-on service
 * @route DELETE /api/admin/services/add-ons/:id
 * @access Private (admin only)
 */
const deleteAddOnService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Add-on service not found',
      });
    }

    await service.destroy();

    res.json({
      success: true,
      message: 'Add-on service deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting add-on service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete add-on service',
      error: error.message,
    });
  }
};

// ============= CREW MEMBERS =============

/**
 * Get all crew members
 * @route GET /api/admin/crew
 * @access Private (admin only)
 */
const getAllCrewMembers = async (req, res) => {
  try {
    const crewMembers = await CrewMember.findAll({
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: crewMembers,
    });
  } catch (error) {
    console.error('Error fetching crew members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch crew members',
      error: error.message,
    });
  }
};

/**
 * Create new crew member
 * @route POST /api/admin/crew
 * @access Private (admin only)
 */
const createCrewMember = async (req, res) => {
  try {
    const { firstName, lastName, phone, email, role, isActive, hireDate, photoUrl } = req.body;

    const crewMember = await CrewMember.create({
      firstName,
      lastName,
      phone,
      email,
      role: role || 'technician',
      isActive: isActive !== undefined ? isActive : true,
      hireDate,
      photoUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Crew member created successfully',
      data: crewMember,
    });
  } catch (error) {
    console.error('Error creating crew member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create crew member',
      error: error.message,
    });
  }
};

/**
 * Update crew member
 * @route PUT /api/admin/crew/:id
 * @access Private (admin only)
 */
const updateCrewMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, email, role, isActive, hireDate, photoUrl } = req.body;

    const crewMember = await CrewMember.findByPk(id);

    if (!crewMember) {
      return res.status(404).json({
        success: false,
        message: 'Crew member not found',
      });
    }

    // Update fields
    if (firstName !== undefined) crewMember.firstName = firstName;
    if (lastName !== undefined) crewMember.lastName = lastName;
    if (phone !== undefined) crewMember.phone = phone;
    if (email !== undefined) crewMember.email = email;
    if (role !== undefined) crewMember.role = role;
    if (isActive !== undefined) crewMember.isActive = isActive;
    if (hireDate !== undefined) crewMember.hireDate = hireDate;
    if (photoUrl !== undefined) crewMember.photoUrl = photoUrl;

    await crewMember.save();

    res.json({
      success: true,
      message: 'Crew member updated successfully',
      data: crewMember,
    });
  } catch (error) {
    console.error('Error updating crew member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update crew member',
      error: error.message,
    });
  }
};

/**
 * Delete crew member
 * @route DELETE /api/admin/crew/:id
 * @access Private (admin only)
 */
const deleteCrewMember = async (req, res) => {
  try {
    const { id } = req.params;

    const crewMember = await CrewMember.findByPk(id);

    if (!crewMember) {
      return res.status(404).json({
        success: false,
        message: 'Crew member not found',
      });
    }

    await crewMember.destroy();

    res.json({
      success: true,
      message: 'Crew member deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting crew member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete crew member',
      error: error.message,
    });
  }
};

module.exports = {
  // Service Packages
  getAllServicePackages,
  createServicePackage,
  updateServicePackage,
  deleteServicePackage,
  // Add-on Services
  getAllAddOnServices,
  createAddOnService,
  updateAddOnService,
  deleteAddOnService,
  // Crew Members
  getAllCrewMembers,
  createCrewMember,
  updateCrewMember,
  deleteCrewMember,
};
