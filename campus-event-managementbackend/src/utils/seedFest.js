    require('dotenv').config();
    const mongoose = require('mongoose');
    const connectDB = require('../config/db');

    const User = require('../models/User');
    const Event = require('../models/Event');
    const Registration = require('../models/Registration');

    const { ROLES, EVENT_STATUS, REGISTRATION_STATUS } = require('../config/constants');
    const { generateRegistrationId, generateSecureQrToken } = require('./idGenerator');
    const { generateQrDataUrl } = require('../services/qrService');

    // Day 1 aaj se kitne din baad ho. Presentation ki date ke hisaab se badal sakte ho.
    const DAY1_OFFSET = 7;

    const SLOTS = [
    { start: '09:00', end: '11:00' },
    { start: '11:30', end: '13:30' },
    { start: '14:00', end: '16:00' },
    { start: '16:30', end: '18:00' },
    ];

    const ORGANIZER_EMAILS = {
    o1: 'organizer@campus.edu',
    o2: 'organizer2@campus.edu',
    o3: 'organizer3@campus.edu',
    };

    const SCHEDULE = [
    {
        day: 1,
        name: 'Sports Day',
        events: [
        {
            title: 'Badminton Championship',
            category: 'Sports',
            department: 'Physical Education',
            venue: 'Indoor Sports Complex, Court 1',
            max: 32,
            org: 'o2',
            text: 'Singles and doubles knockout tournament open to all departments. Players bring their own racquets; shuttles are provided.',
        },
        {
            title: 'Kabaddi Championship',
            category: 'Sports',
            department: 'Physical Education',
            venue: 'Kabaddi Court, Sports Ground',
            max: 48,
            org: 'o2',
            text: 'Inter-department kabaddi championship in the standard seven-a-side format. Teams are formed on the day from registered players.',
        },
        {
            title: 'Football Championship',
            category: 'Sports',
            department: 'Physical Education',
            venue: 'Main Football Ground',
            max: 80,
            org: 'o2',
            text: 'Knockout football tournament between departments. The sports committee places registered players into balanced teams.',
        },
        {
            title: 'Table Tennis Tournament',
            category: 'Sports',
            department: 'Physical Education',
            venue: 'Indoor Sports Complex, Hall B',
            max: 32,
            org: 'o2',
            text: 'Singles knockout tournament for all departments. Rackets and balls are provided at the venue.',
        },
        ],
    },
    {
        day: 2,
        name: 'Technical Day',
        events: [
        {
            title: 'Coding Competition',
            category: 'Competition',
            department: 'Computer Science',
            venue: 'Computer Lab 3',
            max: 60,
            org: 'o1',
            text: 'Individual competitive programming contest. Solve as many algorithmic problems as you can; ranking is by score and time taken.',
        },
        {
            title: 'Robotics Challenge',
            category: 'Technical',
            department: 'Electronics',
            venue: 'Robotics Lab, Block C',
            max: 40,
            org: 'o3',
            text: 'Build and program a robot to complete an obstacle course. Judged on speed, accuracy and design.',
        },
        {
            title: 'AI & ML Workshop',
            category: 'Workshop',
            department: 'Computer Science',
            venue: 'Seminar Hall 1',
            max: 50,
            org: 'o1',
            text: 'Hands-on introduction to machine learning with Python, from preparing data to training your first model. Bring your laptop.',
        },
        {
            title: 'Cyber Security Quiz',
            category: 'Technical',
            department: 'Computer Science',
            venue: 'Computer Lab 2',
            max: 80,
            org: 'o1',
            text: 'Quiz on network security, cryptography and safe online practices, with a fast buzzer round in the finals.',
        },
        ],
    },
    {
        day: 3,
        name: 'Cultural & Career Day',
        events: [
        {
            title: 'Singing Competition',
            category: 'Cultural',
            department: 'Student Affairs',
            venue: 'Open Air Theatre',
            max: 40,
            org: 'o2',
            text: 'Solo singing competition in any language or genre. Each participant performs one song of up to four minutes.',
        },
        {
            title: 'Dance Competition',
            category: 'Cultural',
            department: 'Student Affairs',
            venue: 'Main Auditorium',
            max: 50,
            org: 'o2',
            text: 'Solo and group dance competition across classical, folk and contemporary styles. Maximum performance time is five minutes.',
        },
        {
            title: 'Poster Making Competition',
            category: 'Competition',
            department: 'Student Affairs',
            venue: 'Art Room, Block A',
            max: 60,
            org: 'o2',
            text: 'Create a poster on the theme "Technology for a Sustainable Campus". Drawing sheets are provided; bring your own colours.',
        },
        {
            title: 'Placement & Career Seminar',
            category: 'Placement',
            department: 'Training & Placement',
            venue: 'Seminar Hall 2',
            max: 200,
            org: 'o2',
            text: 'Guidance on resume building, interview preparation and hiring trends, followed by a Q&A with visiting industry professionals.',
        },
        ],
    },
    ];

    function dayAt(offsetDays, hour = 0, minute = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, minute, 0, 0);
    return d;
    }

    async function findOrganizer(email) {
    const exact = await User.findOne({ email, role: ROLES.ORGANIZER });
    if (exact) return exact;
    return User.findOne({ role: ROLES.ORGANIZER });
    }

    async function addRegistrations(event, students, eventIndex) {
    if (students.length === 0) return 0;

    const count = Math.min(students.length, event.maxParticipants, 3 + (eventIndex % 6));
    let made = 0;

    for (let n = 0; n < count; n++) {
        const idx = (eventIndex + n) % students.length;
        const student = students[idx];

        const qrToken = generateSecureQrToken();
        const registrationId = await generateRegistrationId(Registration);
        const qrCode = await generateQrDataUrl({ qrToken, eventId: event._id });

        await Registration.create({
        event: event._id,
        student: student._id,
        registrationId,
        qrCode,
        qrToken,
        participant: {
            name: student.name,
            grNo: `GR${2024000 + idx + 1}`,
            rollNo: String(idx + 1),
            department: student.department,
            email: student.email,
            mobile: `98200${String(10001 + idx)}`,
        },
        status: REGISTRATION_STATUS.REGISTERED,
        });
        made += 1;
    }
    return made;
    }

    async function seedFest() {
    await connectDB();

    const admin = await User.findOne({ role: ROLES.ADMIN });
    const students = await User.find({ role: ROLES.STUDENT }).sort({ createdAt: 1 });

    const organizers = {};
    for (const [key, email] of Object.entries(ORGANIZER_EMAILS)) {
        organizers[key] = await findOrganizer(email);
    }

    if (!organizers.o1) {
        console.log('❌ Koi organizer nahi mila. Pehle `npm run seed` chalao, phir ye script.');
        await mongoose.connection.close();
        process.exit(1);
    }

    let created = 0;
    let skipped = 0;
    let registrations = 0;
    let eventIndex = 0;

    for (const day of SCHEDULE) {
        const dayOffset = DAY1_OFFSET + (day.day - 1);
        const eventDate = dayAt(dayOffset);

        console.log(`\n📅 Day ${day.day}: ${day.name}`);

        for (let i = 0; i < day.events.length; i++) {
        const item = day.events[i];
        const slot = SLOTS[i];
        eventIndex += 1;

        const exists = await Event.findOne({ title: item.title, venue: item.venue });
        if (exists) {
            skipped += 1;
            console.log(`   ⏭️  Already exists: ${item.title}`);
            continue;
        }

        const event = await Event.create({
            title: item.title,
            description: `Day ${day.day} – ${day.name}. ${item.text}`,
            category: item.category,
            organizer: organizers[item.org]._id,
            department: item.department,
            venue: item.venue,
            date: eventDate,
            startTime: slot.start,
            endTime: slot.end,
            registrationDeadline: dayAt(dayOffset - 1, 23, 59),
            maxParticipants: item.max,
            status: EVENT_STATUS.APPROVED,
            reviewedBy: admin ? admin._id : undefined,
            reviewedAt: new Date(),
        });

        created += 1;
        registrations += await addRegistrations(event, students, eventIndex);
        console.log(`   ✅ ${slot.start}-${slot.end}  ${item.title}`);
        }
    }

    console.log(`\nDone. Events created: ${created}, skipped: ${skipped}, registrations added: ${registrations}\n`);

    await mongoose.connection.close();
    process.exit(0);
    }

    seedFest().catch((err) => {
    console.error('❌ Fest seed failed:', err);
    process.exit(1);
    });