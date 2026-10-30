const Event = require('../models/Event');
const Registration = require('../models/Registration');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../services/activityLogService');
const { createNotification } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');
const User = require('../models/User');
const { EVENT_STATUS, ROLES, NOTIFICATION_TYPES, REGISTRATION_STATUS } = require('../config/constants');

const getEvents = asyncHandler(async (req, res) => {
  const { search, category, department, status, date, sort } = req.query;
  const filter = {};

  const isPrivileged = req.user && [ROLES.ADMIN, ROLES.ORGANIZER].includes(req.user.role);

  if (!isPrivileged) {
    filter.status = { $in: [EVENT_STATUS.APPROVED, EVENT_STATUS.ONGOING, EVENT_STATUS.COMPLETED] };
  } else if (status) {
    filter.status = status;
  }

  if (category) filter.category = category;
  if (department) filter.department = new RegExp(department, 'i');
  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    filter.date = { $gte: d, $lt: next };
  }
  if (search) {
    filter.$text = { $search: search };
  }

  let query = Event.find(filter).populate('organizer', 'name email department');
  query = sort === 'oldest'
    ? query.sort({ date: 1, startTime: 1 })
    : query.sort({ date: -1, startTime: -1 });

  const events = await query.exec();
  const myRegistrations = req.user?.role === ROLES.STUDENT
    ? await Registration.find({ student: req.user.id })
    : [];
  const registrationByEvent = new Map(myRegistrations.map((registration) => [String(registration.event), registration]));

  const eventsWithSeats = await Promise.all(
    events.map(async (ev) => {
      const registeredCount = await Registration.countDocuments({
        event: ev._id,
        status: { $ne: REGISTRATION_STATUS.CANCELLED },
      });
      const obj = ev.toObject();
      obj.registeredCount = registeredCount;
      obj.availableSeats = Math.max(ev.maxParticipants - registeredCount, 0);
      obj.myRegistration = registrationByEvent.get(String(ev._id)) || null;
      return obj;
    })
  );

  res.json({ success: true, count: eventsWithSeats.length, events: eventsWithSeats });
});

const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizer', 'name email department');
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

  const isPrivileged = req.user && [ROLES.ADMIN, ROLES.ORGANIZER].includes(req.user.role);
  const isOwner = req.user && String(event.organizer._id) === String(req.user.id);

  if (!isPrivileged && !isOwner && ![EVENT_STATUS.APPROVED, EVENT_STATUS.ONGOING, EVENT_STATUS.COMPLETED].includes(event.status)) {
    return res.status(404).json({ success: false, message: 'Event not found.' });
  }

  const registeredCount = await Registration.countDocuments({
    event: event._id,
    status: { $ne: REGISTRATION_STATUS.CANCELLED },
  });
  const obj = event.toObject();
  obj.registeredCount = registeredCount;
  obj.availableSeats = Math.max(event.maxParticipants - registeredCount, 0);

  let myRegistration = null;
  if (req.user && req.user.role === ROLES.STUDENT) {
    myRegistration = await Registration.findOne({ event: event._id, student: req.user.id });
  }

  res.json({ success: true, event: obj, myRegistration });
});

const getMyEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ organizer: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, count: events.length, events });
});

const createEvent = asyncHandler(async (req, res) => {
  const {
    title, description, category, department, venue, date,
    startTime, endTime, registrationDeadline, maxParticipants,
  } = req.body;

  if (!title || !description || !category || !department || !venue || !date || !startTime || !endTime || !registrationDeadline || !maxParticipants) {
    return res.status(400).json({ success: false, message: 'All event fields are required.' });
  }

  if (new Date(registrationDeadline) > new Date(date)) {
    return res.status(400).json({ success: false, message: 'Registration deadline must be on or before the event date.' });
  }

  const event = await Event.create({
    title, description, category, department, venue,
    date, startTime, endTime, registrationDeadline,
    maxParticipants: Number(maxParticipants),
    organizer: req.user.id,
    poster: req.file ? `/uploads/posters/${req.file.filename}` : '',
    status: EVENT_STATUS.DRAFT,
  });

  await logActivity({ userId: req.user.id, action: 'Event created', details: event.title, ip: req.ip });

  res.status(201).json({ success: true, event });
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

  const isOwner = String(event.organizer) === String(req.user.id);
  if (!isOwner && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ success: false, message: 'You are not allowed to edit this event.' });
  }
  if ([EVENT_STATUS.APPROVED, EVENT_STATUS.ONGOING, EVENT_STATUS.COMPLETED].includes(event.status) && req.user.role !== ROLES.ADMIN) {
    return res.status(400).json({ success: false, message: 'Cannot edit an event once approved. Contact admin.' });
  }

  const editableFields = ['title', 'description', 'category', 'department', 'venue', 'date', 'startTime', 'endTime', 'registrationDeadline', 'maxParticipants'];
  editableFields.forEach((f) => {
    if (req.body[f] !== undefined) event[f] = req.body[f];
  });
  if (req.file) event.poster = `/uploads/posters/${req.file.filename}`;

  if (event.status === EVENT_STATUS.REJECTED) {
    event.status = EVENT_STATUS.DRAFT;
    event.rejectionReason = '';
  }

  await event.save();
  await logActivity({ userId: req.user.id, action: 'Event updated', details: event.title, ip: req.ip });

  res.json({ success: true, event });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

  const isOwner = String(event.organizer) === String(req.user.id);
  if (!isOwner && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ success: false, message: 'You are not allowed to delete this event.' });
  }

  await event.deleteOne();
  await logActivity({ userId: req.user.id, action: 'Event deleted', details: event.title, ip: req.ip });

  res.json({ success: true, message: 'Event deleted.' });
});

const submitEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  if (String(event.organizer) !== String(req.user.id)) {
    return res.status(403).json({ success: false, message: 'You are not allowed to submit this event.' });
  }
  if (![EVENT_STATUS.DRAFT, EVENT_STATUS.REJECTED].includes(event.status)) {
    return res.status(400).json({ success: false, message: 'Only draft or rejected events can be submitted.' });
  }

  event.status = EVENT_STATUS.PENDING_APPROVAL;
  event.rejectionReason = '';
  await event.save();

  await logActivity({ userId: req.user.id, action: 'Event submitted for approval', details: event.title, ip: req.ip });

  const admins = await User.find({ role: ROLES.ADMIN, isActive: true });
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin._id,
        title: 'New event awaiting approval',
        message: `"${event.title}" by ${req.user.name} needs your review.`,
        type: NOTIFICATION_TYPES.NEW_EVENT_PENDING,
        relatedEvent: event._id,
      })
    )
  );
  await createNotification({
    userId: req.user.id,
    title: 'Event submitted',
    message: `Your event "${event.title}" was submitted for admin approval.`,
    type: NOTIFICATION_TYPES.EVENT_SUBMITTED,
    relatedEvent: event._id,
  });

  res.json({ success: true, event });
});

const approveEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizer');
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  if (event.status !== EVENT_STATUS.PENDING_APPROVAL) {
    return res.status(400).json({ success: false, message: 'Only pending events can be approved.' });
  }

  event.status = EVENT_STATUS.APPROVED;
  event.reviewedBy = req.user.id;
  event.reviewedAt = new Date();
  await event.save();

  await logActivity({ userId: req.user.id, action: 'Event approved', details: event.title, ip: req.ip });

  await createNotification({
    userId: event.organizer._id,
    title: 'Event approved',
    message: `Your event "${event.title}" has been approved and is now live.`,
    type: NOTIFICATION_TYPES.EVENT_APPROVED,
    relatedEvent: event._id,
  });
  await sendEmail({
    to: event.organizer.email,
    subject: 'Your event was approved',
    text: `Good news! Your event "${event.title}" has been approved and is now visible to students.`,
  });

  res.json({ success: true, event });
});

const rejectEvent = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
  }

  const event = await Event.findById(req.params.id).populate('organizer');
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  if (event.status !== EVENT_STATUS.PENDING_APPROVAL) {
    return res.status(400).json({ success: false, message: 'Only pending events can be rejected.' });
  }

  event.status = EVENT_STATUS.REJECTED;
  event.rejectionReason = reason;
  event.reviewedBy = req.user.id;
  event.reviewedAt = new Date();
  await event.save();

  await logActivity({ userId: req.user.id, action: 'Event rejected', details: `${event.title}: ${reason}`, ip: req.ip });

  await createNotification({
    userId: event.organizer._id,
    title: 'Event rejected',
    message: `Your event "${event.title}" was rejected. Reason: ${reason}`,
    type: NOTIFICATION_TYPES.EVENT_REJECTED,
    relatedEvent: event._id,
  });
  await sendEmail({
    to: event.organizer.email,
    subject: 'Your event was rejected',
    text: `Your event "${event.title}" was rejected. Reason: ${reason}. You may edit and resubmit it.`,
  });

  res.json({ success: true, event });
});

const cancelEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

  const isOwner = String(event.organizer) === String(req.user.id);
  if (!isOwner && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ success: false, message: 'Not allowed.' });
  }

  event.status = EVENT_STATUS.CANCELLED;
  await event.save();

  const regs = await Registration.find({ event: event._id, status: 'REGISTERED' }).populate('student');
  await Promise.all(
    regs.map((r) =>
      createNotification({
        userId: r.student._id,
        title: 'Event cancelled',
        message: `"${event.title}" has been cancelled.`,
        type: NOTIFICATION_TYPES.EVENT_CANCELLED,
        relatedEvent: event._id,
      })
    )
  );

  await logActivity({ userId: req.user.id, action: 'Event cancelled', details: event.title, ip: req.ip });

  res.json({ success: true, event });
});

const completeEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

  const isOwner = String(event.organizer) === String(req.user.id);
  if (!isOwner && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ success: false, message: 'Not allowed.' });
  }
  if (![EVENT_STATUS.APPROVED, EVENT_STATUS.ONGOING].includes(event.status)) {
    return res.status(400).json({ success: false, message: 'Only approved/ongoing events can be marked completed.' });
  }

  event.status = EVENT_STATUS.COMPLETED;
  await event.save();

  await logActivity({ userId: req.user.id, action: 'Event marked completed', details: event.title, ip: req.ip });

  res.json({ success: true, event });
});

module.exports = {
  getEvents, getEventById, getMyEvents, createEvent, updateEvent, deleteEvent,
  submitEvent, approveEvent, rejectEvent, cancelEvent, completeEvent,
};