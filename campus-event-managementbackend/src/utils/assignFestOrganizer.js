require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Event = require('../models/Event');
const { ROLES } = require('../config/constants');

// Saare fest events (Day 1 se Day 4) is organizer ke My Events mein dikhenge
const TARGET_EMAIL = 'organizer@campus.edu';

async function run() {
  await connectDB();

  const organizer = await User.findOne({ email: TARGET_EMAIL, role: ROLES.ORGANIZER });
  if (!organizer) {
    console.log(`Organizer ${TARGET_EMAIL} nahi mila. Pehle npm run seed chalao.`);
    await mongoose.connection.close();
    process.exit(1);
  }

  // Fest events ka description "Day 1 – ...", "Day 2 – ..." se shuru hota hai
  const result = await Event.updateMany(
    { description: /^Day \d+ / },
    { $set: { organizer: organizer._id } }
  );

  console.log(`${result.modifiedCount} fest events ab ${organizer.name} ke naam par hain.`);

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
