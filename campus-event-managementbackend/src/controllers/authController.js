const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../services/activityLogService');
const { ROLES } = require('../config/constants');

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, studentId, department, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  const requestedRole = [ROLES.STUDENT, ROLES.ORGANIZER].includes(role) ? role : ROLES.STUDENT;

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: requestedRole,
    studentId,
    department,
    phone,
  });

  await logActivity({ userId: user._id, action: 'User registered', details: `${user.email} (${user.role})`, ip: req.ip });

  const token = generateToken(user);
  res.status(201).json({ success: true, token, user: user.toSafeObject() });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }
  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact admin.' });
  }

  await logActivity({ userId: user._id, action: 'User login', details: user.email, ip: req.ip });

  const token = generateToken(user);
  res.json({ success: true, token, user: user.toSafeObject() });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

module.exports = { register, login, getMe };