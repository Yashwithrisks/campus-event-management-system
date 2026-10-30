require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');
const Category = require('../models/Category');

const { ROLES, EVENT_STATUS, REGISTRATION_STATUS, EVENT_CATEGORIES } = require('../config/constants');
const { generateRegistrationId, generateCertificateId, generateSecureQrToken } = require('./idGenerator');
const { generateQrDataUrl } = require('../services/qrService');
const { generateCertificatePdf } = require('../services/certificateService');

async function seed() {
  await connectDB();

  console.log('🗑️  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Event.deleteMany({}),
    Registration.deleteMany({}),
    Attendance.deleteMany({}),
    Certificate.deleteMany({}),
    Category.deleteMany({}),
  ]);

  console.log('👤 Creating demo users...');

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@campus.edu',
    password: 'Admin@123',
    role: ROLES.ADMIN,
    department: 'Administration',
  });

  const organizer = await User.create({
    name: 'Prof. Rakesh Sharma',
    email: 'organizer@campus.edu',
    password: 'Organizer@123',
    role: ROLES.ORGANIZER,
    department: 'Computer Science',
  });

  const student = await User.create({
    name: 'Aditi Verma',
    email: 'student@campus.edu',
    password: 'Student@123',
    role: ROLES.STUDENT,
    studentId: 'CS2024001',
    department: 'Computer Science',
  });

  const student2 = await User.create({
    name: 'Rohan Mehta',
    email: 'student2@campus.edu',
    password: 'Student@123',
    role: ROLES.STUDENT,
    studentId: 'CS2024002',
    department: 'Electronics',
  });

  console.log('🏷️  Creating categories...');
  await Category.insertMany(EVENT_CATEGORIES.map((name) => ({ name, description: `${name} events` })));

  console.log('📅 Creating events...');

  const upcomingEvent = await Event.create({
    title: 'AI & Machine Learning Hackathon 2026',
    description: 'A 24-hour hackathon focused on building AI-powered solutions for real-world problems. Open to all departments.',
    category: 'Hackathon',
    organizer: organizer._id,
    department: 'Computer Science',
    venue: 'Main Auditorium',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    startTime: '09:00',
    endTime: '18:00',
    registrationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    maxParticipants: 100,
    status: EVENT_STATUS.APPROVED,
    reviewedBy: admin._id,
    reviewedAt: new Date(),
  });

  const pendingEvent = await Event.create({
    title: 'Cultural Fest - Rhythm 2026',
    description: 'Annual cultural fest featuring music, dance, and drama competitions across all colleges.',
    category: 'Cultural',
    organizer: organizer._id,
    department: 'Student Affairs',
    venue: 'Open Air Theatre',
    date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    startTime: '10:00',
    endTime: '20:00',
    registrationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    maxParticipants: 200,
    status: EVENT_STATUS.PENDING_APPROVAL,
  });

  const pastEvent = await Event.create({
    title: 'Web Development Workshop',
    description: 'Hands-on workshop covering React, Node.js and MongoDB for building full-stack applications.',
    category: 'Workshop',
    organizer: organizer._id,
    department: 'Computer Science',
    venue: 'Lab 204',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    startTime: '14:00',
    endTime: '17:00',
    registrationDeadline: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    maxParticipants: 50,
    status: EVENT_STATUS.COMPLETED,
    reviewedBy: admin._id,
    reviewedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  });

  console.log('🎫 Creating sample registration + attendance + certificate for past event...');

  const qrToken = generateSecureQrToken();
  const registrationId = await generateRegistrationId(Registration);
  const qrCode = await generateQrDataUrl({ qrToken, eventId: pastEvent._id });

  const registration = await Registration.create({
    event: pastEvent._id,
    student: student._id,
    registrationId,
    qrCode,
    qrToken,
    status: REGISTRATION_STATUS.ATTENDED,
  });

  await Attendance.create({
    event: pastEvent._id,
    student: student._id,
    registration: registration._id,
    markedBy: organizer._id,
  });

  const certificateId = await generateCertificateId(Certificate);
  const certificateUrl = await generateCertificatePdf({
    certificateId,
    studentName: student.name,
    eventName: pastEvent.title,
    organizerName: organizer.name,
    department: pastEvent.department,
    eventDate: new Date(pastEvent.date).toDateString(),
  });

  await Certificate.create({
    certificateId,
    event: pastEvent._id,
    student: student._id,
    certificateUrl,
  });

  // Second student registered for the upcoming event (not yet attended)
  const qrToken2 = generateSecureQrToken();
  const registrationId2 = await generateRegistrationId(Registration);
  const qrCode2 = await generateQrDataUrl({ qrToken: qrToken2, eventId: upcomingEvent._id });
  await Registration.create({
    event: upcomingEvent._id,
    student: student2._id,
    registrationId: registrationId2,
    qrCode: qrCode2,
    qrToken: qrToken2,
    status: REGISTRATION_STATUS.REGISTERED,
  });

  console.log('\n✅ Seed complete!\n');
  console.log('===== DEMO LOGIN CREDENTIALS =====');
  console.log('ADMIN     → admin@campus.edu / Admin@123');
  console.log('ORGANIZER → organizer@campus.edu / Organizer@123');
  console.log('STUDENT 1 → student@campus.edu / Student@123  (has a certificate)');
  console.log('STUDENT 2 → student2@campus.edu / Student@123 (registered for upcoming event)');
  console.log(`\nSample Certificate ID to test verification: ${certificateId}`);
  console.log('===================================\n');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});