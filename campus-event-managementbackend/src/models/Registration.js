const mongoose = require('mongoose');
const { REGISTRATION_STATUS } = require('../config/constants');

const registrationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registrationId: { type: String, required: true, unique: true },
    qrCode: { type: String, required: true },
    qrToken: { type: String, required: true, unique: true },

    // Form mein student ne jo details bhari wo yahan save hongi
    participant: {
      name: { type: String, trim: true },
      grNo: { type: String, trim: true },
      rollNo: { type: String, trim: true },
      department: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      mobile: { type: String, trim: true },
    },

    status: {
      type: String,
      enum: Object.values(REGISTRATION_STATUS),
      default: REGISTRATION_STATUS.REGISTERED,
    },
    registeredAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

registrationSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);