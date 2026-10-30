const mongoose = require('mongoose');
const { EVENT_STATUS, EVENT_CATEGORIES } = require('../config/constants');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, enum: EVENT_CATEGORIES, required: true },
    festival: { type: String, trim: true, default: '' },
    festivalDay: { type: Number, min: 1, max: 4 },
    festivalDayName: { type: String, trim: true, default: '' },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    registrationDeadline: { type: Date, required: true },
    maxParticipants: { type: Number, required: true, min: 1 },
    poster: { type: String, default: '' },
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.DRAFT,
    },
    rejectionReason: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Event', eventSchema);