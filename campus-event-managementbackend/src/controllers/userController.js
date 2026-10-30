const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../services/activityLogService');

const getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    filter.$or = [
      { name: new RegExp(req.query.search, 'i') },
      { email: new RegExp(req.query.search, 'i') },
    ];
  }
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, users });
});

const toggleSuspendUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.role === 'ADMIN') {
    return res.status(400).json({ success: false, message: 'Cannot suspend an admin account.' });
  }

  user.isActive = !user.isActive;
  await user.save();

  await logActivity({
    userId: req.user.id,
    action: user.isActive ? 'User reactivated' : 'User suspended',
    details: user.email,
    ip: req.ip,
  });

  res.json({ success: true, user: user.toSafeObject() });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const editable = ['name', 'department', 'phone', 'studentId'];
  editable.forEach((f) => {
    if (req.body[f] !== undefined) req.user[f] = req.body[f];
  });
  await req.user.save();
  res.json({ success: true, user: req.user.toSafeObject() });
});

module.exports = { getUsers, toggleSuspendUser, updateMyProfile };