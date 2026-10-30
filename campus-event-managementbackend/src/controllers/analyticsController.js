const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');
const asyncHandler = require('../utils/asyncHandler');
const { EVENT_STATUS, ROLES, REGISTRATION_STATUS } = require('../config/constants');

const studentAnalytics = asyncHandler(async (req, res) => {
  const studentId = req.user.id;

  const registrations = await Registration.find({ student: studentId }).populate('event', 'title date status venue category');
  const eventsRegistered = registrations.filter((r) => r.status !== REGISTRATION_STATUS.CANCELLED).length;
  const attendanceRecords = await Attendance.find({ student: studentId }).populate('event', 'status');
  const attendanceByEvent = new Map(
    attendanceRecords.map((record) => [String(record.event?._id), record.status])
  );
  const completedRegistrations = registrations.filter(
    (registration) => registration.status !== REGISTRATION_STATUS.CANCELLED && registration.event?.status === EVENT_STATUS.COMPLETED
  );
  const eventsAttended = attendanceRecords.filter(
    (record) => record.status === 'PRESENT' && record.event?.status === EVENT_STATUS.COMPLETED
  ).length;
  const certificatesEarned = await Certificate.countDocuments({ student: studentId });
  const attendancePercentage = completedRegistrations.length > 0
    ? Math.round((eventsAttended / completedRegistrations.length) * 100)
    : 0;

  const upcomingEvents = registrations
    .filter((r) =>
      r.status === REGISTRATION_STATUS.REGISTERED &&
      r.event &&
      [EVENT_STATUS.APPROVED, EVENT_STATUS.ONGOING].includes(r.event.status) &&
      new Date(r.event.date) >= new Date()
    )
    .map((r) => r.event);

  const completedEvents = registrations
    .filter((r) => r.status !== REGISTRATION_STATUS.CANCELLED && r.event?.status === EVENT_STATUS.COMPLETED)
    .map((r) => ({
      ...r.event.toObject(),
      registrationStatus: r.status,
      attendanceStatus: attendanceByEvent.get(String(r.event._id)) || 'NOT_RECORDED',
    }));

  const pendingRegistrations = registrations.filter(
    (r) => r.status === REGISTRATION_STATUS.REGISTERED && r.event && r.event.status === EVENT_STATUS.APPROVED
  ).length;

  res.json({
    success: true,
    analytics: {
      eventsRegistered,
      eventsAttended,
      certificatesEarned,
      attendancePercentage,
      pendingRegistrations,
      upcomingEvents,
      completedEvents,
    },
  });
});

const organizerAnalytics = asyncHandler(async (req, res) => {
  const organizerId = req.user.id;
  const events = await Event.find({ organizer: organizerId });

  const totalEvents = events.length;
  const pendingApprovals = events.filter((e) => e.status === EVENT_STATUS.PENDING_APPROVAL).length;
  const approvedEvents = events.filter((e) =>
    [EVENT_STATUS.APPROVED, EVENT_STATUS.ONGOING, EVENT_STATUS.COMPLETED].includes(e.status)
  ).length;
  const completedEvents = events.filter((e) => e.status === EVENT_STATUS.COMPLETED).length;

  const eventIds = events.map((e) => e._id);
  const totalRegistrations = await Registration.countDocuments({ event: { $in: eventIds }, status: { $ne: REGISTRATION_STATUS.CANCELLED } });
  const totalAttendance = await Attendance.countDocuments({ event: { $in: eventIds } });
  const attendancePercentage = totalRegistrations > 0 ? Math.round((totalAttendance / totalRegistrations) * 100) : 0;

  const eventWise = await Promise.all(
    events.map(async (e) => {
      const regs = await Registration.countDocuments({ event: e._id, status: { $ne: REGISTRATION_STATUS.CANCELLED } });
      const att = await Attendance.countDocuments({ event: e._id });
      return { eventId: e._id, title: e.title, status: e.status, registrations: regs, attendance: att };
    })
  );

  res.json({
    success: true,
    analytics: {
      totalEvents,
      pendingApprovals,
      approvedEvents,
      completedEvents,
      totalRegistrations,
      attendancePercentage,
      eventWise,
    },
  });
});

const adminAnalytics = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalStudents = await User.countDocuments({ role: ROLES.STUDENT });
  const totalOrganizers = await User.countDocuments({ role: ROLES.ORGANIZER });
  const totalEvents = await Event.countDocuments();
  const pendingApprovals = await Event.countDocuments({ status: EVENT_STATUS.PENDING_APPROVAL });
  const upcomingEvents = await Event.countDocuments({ status: EVENT_STATUS.APPROVED, date: { $gte: new Date() } });
  const completedEvents = await Event.countDocuments({ status: EVENT_STATUS.COMPLETED });
  const totalRegistrations = await Registration.countDocuments({ status: { $ne: REGISTRATION_STATUS.CANCELLED } });
  const totalAttendance = await Attendance.countDocuments();
  const certificatesGenerated = await Certificate.countDocuments();

  const categoryBreakdown = await Event.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const eventsByStatus = await Event.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    analytics: {
      totalUsers,
      totalStudents,
      totalOrganizers,
      totalEvents,
      pendingApprovals,
      upcomingEvents,
      completedEvents,
      totalRegistrations,
      totalAttendance,
      certificatesGenerated,
      categoryBreakdown,
      eventsByStatus,
    },
  });
});

module.exports = { studentAnalytics, organizerAnalytics, adminAnalytics };