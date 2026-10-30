const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateId: { type: String, required: true, unique: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issuedAt: { type: Date, default: Date.now },
    certificateUrl: { type: String, required: true },
  },
  { timestamps: true }
);

certificateSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);