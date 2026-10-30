const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../utils/asyncHandler');

const getActivityLogs = asyncHandler(async (req, res) => {
  const logs = await ActivityLog.find()
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ success: true, count: logs.length, logs });
});

module.exports = { getActivityLogs };