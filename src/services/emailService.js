const nodemailer = require('nodemailer');

// Create transporter for development
const createTransporter = () => {
  // In development, use Ethereal for testing (fake SMTP)
  // In production, use real SMTP credentials
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: Log emails to console instead of sending
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass',
      },
      // For development, just log
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }
};

/**
 * Send booking confirmation email
 * @param {Object} booking - Booking details
 * @param {Object} user - User details
 * @param {Object} property - Property details
 * @param {Object} servicePackage - Service package details
 */
const sendBookingConfirmation = async (booking, user, property, servicePackage) => {
  try {
    const transporter = createTransporter();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: bold; color: #6b7280; }
          .detail-value { color: #111827; }
          .footer { background: #111827; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌿 Booking Confirmed!</h1>
            <p>Thank you for choosing GreenScape Lawn Care</p>
          </div>

          <div class="content">
            <p>Hi ${user.firstName},</p>
            <p>Your lawn care service has been successfully booked. We're excited to help you maintain a beautiful lawn!</p>

            <div class="booking-details">
              <h2 style="margin-top: 0; color: #10b981;">Booking Details</h2>

              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">${booking.id}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Service Package:</span>
                <span class="detail-value">${servicePackage.name}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Scheduled Date:</span>
                <span class="detail-value">${new Date(booking.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Scheduled Time:</span>
                <span class="detail-value">${booking.scheduledTime}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Frequency:</span>
                <span class="detail-value">${booking.frequency}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Property Address:</span>
                <span class="detail-value">${property.address}, ${property.city}, ${property.state} ${property.zipCode}</span>
              </div>

              <div class="detail-row" style="border-bottom: none; margin-top: 15px; padding-top: 15px; border-top: 2px solid #10b981;">
                <span class="detail-label" style="font-size: 18px;">Total Price:</span>
                <span class="detail-value" style="font-size: 24px; color: #10b981; font-weight: bold;">$${parseFloat(booking.totalPrice).toFixed(2)}</span>
              </div>
            </div>

            ${booking.specialInstructions ? `
              <div class="booking-details">
                <h3 style="margin-top: 0; color: #6b7280;">Special Instructions</h3>
                <p style="margin: 0;">${booking.specialInstructions}</p>
              </div>
            ` : ''}

            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Our team will arrive on the scheduled date and time</li>
              <li>You'll receive a reminder 24 hours before your appointment</li>
              <li>Payment will be processed after service completion</li>
              <li>You can view and manage your bookings in your customer portal</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">View My Bookings</a>
            </div>
          </div>

          <div class="footer">
            <p><strong>GreenScape Lawn Care</strong></p>
            <p>Phone: (512) 555-LAWN | Email: info@greenscapelawn.com</p>
            <p style="font-size: 12px; margin-top: 15px;">If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: '"GreenScape Lawn Care" <noreply@greenscapelawn.com>',
      to: user.email,
      subject: `Booking Confirmed - ${servicePackage.name} Service on ${new Date(booking.scheduledDate).toLocaleDateString()}`,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Booking confirmation email sent:', info.messageId);

    // In development, log the email preview URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Email would be sent to:', user.email);
      console.log('Subject:', mailOptions.subject);
    }

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Error sending booking confirmation email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  sendBookingConfirmation,
};
