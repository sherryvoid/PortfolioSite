const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port: parseInt(port) || 587,
    secure: parseInt(port) === 465,
    auth: { user, pass }
  });

  return transporter;
}

/**
 * Send a follow-up email for a job application
 * @param {Object} options - { to, subject, body, fromName }
 * @returns {Object} - { success, messageId, error }
 */
exports.sendFollowUpEmail = async ({ to, subject, body, fromName }) => {
  const transport = getTransporter();
  if (!transport) {
    return {
      success: false,
      error: 'Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env'
    };
  }

  const from = process.env.SMTP_FROM || `"${fromName || 'Job Applicant'}" <${process.env.SMTP_USER}>`;

  try {
    const info = await transport.sendMail({
      from,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, error: error.message };
  }
};
