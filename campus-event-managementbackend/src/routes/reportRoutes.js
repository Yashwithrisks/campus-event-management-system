const express = require('express');
const { eventReport, studentParticipationReport, attendanceReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/events', protect, authorize(ROLES.ORGANIZER, ROLES.ADMIN), eventReport);
router.get('/students', protect, authorize(ROLES.ADMIN), studentParticipationReport);
router.get('/attendance', protect, authorize(ROLES.ORGANIZER, ROLES.ADMIN), attendanceReport);

module.exports = router;