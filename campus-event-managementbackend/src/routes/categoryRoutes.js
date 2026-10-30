const express = require('express');
const { getCategories, createCategory, updateCategory } = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', getCategories);
router.post('/', protect, authorize(ROLES.ADMIN), createCategory);
router.patch('/:id', protect, authorize(ROLES.ADMIN), updateCategory);

module.exports = router;