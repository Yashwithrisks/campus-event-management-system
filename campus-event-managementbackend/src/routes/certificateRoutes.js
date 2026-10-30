const express = require('express');
const {
  getMyCertificates, getCertificateById, downloadCertificate, verifyCertificate,
} = require('../controllers/certificateController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/verify/:certificateId', verifyCertificate);
router.get('/my', protect, getMyCertificates);
router.get('/:id', protect, getCertificateById);
router.get('/:id/download', protect, downloadCertificate);

module.exports = router;