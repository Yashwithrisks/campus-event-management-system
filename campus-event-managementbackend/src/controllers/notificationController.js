const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100);
  const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });
  res.json({ success: true, count: notifications.length, unreadCount, notifications });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOne({ _id: req.params.id, user: req.user.id });
  if (!notif) return res.status(404).json({ success: false, message: 'Notification not found.' });
  notif.isRead = true;
  await notif.save();
  res.json({ success: true, notification: notif });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, isRead: false }, { $set: { isRead: true } });
  res.json({ success: true, message: 'All notifications marked as read.' });
});

module.exports = { getNotifications, markAsRead, markAllAsRead };