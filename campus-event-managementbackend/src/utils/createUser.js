require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const { ROLES } = require('../config/constants');

async function run() {
  const { USER_ROLE, USER_EMAIL, USER_PASSWORD, USER_NAME, USER_DEPARTMENT } = process.env;
  const role = (USER_ROLE || '').toUpperCase();

  if (![ROLES.STUDENT, ROLES.ORGANIZER].includes(role)) {
    console.log('Set USER_ROLE to STUDENT or ORGANIZER.');
    process.exit(1);
  }
  if (!USER_EMAIL || !USER_PASSWORD || USER_PASSWORD.length < 8) {
    console.log('Set USER_EMAIL and a USER_PASSWORD of at least 8 characters.');
    process.exit(1);
  }

  await connectDB();

  const email = USER_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`Account ${email} already exists (role: ${existing.role}). Nothing changed.`);
  } else {
    await User.create({
      name: USER_NAME || email.split('@')[0],
      email,
      password: USER_PASSWORD,
      role,
      department: USER_DEPARTMENT || 'General',
    });
    console.log(`${role} created: ${email}`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});