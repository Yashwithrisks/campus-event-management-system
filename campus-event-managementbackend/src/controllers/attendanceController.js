const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const asyncHandler = require('../utils/asyncHandler');
const { parseQrPayload } = require('../services/qrService');
const { createNotification } = require('../services/notificationService');
const { logActivity } = require('../services/activityLogService');
const { REGISTRATION_STATUS, ROLES, NOTIFICATION_TYPES, EVENT_STATUS } = require('../config/constants');

const scanAttendance = asyncHandler(async (req, res) => {
  const { qrText, registrationId, eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ success: false, message: 'eventId is required.' });
  }

  const event = await Event.findById(eventId);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

  if (![EVENT_STATUS.APPROVED, EVENT_STATUS.ONGOING].includes(event.status)) {
    return res.status(400).json({ success: false, message: 'Attendance can only be marked for approved or ongoing events.' });
  }
  if (new Date(event.date) > new Date()) {
    return res.status(400).json({ success: false, message: 'Attendance cannot be marked before the event starts.' });
  }

  const isOwner = String(event.organizer) === String(req.user.id);
  if (!isOwner && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ success: false, message: 'Not allowed to scan attendance for this event.' });
  }

  let registration = null;

  if (qrText) {
    const parsed = parseQrPayload(qrText);
    if (!parsed) {
      return res.status(400).json({ success: false, message: 'Invalid QR code.' });
    }
    if (String(parsed.eventId) !== String(eventId)) {
      return res.status(400).json({ success: false, message: 'This QR code belongs to a different event.' });
    }
    registration = await Registration.findOne({ qrToken: parsed.qrToken, event: eventId });
  } else if (registrationId) {
    registration = await Registration.findOne({ registrationId: registrationId.trim().toUpperCase(), event: eventId });
  } else {
    return res.status(400).json({ success: false, message: 'Provide qrText or registrationId.' });
  }

  if (!registration) {
    return res.status(404).json({ success: false, message: 'No matching registration found for this event.' });
  }
  if (registration.status !== REGISTRATION_STATUS.REGISTERED) {
    return res.status(400).json({ success: false, message: `Registration is not active (status: ${registration.status}).` });
  }

  const alreadyMarked = await Attendance.findOne({ event: eventId, student: registration.student });
  if (alreadyMarked) {
    return res.status(409).json({ success: false, message: 'Attendance already marked for this student.' });
  }

  const attendance = await Attendance.create({
    event: eventId,
    student: registration.student,
    registration: registration._id,
    markedBy: req.user.id,
  });

  registration.status = REGISTRATION_STATUS.ATTENDED;
  await registration.save();

  const studentDoc = await require('../models/User').findById(registration.student);

  await createNotification({
    userId: registration.student,
    title: 'Attendance marked',
    message: `Your attendance for "${event.title}" has been marked.`,
    type: NOTIFICATION_TYPES.ATTENDANCE_MARKED,
    relatedEvent: event._id,
  });

  await logActivity({ userId: req.user.id, action: 'Attendance marked', details: `${studentDoc?.name} @ ${event.title}`, ip: req.ip });

  res.status(201).json({
    success: true,
    attendance: {
      studentName: studentDoc?.name,
      studentId: studentDoc?.studentId,
      eventName: event.title,
      registrationId: registration.registrationId,
      status: attendance.status,
      attendanceTime: attendance.markedAt,
    },
  });
});

const getEventAttendance = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

  const isOwner = String(event.organizer) === String(req.user.id);
  if (!isOwner && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ success: false, message: 'Not allowed.' });
  }

  const attendance = await Attendance.find({ event: event._id })
    .populate('student', 'name email studentId department')
    .populate('registration', 'registrationId')
    .sort({ markedAt: -1 });

  res.json({ success: true, count: attendance.length, attendance });
});

const getMyAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.find({ student: req.user.id })
    .populate('event', 'title date venue category')
    .sort({ markedAt: -1 });
  res.json({ success: true, count: attendance.length, attendance });
});

module.exports = { scanAttendance, getEventAttendance, getMyAttendance };