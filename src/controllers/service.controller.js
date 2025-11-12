const ServicePackage = require('../models/ServicePackage');
const Service = require('../models/Service');

// @desc    Get all service packages
// @route   GET /api/services/packages
// @access  Public
const getServicePackages = async (req, res) => {
  try {
    const packages = await ServicePackage.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
    });

    res.status(200).json({
      success: true,
      count: packages.length,
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

// @desc    Get all add-on services
// @route   GET /api/services/add-ons
// @access  Public
const getAddOnServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      where: {
        isActive: true,
        category: ['addon', 'seasonal']
      },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });

    res.status(200).json({
      success: true,
      count: services.length,
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

// @desc    Calculate service price based on package, lot size, and add-ons
// @route   POST /api/services/calculate-price
// @access  Public
const calculatePrice = async (req, res) => {
  try {
    const { packageId, lotSize, addOnIds = [] } = req.body;

    // Validate required fields
    if (!packageId || !lotSize) {
      return res.status(400).json({
        success: false,
        message: 'Package ID and lot size are required',
      });
    }

    // Find the service package
    const servicePackage = await ServicePackage.findByPk(packageId);
    if (!servicePackage) {
      return res.status(404).json({
        success: false,
        message: 'Service package not found',
      });
    }

    // Calculate base price with lot size multiplier
    let multiplier = 1.0;
    if (lotSize < 5000) {
      multiplier = servicePackage.pricingTiers.small || 1.0;
    } else if (lotSize < 10000) {
      multiplier = servicePackage.pricingTiers.medium || 1.2;
    } else if (lotSize < 15000) {
      multiplier = servicePackage.pricingTiers.large || 1.5;
    } else {
      multiplier = servicePackage.pricingTiers.xlarge || 2.0;
    }

    const packagePrice = parseFloat(servicePackage.basePrice) * multiplier;

    // Calculate add-on prices
    let addOnsTotal = 0;
    const addOns = [];

    if (addOnIds.length > 0) {
      const services = await Service.findAll({
        where: {
          id: addOnIds,
          isActive: true,
        },
      });

      services.forEach(service => {
        const price = parseFloat(service.price);
        addOnsTotal += price;
        addOns.push({
          id: service.id,
          name: service.name,
          price: price,
        });
      });
    }

    // Calculate total
    const totalPrice = packagePrice + addOnsTotal;

    res.status(200).json({
      success: true,
      data: {
        package: {
          id: servicePackage.id,
          name: servicePackage.name,
          basePrice: parseFloat(servicePackage.basePrice),
          multiplier,
          calculatedPrice: packagePrice,
        },
        addOns,
        addOnsTotal,
        totalPrice,
        lotSize,
      },
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate price',
      error: error.message,
    });
  }
};

// @desc    Quick quote calculator for homepage (simplified public endpoint)
// @route   POST /api/services/quick-quote
// @access  Public
const quickQuote = async (req, res) => {
  try {
    const { lotSize, packageName } = req.body;

    // Validate lot size
    if (!lotSize || lotSize < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid lot size is required',
      });
    }

    // Find package by name, or use "Premium Care" as default, or the first active package
    let servicePackage;

    if (packageName) {
      servicePackage = await ServicePackage.findOne({
        where: {
          name: packageName,
          isActive: true,
        },
      });
    }

    // If no package found, try "Premium Care" as default
    if (!servicePackage) {
      servicePackage = await ServicePackage.findOne({
        where: {
          name: 'Premium Care',
          isActive: true,
        },
      });
    }

    // If still no package, get the first active package
    if (!servicePackage) {
      servicePackage = await ServicePackage.findOne({
        where: { isActive: true },
        order: [['sortOrder', 'ASC']],
      });
    }

    if (!servicePackage) {
      return res.status(404).json({
        success: false,
        message: 'No active service packages found',
      });
    }

    // Calculate multiplier based on lot size
    let multiplier = 1.0;
    let sizeCategory = 'small';

    if (lotSize < 5000) {
      multiplier = servicePackage.pricingTiers.small || 1.0;
      sizeCategory = 'small';
    } else if (lotSize < 10000) {
      multiplier = servicePackage.pricingTiers.medium || 1.2;
      sizeCategory = 'medium';
    } else if (lotSize < 15000) {
      multiplier = servicePackage.pricingTiers.large || 1.5;
      sizeCategory = 'large';
    } else {
      multiplier = servicePackage.pricingTiers.xlarge || 2.0;
      sizeCategory = 'xlarge';
    }

    const estimatedPrice = parseFloat(servicePackage.basePrice) * multiplier;

    // Get all packages for comparison
    const allPackages = await ServicePackage.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
    });

    const packageOptions = allPackages.map(pkg => {
      let pkgMultiplier = 1.0;
      if (lotSize < 5000) {
        pkgMultiplier = pkg.pricingTiers.small || 1.0;
      } else if (lotSize < 10000) {
        pkgMultiplier = pkg.pricingTiers.medium || 1.2;
      } else if (lotSize < 15000) {
        pkgMultiplier = pkg.pricingTiers.large || 1.5;
      } else {
        pkgMultiplier = pkg.pricingTiers.xlarge || 2.0;
      }

      return {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        basePrice: parseFloat(pkg.basePrice),
        estimatedPrice: parseFloat(pkg.basePrice) * pkgMultiplier,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        lotSize,
        sizeCategory,
        selectedPackage: {
          name: servicePackage.name,
          description: servicePackage.description,
          estimatedPrice,
        },
        allPackages: packageOptions,
        disclaimer: 'This is an estimate. Final price may vary based on property condition and selected add-ons.',
      },
    });
  } catch (error) {
    console.error('Error generating quick quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate quote',
      error: error.message,
    });
  }
};

module.exports = {
  getServicePackages,
  getAddOnServices,
  calculatePrice,
  quickQuote,
};
