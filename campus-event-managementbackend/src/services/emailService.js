const nodemailer = require('nodemailer');

let transporter = null;
let mockMode = true;

function initTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASSWORD) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
    mockMode = false;
    console.log('[email] SMTP configured. Live email sending enabled.');
  } else {
    mockMode = true;
    console.log('[email] SMTP credentials not set. Running in MOCK email mode (emails will be logged only).');
  }
}

async function sendEmail({ to, subject, html, text }) {
  if (mockMode || !transporter) {
    console.log('----- [MOCK EMAIL] -----');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text || html}`);
    console.log('-------------------------');
    return { mocked: true };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@campusevents.local',
      to,
      subject,
      html,
      text,
    });
    return { mocked: false, info };
  } catch (err) {
    console.error('[email] Failed to send email:', err.message);
    return { mocked: false, error: err.message };
  }
}

module.exports = { initTransporter, sendEmail };