require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const { EVENT_STATUS, REGISTRATION_STATUS, ROLES } = require('../config/constants');
const { generateRegistrationId, generateSecureQrToken } = require('./idGenerator');
const { generateQrDataUrl } = require('../services/qrService');

const ORGANIZER_EMAIL = 'organizer@campus.edu';
const STUDENT_EMAILS = Array.from({ length: 5 }, (_, index) =>
  `student.test${String(index + 1).padStart(2, '0')}@campus.edu`
);

function futureDate(days, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function ensureEvent(organizer, admin, eventData) {
  const existing = await Event.findOne({ organizer: organizer._id, title: eventData.title });
  if (existing) return existing;

  return Event.create({
    ...eventData,
    organizer: organizer._id,
    ...(eventData.status === EVENT_STATUS.APPROVED && admin
      ? { reviewedBy: admin._id, reviewedAt: new Date() }
      : {}),
  });
}

async function ensureRegistration(event, student, organizer, index, shouldAttend) {
  let registration = await Registration.findOne({ event: event._id, student: student._id });

  if (!registration) {
    const qrToken = generateSecureQrToken();
    const registrationId = await generateRegistrationId(Registration);
    const qrCode = await generateQrDataUrl({ qrToken, eventId: event._id });

    registration = await Registration.create({
      event: event._id,
      student: student._id,
      registrationId,
      qrCode,
      qrToken,
      participant: {
        name: student.name,
        grNo: `DEMO-GR-${String(index + 1).padStart(3, '0')}`,
        rollNo: String(index + 1),
        department: student.department,
        email: student.email,
        mobile: `000-000-${String(index + 1).padStart(4, '0')}`,
      },
      status: shouldAttend ? REGISTRATION_STATUS.ATTENDED : REGISTRATION_STATUS.REGISTERED,
    });
  }

  if (registration.status === REGISTRATION_STATUS.ATTENDED) {
    const attendance = await Attendance.findOne({ event: event._id, student: student._id });
    if (!attendance) {
      await Attendance.create({
        event: event._id,
        student: student._id,
        registration: registration._id,
        markedBy: organizer._id,
      });
    }
  }

  return registration;
}

async function seedOrganizerDemoData() {
  await connectDB();

  try {
    const organizer = await User.findOne({ email: ORGANIZER_EMAIL, role: ROLES.ORGANIZER });
    const students = await User.find({ email: { $in: STUDENT_EMAILS }, role: ROLES.STUDENT }).sort({ email: 1 });
    const admin = await User.findOne({ role: ROLES.ADMIN });

    if (!organizer || students.length !== STUDENT_EMAILS.length) {
      throw new Error('Run npm run seed:demo-users first so the demo organizer and five test students exist.');
    }

    const events = [
      {
        title: 'Campus Innovation Showcase',
        description: 'Student teams present practical campus technology projects and prototypes.',
        category: 'Hackathon',
        department: 'Computer Science',
        venue: 'Innovation Lab',
        date: futureDate(14, 10),
        startTime: '10:00',
        endTime: '16:00',
        registrationDeadline: futureDate(10, 23),
        maxParticipants: 60,
        status: EVENT_STATUS.APPROVED,
      },
      {
        title: 'AI and Robotics Open Workshop',
        description: 'A hands-on workshop exploring introductory AI tools and autonomous robotics.',
        category: 'Workshop',
        department: 'Electronics',
        venue: 'Engineering Block, Lab 2',
        date: futureDate(21, 11),
        startTime: '11:00',
        endTime: '15:00',
        registrationDeadline: futureDate(17, 23),
        maxParticipants: 40,
        status: EVENT_STATUS.APPROVED,
      },
      {
        title: 'Campus Culture Night',
        description: 'An evening of student performances, music, and cultural showcases.',
        category: 'Cultural',
        department: 'Student Affairs',
        venue: 'Open Air Theatre',
        date: futureDate(28, 17),
        startTime: '17:00',
        endTime: '20:00',
        registrationDeadline: futureDate(24, 23),
        maxParticipants: 120,
        status: EVENT_STATUS.PENDING_APPROVAL,
      },
    ];

    const createdEvents = [];
    for (const eventData of events) {
      const event = await ensureEvent(organizer, admin, eventData);
      createdEvents.push(event);
      console.log(`${event.status}: ${event.title}`);
    }

    for (let eventIndex = 0; eventIndex < 2; eventIndex += 1) {
      const event = createdEvents[eventIndex];
      const studentIndexes = eventIndex === 0 ? [0, 1, 2] : [2, 3, 4];

      for (let position = 0; position < studentIndexes.length; position += 1) {
        const studentIndex = studentIndexes[position];
        const registration = await ensureRegistration(
          event,
          students[studentIndex],
          organizer,
          studentIndex,
          position === 0
        );

        if (registration.status === REGISTRATION_STATUS.REGISTERED) {
          console.log(`Scanner registration for ${event.title}: ${registration.registrationId}`);
        }
      }
    }
  } finally {
    await mongoose.connection.close();
  }
}

seedOrganizerDemoData().catch((error) => {
  console.error('Organizer demo data setup failed:', error.message);
  process.exitCode = 1;
});