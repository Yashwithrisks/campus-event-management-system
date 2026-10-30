const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { generateRegistrationId, generateSecureQrToken } = require('../utils/idGenerator');
const { generateQrDataUrl } = require('../services/qrService');

// Register student for an event
const registerForEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user && req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Please login first.',
      });
    }

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID.',
      });
    }

    const {
      name,
      grNo,
      rollNo,
      department,
      email,
      mobile,
    } = req.body || {};

    if (
      !name || !grNo || !rollNo ||
      !department || !email || !mobile
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields.',
      });
    }

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!validEmail.test(String(email).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    if (!/^[0-9]{10}$/.test(String(mobile).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must contain 10 digits.',
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    if (
      event.status &&
      !['APPROVED', 'PUBLISHED'].includes(
        String(event.status).toUpperCase()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'This event is not open for registration.',
      });
    }

    if (event.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline);

      if (
        !Number.isNaN(deadline.getTime()) &&
        Date.now() > deadline.getTime()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Registration deadline has passed.',
        });
      }
    }

    const existingRegistration = await Registration.findOne({
      event: eventId,
      student: userId,
    });

    if (
      existingRegistration &&
      String(existingRegistration.status).toUpperCase() !== 'CANCELLED'
    ) {
      return res.status(409).json({
        success: false,
        message: 'You are already registered for this event.',
      });
    }

    if (event.maxParticipants) {
      const registeredCount = await Registration.countDocuments({
        event: eventId,
        status: { $ne: 'CANCELLED' },
      });

      if (registeredCount >= event.maxParticipants) {
        return res.status(400).json({
          success: false,
          message: 'Sorry, this event is full.',
        });
      }
    }

    const registrationId = await generateRegistrationId(Registration);
    const qrToken = generateSecureQrToken();
    const qrCode = await generateQrDataUrl({ qrToken, eventId });

    const registrationData = {
      event: eventId,
      student: userId,
      registrationId: registrationId,
      qrCode: qrCode,
      qrToken: qrToken,
      participant: {
        name: String(name).trim(),
        grNo: String(grNo).trim(),
        rollNo: String(rollNo).trim(),
        department: String(department).trim(),
        email: String(email).trim().toLowerCase(),
        mobile: String(mobile).trim(),
      },
      status: 'REGISTERED',
      registeredAt: new Date(),
      cancelledAt: undefined,
    };

    let registration;

    if (existingRegistration) {
      existingRegistration.set(registrationData);
      registration = await existingRegistration.save();
    } else {
      registration = await Registration.create(registrationData);
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      registration: registration,
    });
  } catch (error) {
    next(error);
  }
};

// Cancel a registration
const cancelRegistration = async (req, res, next) => {
  try {
    const userId = req.user && req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Please login first.',
      });
    }

    const registration = await Registration.findOne({
      event: req.params.id,
      student: userId,
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found.',
      });
    }

    if (String(registration.status).toUpperCase() === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Registration is already cancelled.',
      });
    }

    registration.status = 'CANCELLED';
    registration.cancelledAt = new Date();

    await registration.save();

    return res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// Get logged-in student's registrations
const getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await Registration.find({
      student: req.user._id,
    }).populate('event');

    return res.status(200).json({
      success: true,
      count: registrations.length,
      registrations: registrations,
    });
  } catch (error) {
    next(error);
  }
};

// Get registrations for an event
const getEventRegistrations = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    const userRole = String(req.user.role || '').toUpperCase();
    const isAdmin = userRole === 'ADMIN';
    const isOwner =
      event.organizer &&
      String(event.organizer) === String(req.user._id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to view these registrations.',
      });
    }

    const registrations = await Registration.find({
      event: req.params.id,
    }).populate('student', 'name email studentId');

    return res.status(200).json({
      success: true,
      count: registrations.length,
      registrations: registrations,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getEventRegistrations,
};
