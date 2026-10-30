const express = require('express');
const { studentAnalytics, organizerAnalytics, adminAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/student', protect, authorize(ROLES.STUDENT), studentAnalytics);
router.get('/organizer', protect, authorize(ROLES.ORGANIZER), organizerAnalytics);
router.get('/admin', protect, authorize(ROLES.ADMIN), adminAnalytics);

module.exports = router;