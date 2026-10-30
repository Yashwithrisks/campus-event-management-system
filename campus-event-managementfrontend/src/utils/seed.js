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

function daysFromNow(n) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

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
    name: 'Dr. Anjali Mehra',
    email: 'admin@campus.edu',
    password: 'Admin@123',
    role: ROLES.ADMIN,
    department: 'Administration',
  });

  const organizer1 = await User.create({
    name: 'Prof. Rakesh Sharma',
    email: 'organizer@campus.edu',
    password: 'Organizer@123',
    role: ROLES.ORGANIZER,
    department: 'Computer Science',
  });

  const organizer2 = await User.create({
    name: 'Prof. Sneha Kulkarni',
    email: 'organizer2@campus.edu',
    password: 'Organizer@123',
    role: ROLES.ORGANIZER,
    department: 'Student Affairs',
  });

  const organizer3 = await User.create({
    name: 'Dr. Vivek Nair',
    email: 'organizer3@campus.edu',
    password: 'Organizer@123',
    role: ROLES.ORGANIZER,
    department: 'Electronics',
  });

  const studentData = [
    { name: 'Aditi Verma', email: 'student@campus.edu', studentId: 'CS2024001', department: 'Computer Science' },
    { name: 'Rohan Mehta', email: 'student2@campus.edu', studentId: 'EC2024002', department: 'Electronics' },
    { name: 'Priya Singh', email: 'priya.singh@campus.edu', studentId: 'CS2024003', department: 'Computer Science' },
    { name: 'Arjun Kapoor', email: 'arjun.kapoor@campus.edu', studentId: 'ME2024004', department: 'Mechanical' },
    { name: 'Sanya Malhotra', email: 'sanya.m@campus.edu', studentId: 'CS2024005', department: 'Computer Science' },
    { name: 'Karan Joshi', email: 'karan.joshi@campus.edu', studentId: 'EC2024006', department: 'Electronics' },
    { name: 'Neha Reddy', email: 'neha.reddy@campus.edu', studentId: 'CE2024007', department: 'Civil' },
    { name: 'Vikram Rao', email: 'vikram.rao@campus.edu', studentId: 'CS2024008', department: 'Computer Science' },
    { name: 'Isha Gupta', email: 'isha.gupta@campus.edu', studentId: 'ME2024009', department: 'Mechanical' },
    { name: 'Aryan Khanna', email: 'aryan.khanna@campus.edu', studentId: 'CS2024010', department: 'Computer Science' },
  ];

  const students = [];
  for (const s of studentData) {
    const u = await User.create({ ...s, password: 'Student@123', role: ROLES.STUDENT });
    students.push(u);
  }
  const [stu1, stu2, stu3, stu4, stu5, stu6, stu7, stu8, stu9, stu10] = students;

  console.log('🏷️  Creating categories...');
  await Category.insertMany(EVENT_CATEGORIES.map((name) => ({ name, description: `${name} events` })));

  console.log('📅 Creating events...');

  // ===== APPROVED / UPCOMING EVENTS =====
  const hackathon = await Event.create({
    title: 'AI & Machine Learning Hackathon 2026',
    description: 'A 24-hour hackathon focused on building AI-powered solutions for real-world problems. Open to all departments. Mentors from top tech companies will be present.',
    category: 'Hackathon',
    organizer: organizer1._id,
    department: 'Computer Science',
    venue: 'Main Auditorium',
    date: daysFromNow(14),
    startTime: '09:00',
    endTime: '18:00',
    registrationDeadline: daysFromNow(10),
    maxParticipants: 100,
    status: EVENT_STATUS.APPROVED,
    reviewedBy: admin._id,
    reviewedAt: new Date(),
  });

  const codingComp = await Event.create({
    title: 'National Level Coding Competition 2026',
    description: 'A competitive programming contest open to all branches. Participants solve algorithmic problems within a time limit. Top performers receive cash prizes and certificates.',
    category: 'Competition',
    organizer: organizer1._id,
    department: 'Computer Science',
    venue: 'Computer Lab 3',
    date: daysFromNow(9),
    startTime: '10:00',
    endTime: '13:00',
    registrationDeadline: daysFromNow(7),
    maxParticipants: 60,
    status: EVENT_STATUS.APPROVED,
    reviewedBy: admin._id,
    reviewedAt: new Date(),
  });

  const designWorkshop = await Event.create({
    title: 'UI/UX Design Masterclass',
    description: 'Hands-on workshop covering Figma, design systems, and user research methods. Industry designer will conduct live sessions.',
    category: 'Workshop',
    organizer: organizer3._id,
    department: 'Electronics',
    venue: 'Design Studio, Block B',
    date: daysFromNow(6),
    startTime: '11:00',
    endTime: '16:00',
    registrationDeadline: daysFromNow(4),
    maxParticipants: 40,
    status: EVENT_STATUS.APPROVED,
    reviewedBy: admin._id,
    reviewedAt: new Date(),
  });

  const sportsMeet = await Event.create({
    title: 'Inter-Department Sports Meet 2026',
    description: 'Annual sports meet featuring athletics, cricket, football, basketball, and badminton tournaments across all departments.',
    category: 'Sports',
    organizer: organizer2._id,
    department: 'Student Affairs',
    venue: 'University Sports Ground',
    date: daysFromNow(21),
    startTime: '08:00',
    endTime: '19:00',
    registrationDeadline: daysFromNow(16),
    maxParticipants: 300,
    status: EVENT_STATUS.APPROVED,
    reviewedBy: admin._id,
    reviewedAt: new Date(),
  });

  const placementDrive = await Event.create({
    title: 'Pre-Placement Talk: TechCorp Industries',
    description: 'Learn about career opportunities, roles, and the recruitment process at TechCorp Industries. Open to final year students of all branches.',
    category: 'Placement',
    organizer: organizer2._id,
    department: 'Training & Placement',
    venue: 'Seminar Hall 2',
    date: daysFromNow(11),
    startTime: '14:00',
    endTime: '16:00',
    registrationDeadline: daysFromNow(9),
    maxParticipants: 150,
    status: EVENT_STATUS.APPROVED,
    reviewedBy: admin._id,
    reviewedAt: new Date(),
  });

  // ===== PENDING APPROVAL EVENTS =====
  const culturalFest = await Event.create({
    title: 'Cultural Fest - Rhythm 2026',
    description: 'Annual cultural fest featuring music, dance, and drama competitions across all colleges. Celebrity performance on the final evening.',
    category: 'Cultural',
    organizer: organizer2._id,
    department: 'Student Affairs',
    venue: 'Open Air Theatre',
    date: daysFromNow(20),
    startTime: '10:00',
    endTime: '20:00',
    registrationDeadline: daysFromNow(15),
    maxParticipants: 200,
    status: EVENT_STATUS.PENDING_APPROVAL,
  });

  const roboticsSeminar = await Event.create({
    title: 'Robotics & Automation Seminar',
    description: 'A seminar exploring the latest trends in robotics, automation, and Industry 4.0, with guest lectures from research scholars.',
    category: 'Seminar',
    organizer: organizer3._id,
    department: 'Electronics',
    venue: 'Seminar Hall 1',
    date: daysFromNow(17),
    startTime: '10:00',
    endTime: '12:30',
    registrationDeadline: daysFromNow(14),
    maxParticipants: 80,
    status: EVENT_STATUS.PENDING_APPROVAL,
  });

  // ===== REJECTED EVENT =====
  const rejectedEvent = await Event.create({
    title: 'Open Mic Night',
    description: 'An informal open mic event for students to showcase singing, poetry, and stand-up comedy talent.',
    category: 'Club Activity',
    organizer: organizer2._id,
    department: 'Student Affairs',
    venue: 'Cafeteria Lawn',
    date: daysFromNow(5),
    startTime: '18:00',
    endTime: '21:00',
    registrationDeadline: daysFromNow(3),
    maxParticipants: 50,
    status: EVENT_STATUS.REJECTED,
    rejectionReason: 'Venue conflicts with another scheduled maintenance activity. Please propose an alternate venue and resubmit.',
    reviewedBy: admin._id,
    reviewedAt: daysFromNow(-1),
  });

  // ===== DRAFT EVENT =====
  await Event.create({
    title: 'Startup Pitch Day',
    description: 'Student entrepreneurs pitch their startup ideas to a panel of investors and alumni.',
    category: 'Competition',
    organizer: organizer1._id,
    department: 'Computer Science',
    venue: 'Innovation Lab',
    date: daysFromNow(30),
    startTime: '10:00',
    endTime: '17:00',
    registrationDeadline: daysFromNow(25),
    maxParticipants: 50,
    status: EVENT_STATUS.DRAFT,
  });

  // ===== COMPLETED EVENTS (with registrations, attendance, certificates) =====
  const webDevWorkshop = await Event.create({
    title: 'Web Development Workshop',
    description: 'Hands-on workshop covering React, Node.js and MongoDB for building full-stack applications.',
    category: 'Workshop',
    organizer: organizer1._id,
    department: 'Computer Science',
    venue: 'Lab 204',
    date: daysFromNow(-5),
    startTime: '14:00',
    endTime: '17:00',
    registrationDeadline: daysFromNow(-6),
    maxParticipants: 50,
    status: EVENT_STATUS.COMPLETED,
    reviewedBy: admin._id,
    reviewedAt: daysFromNow(-8),
  });

  const dataScienceBootcamp = await Event.create({
    title: 'Data Science Bootcamp',
    description: 'A 2-day intensive bootcamp covering Python, Pandas, and machine learning fundamentals for beginners.',
    category: 'Technical',
    organizer: organizer1._id,
    department: 'Computer Science',
    venue: 'Lab 301',
    date: daysFromNow(-12),
    startTime: '09:00',
    endTime: '17:00',
    registrationDeadline: daysFromNow(-14),
    maxParticipants: 45,
    status: EVENT_STATUS.COMPLETED,
    reviewedBy: admin._id,
    reviewedAt: daysFromNow(-16),
  });

  const awarenessDrive = await Event.create({
    title: 'Mental Health Awareness Drive',
    description: 'An awareness campaign with expert talks on mental wellbeing, stress management, and campus support resources.',
    category: 'Awareness',
    organizer: organizer2._id,
    department: 'Student Affairs',
    venue: 'Seminar Hall 2',
    date: daysFromNow(-3),
    startTime: '11:00',
    endTime: '13:00',
    registrationDeadline: daysFromNow(-4),
    maxParticipants: 100,
    status: EVENT_STATUS.COMPLETED,
    reviewedBy: admin._id,
    reviewedAt: daysFromNow(-6),
  });

  console.log('🎫 Creating registrations, attendance & certificates...');

  // Helper to register a student for an event
  async function registerStudent(event, student, status = REGISTRATION_STATUS.REGISTERED) {
    const qrToken = generateSecureQrToken();
    const registrationId = await generateRegistrationId(Registration);
    const qrCode = await generateQrDataUrl({ qrToken, eventId: event._id });
    return Registration.create({
      event: event._id,
      student: student._id,
      registrationId,
      qrCode,
      qrToken,
      status,
    });
  }

  // Helper to mark attendance + generate certificate for a completed event
  async function markAttendedWithCertificate(event, student, registration, organizer) {
    await Attendance.create({
      event: event._id,
      student: student._id,
      registration: registration._id,
      markedBy: organizer._id,
      markedAt: event.date,
    });
    registration.status = REGISTRATION_STATUS.ATTENDED;
    await registration.save();

    const certificateId = await generateCertificateId(Certificate);
    const certificateUrl = await generateCertificatePdf({
      certificateId,
      studentName: student.name,
      eventName: event.title,
      organizerName: organizer.name,
      department: event.department,
      eventDate: new Date(event.date).toDateString(),
    });
    await Certificate.create({ certificateId, event: event._id, student: student._id, certificateUrl });
  }

  // --- Upcoming events: lots of registrations (REGISTERED status) ---
  for (const stu of [stu1, stu3, stu5, stu8, stu10]) {
    await registerStudent(hackathon, stu);
  }
  for (const stu of [stu2, stu4, stu6]) {
    await registerStudent(codingComp, stu);
  }
  for (const stu of [stu1, stu7, stu9]) {
    await registerStudent(designWorkshop, stu);
  }
  for (const stu of [stu2, stu3, stu4, stu5, stu6, stu7]) {
    await registerStudent(sportsMeet, stu);
  }
  for (const stu of [stu5, stu8, stu9, stu10]) {
    await registerStudent(placementDrive, stu);
  }

  // --- Completed events: registered + attended + certificates ---
  // Web Dev Workshop
  const reg1 = await registerStudent(webDevWorkshop, stu1);
  await markAttendedWithCertificate(webDevWorkshop, stu1, reg1, organizer1);
  const reg2 = await registerStudent(webDevWorkshop, stu3);
  await markAttendedWithCertificate(webDevWorkshop, stu3, reg2, organizer1);
  const reg3 = await registerStudent(webDevWorkshop, stu5);
  await markAttendedWithCertificate(webDevWorkshop, stu5, reg3, organizer1);
  await registerStudent(webDevWorkshop, stu7, REGISTRATION_STATUS.ABSENT); // registered but didn't attend

  // Data Science Bootcamp
  const reg4 = await registerStudent(dataScienceBootcamp, stu1);
  await markAttendedWithCertificate(dataScienceBootcamp, stu1, reg4, organizer1);
  const reg5 = await registerStudent(dataScienceBootcamp, stu8);
  await markAttendedWithCertificate(dataScienceBootcamp, stu8, reg5, organizer1);
  const reg6 = await registerStudent(dataScienceBootcamp, stu10);
  await markAttendedWithCertificate(dataScienceBootcamp, stu10, reg6, organizer1);

  // Awareness Drive
  const reg7 = await registerStudent(awarenessDrive, stu2);
  await markAttendedWithCertificate(awarenessDrive, stu2, reg7, organizer2);
  const reg8 = await registerStudent(awarenessDrive, stu4);
  await markAttendedWithCertificate(awarenessDrive, stu4, reg8, organizer2);

  // Keep a known registration for QR Scanner demo (Rohan Mehta -> Hackathon, still REGISTERED)
  // Already registered above as part of hackathon loop (stu3=Priya not stu2) — add Rohan explicitly:
  const demoReg = await registerStudent(hackathon, stu2);

  console.log('\n✅ Seed complete!\n');
  console.log('===== DEMO LOGIN CREDENTIALS =====');
  console.log('ADMIN       → admin@campus.edu / Admin@123');
  console.log('ORGANIZER 1 → organizer@campus.edu / Organizer@123  (CS dept)');
  console.log('ORGANIZER 2 → organizer2@campus.edu / Organizer@123 (Student Affairs)');
  console.log('ORGANIZER 3 → organizer3@campus.edu / Organizer@123 (Electronics)');
  console.log('STUDENT     → student@campus.edu / Student@123      (Aditi Verma - has certificates)');
  console.log('STUDENT 2   → student2@campus.edu / Student@123     (Rohan Mehta)');
  console.log('(8 more demo students created with password Student@123)');
  console.log(`\nDemo Registration ID for QR Scanner test (Rohan Mehta @ Hackathon): ${demoReg.registrationId}`);
  console.log('===================================\n');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});