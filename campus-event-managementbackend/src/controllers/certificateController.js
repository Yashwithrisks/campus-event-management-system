const path = require('path');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');
const asyncHandler = require('../utils/asyncHandler');
const { generateCertificateId } = require('../utils/idGenerator');
const { generateCertificatePdf, certDir } = require('../services/certificateService');
const { createManyNotifications } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');
const { logActivity } = require('../services/activityLogService');
const { EVENT_STATUS, ROLES, NOTIFICATION_TYPES, ATTENDANCE_STATUS } = require('../config/constants');

const generateCertificatesForEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizer', 'name department');
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

  const isOwner = String(event.organizer._id) === String(req.user.id);
  if (!isOwner && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ success: false, message: 'Not allowed.' });
  }
  if (event.status !== EVENT_STATUS.COMPLETED) {
    return res.status(400).json({ success: false, message: 'Event must be marked COMPLETED before generating certificates.' });
  }

  const attendances = await Attendance.find({ event: event._id, status: ATTENDANCE_STATUS.PRESENT })
    .populate('student', 'name email');
  const existingCerts = await Certificate.find({ event: event._id });
  const alreadyCertified = new Set(existingCerts.map((c) => String(c.student)));

  const eligible = attendances.filter((a) => !alreadyCertified.has(String(a.student._id)));

  const generated = [];
  for (const att of eligible) {
    const certificateId = await generateCertificateId(Certificate);
    const certificateUrl = await generateCertificatePdf({
      certificateId,
      studentName: att.student.name,
      eventName: event.title,
      organizerName: event.organizer.name,
      department: event.department,
      eventDate: new Date(event.date).toDateString(),
    });

    const cert = await Certificate.create({
      certificateId,
      event: event._id,
      student: att.student._id,
      certificateUrl,
    });
    generated.push(cert);

    await sendEmail({
      to: att.student.email,
      subject: `Certificate generated: ${event.title}`,
      text: `Your certificate for "${event.title}" is ready. Certificate ID: ${certificateId}. Log in to download it.`,
    });
  }

  await createManyNotifications(
    eligible.map((a) => a.student._id),
    {
      title: 'Certificate generated',
      message: `Your certificate for "${event.title}" is ready to download.`,
      type: NOTIFICATION_TYPES.CERTIFICATE_GENERATED,
      relatedEvent: event._id,
    }
  );

  await logActivity({ userId: req.user.id, action: 'Certificates generated', details: `${generated.length} for ${event.title}`, ip: req.ip });

  res.status(201).json({ success: true, generatedCount: generated.length, certificates: generated });
});

const getMyCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({ student: req.user.id })
    .populate('event', 'title date venue category department')
    .sort({ issuedAt: -1 });
  res.json({ success: true, count: certificates.length, certificates });
});

const getCertificateById = asyncHandler(async (req, res) => {
  const cert = await Certificate.findById(req.params.id).populate('event').populate('student', 'name email');
  if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });

  const isOwner = String(cert.student._id) === String(req.user.id);
  if (!isOwner && req.user.role === ROLES.STUDENT) {
    return res.status(403).json({ success: false, message: 'Not allowed.' });
  }

  res.json({ success: true, certificate: cert });
});

const downloadCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findById(req.params.id);
  if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });

  const isOwner = String(cert.student) === String(req.user.id);
  if (!isOwner && req.user.role === ROLES.STUDENT) {
    return res.status(403).json({ success: false, message: 'Not allowed.' });
  }

  const filePath = path.join(certDir, path.basename(cert.certificateUrl));
  res.download(filePath, `${cert.certificateId}.pdf`);
});

const verifyCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({ certificateId: req.params.certificateId })
    .populate('event', 'title department date')
    .populate('student', 'name');

  if (!cert) {
    return res.json({ success: true, valid: false, message: 'Certificate not found. This ID may be invalid.' });
  }

  res.json({
    success: true,
    valid: true,
    certificate: {
      certificateId: cert.certificateId,
      studentName: cert.student.name,
      eventName: cert.event.title,
      organizer: cert.event.department,
      date: cert.event.date,
      issuedAt: cert.issuedAt,
    },
  });
});

module.exports = {
  generateCertificatesForEvent, getMyCertificates, getCertificateById, downloadCertificate, verifyCertificate,
};