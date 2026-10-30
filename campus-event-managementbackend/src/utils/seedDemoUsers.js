require('dotenv').config();
const mongoose = require('mongoose');
const { randomInt } = require('node:crypto');
const connectDB = require('../config/db');
const User = require('../models/User');
const { ROLES } = require('../config/constants');

const TEST_PASSWORD = 'CampusTest@123';
const STUDENT_NAMES = ['Kavya Nair', 'Ishaan Rao', 'Meera Shah', 'Dev Patel', 'Anaya Das', 'Kabir Joshi', 'Tara Menon', 'Neil Kapoor'];
const ORGANIZER_NAMES = ['Dr. Neha Kulkarni', 'Prof. Arjun Sen', 'Dr. Farah Khan', 'Prof. Vikram Iyer', 'Dr. Sana Merchant', 'Prof. Ritu Bose'];
const DEPARTMENTS = ['Computer Science', 'Electronics', 'Information Technology', 'Mechanical Engineering', 'Student Affairs'];

const DEMO_USERS = [
  {
    name: 'Prof. Rakesh Sharma',
    email: 'organizer@campus.edu',
    password: 'Organizer@123',
    role: ROLES.ORGANIZER,
    department: 'Computer Science',
  },
  {
    name: 'Aditi Verma',
    email: 'student@campus.edu',
    password: 'Student@123',
    role: ROLES.STUDENT,
    studentId: 'CS2024001',
    department: 'Computer Science',
  },
];

for (let index = 1; index <= 5; index += 1) {
  const suffix = String(index).padStart(2, '0');
  DEMO_USERS.push({
    name: STUDENT_NAMES[randomInt(STUDENT_NAMES.length)],
    email: `student.test${suffix}@campus.edu`,
    password: TEST_PASSWORD,
    role: ROLES.STUDENT,
    studentId: `TEST-STU-2026-${suffix}`,
    department: DEPARTMENTS[randomInt(DEPARTMENTS.length)],
  });
  DEMO_USERS.push({
    name: ORGANIZER_NAMES[randomInt(ORGANIZER_NAMES.length)],
    email: `organizer.test${suffix}@campus.edu`,
    password: TEST_PASSWORD,
    role: ROLES.ORGANIZER,
    department: DEPARTMENTS[randomInt(DEPARTMENTS.length)],
  });
}

async function seedDemoUsers() {
  await connectDB();

  try {
    for (const userData of DEMO_USERS) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`Skipped existing account: ${userData.email}`);
        continue;
      }

      await User.create(userData);
      console.log(`Created ${userData.role}: ${userData.email}`);
    }
    console.log(`Additional test-account password: ${TEST_PASSWORD}`);
  } finally {
    await mongoose.connection.close();
  }
}

seedDemoUsers().catch((error) => {
  console.error('Demo account setup failed:', error.message);
  process.exitCode = 1;
});