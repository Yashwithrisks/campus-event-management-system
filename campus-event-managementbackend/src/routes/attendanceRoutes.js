const express = require('express');
const { scanAttendance, getMyAttendance } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.post('/scan', protect, authorize(ROLES.ORGANIZER, ROLES.ADMIN), scanAttendance);
router.get('/my', protect, authorize(ROLES.STUDENT), getMyAttendance);

module.exports = router;