const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  getEvents, getEventById, getMyEvents, createEvent, updateEvent, deleteEvent,
  submitEvent, approveEvent, rejectEvent, cancelEvent, completeEvent,
} = require('../controllers/eventController');
const { registerForEvent, cancelRegistration, getEventRegistrations } = require('../controllers/registrationController');
const { getEventAttendance } = require('../controllers/attendanceController');
const { generateCertificatesForEvent } = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { ROLES } = require('../config/constants');

const router = express.Router();

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return next();
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) req.user = user;
    next();
  } catch {
    next();
  }
};

router.get('/', optionalAuth, getEvents);
router.get('/mine', protect, authorize(ROLES.ORGANIZER, ROLES.ADMIN), getMyEvents);
router.get('/:id', optionalAuth, getEventById);

router.post('/', protect, authorize(ROLES.ORGANIZER), upload.single('poster'), createEvent);
router.put('/:id', protect, authorize(ROLES.ORGANIZER, ROLES.ADMIN), upload.single('poster'), updateEvent);
router.delete('/:id', protect, authorize(ROLES.ORGANIZER, ROLES.ADMIN), deleteEvent);

router.post('/:id/submit', protect, authorize(ROLES.ORGANIZER), submitEvent);
router.post('/:id/approve', protect, authorize(ROLES.ADMIN), approveEvent);
router.post('/:id/reject', protect, authorize(ROLES.ADMIN), rejectEvent);
router.post('/:id/cancel', protect, authorize(ROLES.ORGANIZER, ROLES.ADMIN), cancelEvent);
router.post('/:id/complete', protect, authorize(ROLES.ORGANIZER, ROLES.ADMIN), completeEvent);

router.post('/:id/register', protect, authorize(ROLES.STUDENT), registerForEvent);
router.delete('/:id/register', protect, authorize(ROLES.STUDENT), cancelRegistration);
router.get('/:id/registrations', protect, authorize(ROLES.ORGANIZER, ROLES.ADMIN), getEventRegistrations);

router.get('/:id/attendance', protect, authorize(ROLES.ORGANIZER, ROLES.ADMIN), getEventAttendance);

router.post('/:id/certificates/generate', protect, authorize(ROLES.ORGANIZER, ROLES.ADMIN), generateCertificatesForEvent);

module.exports = router;