import api from './api';

export async function getMyAttendance() {
  const res = await api.get('/attendance/my');
  return res.data;
}

export async function scanAttendance(payload) {
  const res = await api.post('/attendance/scan', payload);
  return res.data;
}