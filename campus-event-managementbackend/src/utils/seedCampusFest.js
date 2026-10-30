require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Event = require('../models/Event');
const { EVENT_STATUS, ROLES } = require('../config/constants');

const FESTIVAL = 'Campus Fest 2026';
const DAY1_OFFSET = 7;

const SCHEDULE = [
  {
    day: 1,
    name: 'Sports Day',
    events: [
      { title: 'Badminton Championship', category: 'Sports', start: '09:00', startLabel: '09:00 AM', endLabel: '11:00 AM', venue: 'Indoor Sports Hall', capacity: 32, organizer: 'rahul@campus.edu', department: 'Physical Education' },
      { title: 'Kabaddi Championship', category: 'Sports', start: '11:30', startLabel: '11:30 AM', endLabel: '01:30 PM', venue: 'College Sports Ground', capacity: 48, organizer: 'rahul@campus.edu', department: 'Physical Education' },
      { title: 'Football Championship', category: 'Sports', start: '14:00', startLabel: '02:00 PM', endLabel: '04:00 PM', venue: 'Main Football Ground', capacity: 80, organizer: 'rahul@campus.edu', department: 'Physical Education' },
    ],
  },
  {
    day: 2,
    name: 'Technical Day',
    events: [
      { title: 'Coding Competition', category: 'Technical', start: '09:00', startLabel: '09:00 AM', endLabel: '11:00 AM', venue: 'Computer Lab 1', capacity: 60, organizer: 'organizer@campus.edu', department: 'Computer Science' },
      { title: 'Robotics Challenge', category: 'Technical', start: '11:30', startLabel: '11:30 AM', endLabel: '01:30 PM', venue: 'Robotics Lab', capacity: 40, organizer: 'rahul@campus.edu', department: 'Electronics' },
      { title: 'AI and Machine Learning Workshop', category: 'Workshop', start: '14:00', startLabel: '02:00 PM', endLabel: '04:00 PM', venue: 'Engineering Block, Lab 2', capacity: 50, organizer: 'organizer@campus.edu', department: 'Computer Science' },
    ],
  },
  {
    day: 3,
    name: 'Cultural and Career Day',
    events: [
      { title: 'Singing Competition', category: 'Cultural', start: '09:00', startLabel: '09:00 AM', endLabel: '11:00 AM', venue: 'College Auditorium', capacity: 40, organizer: 'priya@campus.edu', department: 'Student Affairs' },
      { title: 'Dance Competition', category: 'Cultural', start: '11:30', startLabel: '11:30 AM', endLabel: '01:30 PM', venue: 'College Main Auditorium', capacity: 50, organizer: 'priya@campus.edu', department: 'Student Affairs' },
      { title: 'Placement and Career Seminar', category: 'Seminar', start: '14:00', startLabel: '02:00 PM', endLabel: '04:00 PM', venue: 'Main Seminar Hall', capacity: 200, organizer: 'priya@campus.edu', department: 'Training and Placement' },
    ],
  },
  {
    day: 4,
    name: 'Indoor Games Day',
    events: [
      { title: 'Carrom Championship', category: 'Sports', start: '09:00', startLabel: '09:00 AM', endLabel: '11:00 AM', venue: 'Indoor Games Room', capacity: 32, organizer: 'rahul@campus.edu', department: 'Physical Education' },
      { title: 'Table Tennis Tournament', category: 'Sports', start: '11:30', startLabel: '11:30 AM', endLabel: '01:30 PM', venue: 'Indoor Sports Hall', capacity: 32, organizer: 'rahul@campus.edu', department: 'Physical Education' },
      { title: 'Chess Championship', category: 'Sports', start: '14:00', startLabel: '02:00 PM', endLabel: '04:00 PM', venue: 'College Activity Room', capacity: 64, organizer: 'rahul@campus.edu', department: 'Physical Education' },
    ],
  },
];

function startDateFromOffset() {
  const date = new Date();
  date.setDate(date.getDate() + DAY1_OFFSET);
  date.setHours(0, 0, 0, 0);
  return date;
}

function eventDate(dayOne, dayNumber, time) {
  const date = new Date(dayOne);
  date.setDate(date.getDate() + dayNumber - 1);
  const [hours, minutes] = time.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

async function seedCampusFest() {
  await connectDB();

  try {
    const admin = await User.findOne({ role: ROLES.ADMIN });
    if (!admin) throw new Error('An admin account is required to approve the fest events.');

    const organizerEmails = [...new Set(SCHEDULE.flatMap((day) => day.events.map((event) => event.organizer)))];
    const organizerDocs = await User.find({ email: { $in: organizerEmails }, role: ROLES.ORGANIZER });
    const organizers = new Map(organizerDocs.map((organizer) => [organizer.email, organizer]));
    const missingOrganizer = organizerEmails.find((email) => !organizers.has(email));
    if (missingOrganizer) throw new Error(`Required organizer account not found: ${missingOrganizer}`);

    const existingDayOne = await Event.findOne({ festival: FESTIVAL, festivalDay: 1 }).sort({ date: 1 });
    const dayOne = existingDayOne ? new Date(existingDayOne.date) : startDateFromOffset();
    dayOne.setHours(0, 0, 0, 0);

    let created = 0;
    let updated = 0;

    for (const day of SCHEDULE) {
      for (const item of day.events) {
        const organizer = organizers.get(item.organizer);
        const date = eventDate(dayOne, day.day, item.start);
        const registrationDeadline = eventDate(dayOne, day.day, '00:00');
        registrationDeadline.setDate(registrationDeadline.getDate() - 1);
        registrationDeadline.setHours(23, 59, 0, 0);

        const values = {
          title: item.title,
          description: `${FESTIVAL} - Day ${day.day}: ${day.name}. Join the ${item.title.toLowerCase()} as part of the four-day campus festival.`,
          category: item.category,
          festival: FESTIVAL,
          festivalDay: day.day,
          festivalDayName: day.name,
          organizer: organizer._id,
          department: item.department,
          venue: item.venue,
          date,
          startTime: item.startLabel,
          endTime: item.endLabel,
          registrationDeadline,
          maxParticipants: item.capacity,
          status: EVENT_STATUS.APPROVED,
          reviewedBy: admin._id,
          rejectionReason: '',
        };

        let event = await Event.findOne({ festival: FESTIVAL, title: item.title });
        if (!event) event = await Event.findOne({ title: item.title });

        if (event) {
          if (event.festival && event.festival !== FESTIVAL) {
            throw new Error(`Title is already used by another festival: ${item.title}`);
          }
          event.set({ ...values, reviewedAt: event.reviewedAt || new Date() });
          await event.save();
          updated += 1;
          console.log(`Updated Day ${day.day}: ${item.title}`);
        } else {
          await Event.create({ ...values, reviewedAt: new Date() });
          created += 1;
          console.log(`Created Day ${day.day}: ${item.title}`);
        }
      }
    }

    console.log(`Campus fest seeding complete: ${created} created, ${updated} updated.`);
  } finally {
    await mongoose.connection.close();
  }
}

seedCampusFest().catch((error) => {
  console.error('Campus fest seed failed:', error.message);
  process.exitCode = 1;
});