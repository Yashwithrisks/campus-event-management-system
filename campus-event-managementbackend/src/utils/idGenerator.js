const crypto = require('crypto');

function pad(num, size) {
  return String(num).padStart(size, '0');
}

async function generateRegistrationId(RegistrationModel) {
  const year = new Date().getFullYear();
  const count = await RegistrationModel.countDocuments();
  return `REG-${year}-${pad(count + 1 + Math.floor(Math.random() * 5), 6)}-${crypto.randomBytes(2).toString('hex')}`.toUpperCase();
}

async function generateCertificateId(CertificateModel) {
  const year = new Date().getFullYear();
  const count = await CertificateModel.countDocuments();
  return `CERT-${year}-${pad(count + 1 + Math.floor(Math.random() * 5), 6)}-${crypto.randomBytes(2).toString('hex')}`.toUpperCase();
}

function generateSecureQrToken() {
  return crypto.randomBytes(24).toString('hex');
}

module.exports = { generateRegistrationId, generateCertificateId, generateSecureQrToken };