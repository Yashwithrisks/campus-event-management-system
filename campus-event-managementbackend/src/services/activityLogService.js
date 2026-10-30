const ActivityLog = require('../models/ActivityLog');

async function logActivity({ userId, action, details = '', ip = '' }) {
  try {
    await ActivityLog.create({ user: userId, action, details, ip });
  } catch (err) {
    console.error('[activityLog] failed to record activity:', err.message);
  }
}

module.exports = { logActivity };