require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');
const { EVENT_STATUS, REGISTRATION_STATUS, ATTENDANCE_STATUS, ROLES } = require('../config/constants');
const { generateRegistrationId, generateCertificateId, generateSecureQrToken } = require('./idGenerator');
const { generateQrDataUrl } = require('../services/qrService');
const { generateCertificatePdf } = require('../services/certificateService');

const STUDENTS = [
  { email: 'jadhavswayam23@gmail.com', attendance: ATTENDANCE_STATUS.PRESENT, cultureRegistration: REGISTRATION_STATUS.CANCELLED },
  { email: 'yashbaviskar@gmail.com', attendance: ATTENDANCE_STATUS.PRESENT, cultureRegistration: REGISTRATION_STATUS.REGISTERED },
  { email: 'chirahbhoir@gmail.com', attendance: ATTENDANCE_STATUS.ABSENT, cultureRegistration: REGISTRATION_STATUS.CANCELLED },
  { email: 'vedashri@gmail.com', attendance: ATTENDANCE_STATUS.PRESENT, cultureRegistration: REGISTRATION_STATUS.REGISTERED },
];

const EVENT_TITLES = {
  completed: 'Cloud Architecture & AI Seminar',
  innovation: 'Campus Innovation Showcase',
  workshop: 'AI and Robotics Open Workshop',
  culture: 'Inter-College Cultural Fiesta 2026',
};

function daysBefore(date, days) {
  return new Date(new Date(date).getTime() - days * 24 * 60 * 60 * 1000);
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(12, 0, 0, 0);
  return date;
}

async function ensureRegistration(event, student, status, registeredAt, studentIndex, cancelledAt) {
  const existing = await Registration.findOne({ event: event._id, student: student._id });
  if (existing) return existing;

  const qrToken = generateSecureQrToken();
  const registrationId = await generateRegistrationId(Registration);
  const qrCode = await generateQrDataUrl({ qrToken, eventId: event._id });

  return Registration.create({
    event: event._id,
    student: student._id,
    registrationId,
    qrCode,
    qrToken,
    participant: {
      name: student.name,
      grNo: student.studentId || `CEMS-GR-2026-${String(studentIndex + 1).padStart(3, '0')}`,
      rollNo: String(studentIndex + 1).padStart(3, '0'),
      department: student.department,
      email: student.email,
      mobile: `900000${String(studentIndex + 1).padStart(4, '0')}`,
    },
    status,
    registeredAt,
    cancelledAt,
  });
}

async function ensureAttendance(event, student, registration, status, markedBy) {
  const existing = await Attendance.findOne({ event: event._id, student: student._id });
  if (existing) {
    if (String(existing.registration) !== String(registration._id)) {
      throw new Error(`Attendance for ${student.email} is linked to a different registration.`);
    }
    return existing;
  }

  return Attendance.create({
    event: event._id,
    student: student._id,
    registration: registration._id,
    status,
    markedAt: new Date(new Date(event.date).getTime() + 8 * 60 * 60 * 1000),
    markedBy,
  });
}

async function ensureCertificate(event, student) {
  const existing = await Certificate.findOne({ event: event._id, student: student._id });
  if (existing) return existing;

  const certificateId = await generateCertificateId(Certificate);
  const certificateUrl = await generateCertificatePdf({
    certificateId,
    studentName: student.name,
    eventName: event.title,
    organizerName: event.organizer.name,
    department: event.department,
    eventDate: new Date(event.date).toDateString(),
  });

  return Certificate.create({
    certificateId,
    event: event._id,
    student: student._id,
    certificateUrl,
  });
}

async function seedStudentDashboardData() {
  await connectDB();

  try {
    const studentUsers = await Promise.all(
      STUDENTS.map(({ email }) => User.findOne({ email, role: ROLES.STUDENT }))
    );
    if (studentUsers.some((student) => !student)) {
      throw new Error('One or more student accounts were not found. Create the four student accounts first.');
    }

    const events = {};
    for (const [key, title] of Object.entries(EVENT_TITLES)) {
      events[key] = await Event.findOne({ title }).populate('organizer', 'name department');
      if (!events[key]) throw new Error(`Required event not found: ${title}`);
    }

    if (events.completed.status !== EVENT_STATUS.COMPLETED || new Date(events.completed.date) >= new Date()) {
      throw new Error('The seminar must be a past event marked COMPLETED.');
    }
    for (const key of ['innovation', 'workshop', 'culture']) {
      if (
        ![EVENT_STATUS.APPROVED, EVENT_STATUS.ONGOING].includes(events[key].status) ||
        new Date(events[key].date) < new Date() ||
        new Date(events[key].registrationDeadline) < new Date()
      ) {
        throw new Error(`${events[key].title} must be upcoming, approved, and open for registration.`);
      }
    }

    const completedEvent = events.completed;
    for (let index = 0; index < STUDENTS.length; index += 1) {
      const fixture = STUDENTS[index];
      const student = studentUsers[index];
      const registrationStatus = fixture.attendance === ATTENDANCE_STATUS.PRESENT
        ? REGISTRATION_STATUS.ATTENDED
        : REGISTRATION_STATUS.ABSENT;
      const completedRegistration = await ensureRegistration(
        completedEvent,
        student,
        registrationStatus,
        daysBefore(completedEvent.date, 10),
        index
      );

      await ensureAttendance(
        completedEvent,
        student,
        completedRegistration,
        fixture.attendance,
        completedEvent.organizer._id
      );

      const upcomingEntries = [
        { event: events.innovation, status: REGISTRATION_STATUS.REGISTERED },
        { event: events.workshop, status: REGISTRATION_STATUS.REGISTERED },
        { event: events.culture, status: fixture.cultureRegistration },
      ];

      for (const { event, status } of upcomingEntries) {
        const registeredAt = daysAgo(7 + index);
        const cancelledAt = status === REGISTRATION_STATUS.CANCELLED ? daysAgo(2 + index) : undefined;
        await ensureRegistration(event, student, status, registeredAt, index, cancelledAt);
      }

      if (fixture.attendance === ATTENDANCE_STATUS.PRESENT) {
        await ensureCertificate(completedEvent, student);
      }

      console.log(`Populated dashboard data for ${student.email}`);
    }
  } finally {
    await mongoose.connection.close();
  }
}

seedStudentDashboardData().catch((error) => {
  console.error('Student dashboard data setup failed:', error.message);
  process.exitCode = 1;
});