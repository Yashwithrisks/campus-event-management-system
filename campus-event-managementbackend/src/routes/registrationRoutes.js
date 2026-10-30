const express = require('express');

const {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getEventRegistrations,
} = require('../controllers/registrationController');

const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

// Student: View own registrations
router.get(
  '/my',
  protect,
  authorize(ROLES.STUDENT),
  getMyRegistrations
);

// Student: Register for an event
router.post(
  '/:id',
  protect,
  authorize(ROLES.STUDENT),
  registerForEvent
);

// Student: Cancel registration for an event
router.delete(
  '/:id',
  protect,
  authorize(ROLES.STUDENT),
  cancelRegistration
);

// Organizer/Admin: View registrations for an event
router.get(
  '/event/:id',
  protect,
  getEventRegistrations
);

module.exports = router;


