const express = require('express');
const { getUsers, toggleSuspendUser, updateMyProfile } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.put('/me', protect, updateMyProfile);
router.get('/', protect, authorize(ROLES.ADMIN), getUsers);
router.patch('/:id/suspend', protect, authorize(ROLES.ADMIN), toggleSuspendUser);

module.exports = router;