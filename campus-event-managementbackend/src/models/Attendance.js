const mongoose = require('mongoose');
const { ATTENDANCE_STATUS } = require('../config/constants');

const attendanceSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registration: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
    status: { type: String, enum: Object.values(ATTENDANCE_STATUS), default: ATTENDANCE_STATUS.PRESENT },
    markedAt: { type: Date, default: Date.now },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);