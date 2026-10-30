const mongoose = require('mongoose');
const User = require('./src/models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/campus_event_management';

async function createStudent3() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');

    const existingUser = await User.findOne({
      email: 'student3@campus.edu'
    }).select('+password');

    if (existingUser) {
      console.log('Student 3 already exists');
      process.exit(0);
    }

    const student = await User.create({
      name: 'Student 3',
      email: 'student3@campus.edu',
      password: 'Student@123',
      role: 'STUDENT',
      studentId: 'STU003',
      department: 'Information Technology',
      phone: '9876543213',
      isActive: true
    });

    console.log('Student 3 created successfully!');
    console.log('Email:', student.email);
    console.log('Student ID:', student.studentId);
    console.log('Role:', student.role);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createStudent3();