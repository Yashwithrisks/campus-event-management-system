
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const { ROLES } = require('../config/constants');

async function addStudents() {
  try {
    await connectDB();

    const password = 'Student@123';

    for (let i = 1; i <= 10; i++) {
      const email = `student${i}@campus.edu`;
      const studentId = `STU${String(i).padStart(3, '0')}`;

      // Do not overwrite existing accounts or student IDs.
      const existing = await User.findOne({
        $or: [{ email }, { studentId }],
      });

      if (existing) {
        console.log(`⏭️ Already exists, skipping: ${email}`);
        continue;
      }

      await User.create({
        name: `Student ${i}`,
        email,
        password,
        role: ROLES.STUDENT,
        studentId,
        department: 'Information Technology',
        isActive: true,
      });

      console.log(`✅ Created: ${email}`);
    }

    console.log('\nStudent account setup completed!');
    console.log('Password for newly created accounts: Student@123');
  } catch (error) {
    console.error('❌ Error creating students:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

addStudents();
