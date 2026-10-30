const QRCode = require('qrcode');

async function generateQrDataUrl({ qrToken, eventId }) {
  const payload = JSON.stringify({ t: qrToken, e: String(eventId) });
  return QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 2, width: 300 });
}

function parseQrPayload(rawText) {
  try {
    const data = JSON.parse(rawText);
    if (!data.t || !data.e) return null;
    return { qrToken: data.t, eventId: data.e };
  } catch {
    return null;
  }
}

module.exports = { generateQrDataUrl, parseQrPayload };