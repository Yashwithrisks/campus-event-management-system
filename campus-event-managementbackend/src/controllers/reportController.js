const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES, REGISTRATION_STATUS } = require('../config/constants');

function toCsv(rows, headers) {
  const escape = (val) => {
    const s = val === undefined || val === null ? '' : String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  rows.forEach((row) => lines.push(headers.map((h) => escape(row[h])).join(',')));
  return lines.join('\n');
}

const eventReport = asyncHandler(async (req, res) => {
  const filter = req.user.role === ROLES.ORGANIZER ? { organizer: req.user.id } : {};
  const events = await Event.find(filter).populate('organizer', 'name');

  const rows = await Promise.all(
    events.map(async (e) => {
      const registrations = await Registration.countDocuments({ event: e._id, status: { $ne: REGISTRATION_STATUS.CANCELLED } });
      const attendance = await Attendance.countDocuments({ event: e._id });
      return {
        Event: e.title,
        Organizer: e.organizer?.name || '',
        Date: new Date(e.date).toDateString(),
        Venue: e.venue,
        Registrations: registrations,
        Attendance: attendance,
        'Attendance %': registrations > 0 ? Math.round((attendance / registrations) * 100) : 0,
      };
    })
  );

  if (req.query.format === 'csv') {
    const csv = toCsv(rows, ['Event', 'Organizer', 'Date', 'Venue', 'Registrations', 'Attendance', 'Attendance %']);
    res.header('Content-Type', 'text/csv');
    res.attachment('event-report.csv');
    return res.send(csv);
  }
  res.json({ success: true, count: rows.length, rows });
});

const studentParticipationReport = asyncHandler(async (req, res) => {
  const students = await User.find({ role: ROLES.STUDENT });

  const rows = await Promise.all(
    students.map(async (s) => {
      const registered = await Registration.countDocuments({ student: s._id, status: { $ne: REGISTRATION_STATUS.CANCELLED } });
      const attended = await Attendance.countDocuments({ student: s._id });
      const certificates = await Certificate.countDocuments({ student: s._id });
      return {
        Student: s.name,
        Department: s.department,
        'Events Registered': registered,
        'Events Attended': attended,
        Certificates: certificates,
      };
    })
  );

  if (req.query.format === 'csv') {
    const csv = toCsv(rows, ['Student', 'Department', 'Events Registered', 'Events Attended', 'Certificates']);
    res.header('Content-Type', 'text/csv');
    res.attachment('student-participation-report.csv');
    return res.send(csv);
  }
  res.json({ success: true, count: rows.length, rows });
});

const attendanceReport = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.eventId) filter.event = req.query.eventId;
  else if (req.user.role === ROLES.ORGANIZER) {
    const myEvents = await Event.find({ organizer: req.user.id }).select('_id');
    filter.event = { $in: myEvents.map((e) => e._id) };
  }

  const attendance = await Attendance.find(filter)
    .populate('student', 'name')
    .populate('event', 'title')
    .populate('registration', 'registrationId');

  const rows = attendance.map((a) => ({
    Student: a.student?.name || '',
    Event: a.event?.title || '',
    'Registration ID': a.registration?.registrationId || '',
    Status: a.status,
    Timestamp: new Date(a.markedAt).toLocaleString(),
  }));

  if (req.query.format === 'csv') {
    const csv = toCsv(rows, ['Student', 'Event', 'Registration ID', 'Status', 'Timestamp']);
    res.header('Content-Type', 'text/csv');
    res.attachment('attendance-report.csv');
    return res.send(csv);
  }
  res.json({ success: true, count: rows.length, rows });
});

module.exports = { eventReport, studentParticipationReport, attendanceReport };