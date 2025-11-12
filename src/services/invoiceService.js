const PDFDocument = require('pdfkit');
const { format } = require('date-fns');

/**
 * Generate invoice PDF for a payment
 * @param {Object} payment - Payment object with relations
 * @param {Object} appointment - Appointment object with relations
 * @param {Object} user - User object
 * @param {Object} property - Property object
 * @returns {PDFDocument} PDF document stream
 */
const generateInvoicePDF = (payment, appointment, user, property) => {
  // Create a new PDF document
  const doc = new PDFDocument({
    size: 'LETTER',
    margin: 50,
  });

  // Company header
  doc
    .fontSize(24)
    .fillColor('#22c55e')
    .text('GreenScape Lawn Care', { align: 'center' })
    .fontSize(10)
    .fillColor('#666')
    .text('Professional Lawn Care Services', { align: 'center' })
    .text('Contact: (555) 555-LAWN | info@greenscape.com', { align: 'center' })
    .moveDown(2);

  // Invoice title and number
  doc
    .fontSize(20)
    .fillColor('#000')
    .text('INVOICE', { align: 'left' })
    .fontSize(10)
    .text(`Invoice #: ${payment.invoiceNumber}`, { align: 'left' })
    .text(`Date: ${format(new Date(payment.paidAt || payment.createdAt), 'MMMM dd, yyyy')}`, {
      align: 'left',
    })
    .moveDown(2);

  // Bill to section
  doc
    .fontSize(12)
    .fillColor('#22c55e')
    .text('BILL TO:', { underline: true })
    .fontSize(10)
    .fillColor('#000')
    .text(`${user.firstName} ${user.lastName}`)
    .text(user.email);

  if (user.phone) {
    doc.text(user.phone);
  }

  doc.moveDown();

  // Service address
  if (property) {
    doc
      .fontSize(12)
      .fillColor('#22c55e')
      .text('SERVICE ADDRESS:', { underline: true })
      .fontSize(10)
      .fillColor('#000')
      .text(property.address)
      .text(`${property.city}, ${property.state} ${property.zipCode}`)
      .moveDown(2);
  }

  // Service details header
  const tableTop = doc.y;
  const col1X = 50;
  const col2X = 300;
  const col3X = 400;
  const col4X = 480;

  doc
    .fontSize(10)
    .fillColor('#fff')
    .rect(col1X, tableTop, 512, 20)
    .fill('#22c55e');

  doc
    .fillColor('#fff')
    .text('Description', col1X + 5, tableTop + 5)
    .text('Date', col2X, tableTop + 5)
    .text('Qty', col3X, tableTop + 5)
    .text('Amount', col4X, tableTop + 5);

  // Service details rows
  let currentY = tableTop + 25;

  doc.fillColor('#000');

  // Main service package
  if (appointment && appointment.servicePackage) {
    doc
      .text(appointment.servicePackage.name, col1X + 5, currentY)
      .text(format(new Date(appointment.scheduledDate), 'MM/dd/yyyy'), col2X, currentY)
      .text('1', col3X, currentY)
      .text(`$${parseFloat(appointment.servicePackage.basePrice).toFixed(2)}`, col4X, currentY);

    currentY += 20;
  }

  // Add-on services (if any)
  if (appointment && appointment.appointmentServices && appointment.appointmentServices.length > 0) {
    for (const addOn of appointment.appointmentServices) {
      if (addOn.service) {
        doc
          .text(`  + ${addOn.service.name}`, col1X + 5, currentY)
          .text('', col2X, currentY)
          .text('1', col3X, currentY)
          .text(`$${parseFloat(addOn.price).toFixed(2)}`, col4X, currentY);

        currentY += 20;
      }
    }
  }

  currentY += 10;

  // Total section
  doc
    .moveTo(col3X - 10, currentY)
    .lineTo(col4X + 80, currentY)
    .stroke();

  currentY += 10;

  doc
    .fontSize(12)
    .fillColor('#000')
    .text('TOTAL:', col3X, currentY, { bold: true })
    .text(`$${parseFloat(payment.amount).toFixed(2)}`, col4X, currentY, { bold: true });

  currentY += 40;

  // Payment information
  doc
    .fontSize(12)
    .fillColor('#22c55e')
    .text('PAYMENT INFORMATION:', 50, currentY, { underline: true })
    .fontSize(10)
    .fillColor('#000')
    .moveDown(0.5);

  currentY = doc.y;

  doc
    .text(`Payment Method: ${payment.cardBrand ? payment.cardBrand.toUpperCase() : 'Credit Card'}`, 50, currentY)
    .text(
      `Card: ${payment.last4 ? `**** **** **** ${payment.last4}` : 'Card on file'}`,
      50,
      currentY + 15
    )
    .text(`Status: ${payment.status.toUpperCase()}`, 50, currentY + 30)
    .text(
      `Payment Date: ${format(new Date(payment.paidAt || payment.createdAt), 'MMMM dd, yyyy')}`,
      50,
      currentY + 45
    );

  // Footer
  doc
    .moveDown(4)
    .fontSize(9)
    .fillColor('#666')
    .text('Thank you for your business!', { align: 'center' })
    .text('For questions about this invoice, please contact us at info@greenscape.com', {
      align: 'center',
    })
    .moveDown(0.5)
    .text('GreenScape Lawn Care - Making Your Lawn Beautiful', { align: 'center' });

  return doc;
};

module.exports = {
  generateInvoicePDF,
};
