const express = require('express');
const { getActivityLogs } = require('../controllers/activityLogController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', protect, authorize(ROLES.ADMIN), getActivityLogs);

module.exports = router;