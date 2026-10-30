const Notification = require('../models/Notification');

async function createNotification({ userId, title, message, type, relatedEvent = null }) {
  return Notification.create({ user: userId, title, message, type, relatedEvent });
}

async function createManyNotifications(userIds, { title, message, type, relatedEvent = null }) {
  const docs = userIds.map((userId) => ({ user: userId, title, message, type, relatedEvent }));
  if (docs.length === 0) return [];
  return Notification.insertMany(docs);
}

module.exports = { createNotification, createManyNotifications };