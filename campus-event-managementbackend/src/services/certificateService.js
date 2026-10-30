const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const certDir = path.join(__dirname, '..', '..', 'certificates');
if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true });

function generateCertificatePdf({ certificateId, studentName, eventName, organizerName, department, eventDate }) {
  return new Promise((resolve, reject) => {
    const fileName = `${certificateId}.pdf`;
    const filePath = path.join(certDir, fileName);
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    doc.rect(20, 20, pageWidth - 40, pageHeight - 40).lineWidth(2).stroke('#1a3a6e');
    doc.rect(30, 30, pageWidth - 60, pageHeight - 60).lineWidth(0.75).stroke('#c9a227');

    doc.fontSize(12).fillColor('#555').font('Helvetica').text('CAMPUS EVENT MANAGEMENT SYSTEM', 0, 70, {
      align: 'center',
    });

    doc.fontSize(30).fillColor('#1a3a6e').font('Helvetica-Bold').text('Certificate of Participation', 0, 100, {
      align: 'center',
    });

    doc.fontSize(14).fillColor('#333').font('Helvetica').text('This is to certify that', 0, 165, { align: 'center' });

    doc.fontSize(26).fillColor('#111').font('Helvetica-Bold').text(studentName, 0, 195, { align: 'center' });

    doc.fontSize(14).fillColor('#333').font('Helvetica').text('has successfully participated in', 0, 235, {
      align: 'center',
    });

    doc.fontSize(20).fillColor('#1a3a6e').font('Helvetica-Bold').text(eventName, 0, 262, { align: 'center' });

    doc
      .fontSize(13)
      .fillColor('#333')
      .font('Helvetica')
      .text(`organized by ${organizerName} — ${department}`, 0, 300, { align: 'center' });

    doc
      .fontSize(12)
      .fillColor('#555')
      .text(`Date: ${eventDate}`, 0, 330, { align: 'center' });

    doc.fontSize(10).fillColor('#777').text(`Certificate ID: ${certificateId}`, 60, pageHeight - 90);
    doc.fontSize(10).fillColor('#777').text('Authorized Signature', pageWidth - 260, pageHeight - 90, {
      width: 200,
      align: 'center',
    });
    doc
      .moveTo(pageWidth - 260, pageHeight - 105)
      .lineTo(pageWidth - 60, pageHeight - 105)
      .lineWidth(0.75)
      .stroke('#999');

    doc.end();

    stream.on('finish', () => resolve(`/certificates/${fileName}`));
    stream.on('error', reject);
  });
}

module.exports = { generateCertificatePdf, certDir };