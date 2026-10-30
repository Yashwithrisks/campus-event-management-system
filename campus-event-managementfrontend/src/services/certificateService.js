import api from './api';

export async function getMyCertificates() {
  const res = await api.get('/certificates/my');
  return res.data;
}

export function getCertificateDownloadUrl(id) {
  return `http://localhost:5000/api/certificates/${id}/download`;
}

export async function verifyCertificate(certificateId) {
  const res = await api.get(`/certificates/verify/${certificateId}`);
  return res.data;
}