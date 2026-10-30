const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const { EVENT_CATEGORIES } = require('../config/constants');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ success: true, count: categories.length, categories, enumValues: EVENT_CATEGORIES });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });
  const category = await Category.create({ name, description });
  res.status(201).json({ success: true, category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
  ['name', 'description', 'isActive'].forEach((f) => {
    if (req.body[f] !== undefined) category[f] = req.body[f];
  });
  await category.save();
  res.json({ success: true, category });
});

module.exports = { getCategories, createCategory, updateCategory };