import api from './api';

export async function getStudentAnalytics() {
  const res = await api.get('/analytics/student');
  return res.data;
}

export async function getOrganizerAnalytics() {
  const res = await api.get('/analytics/organizer');
  return res.data;
}

export async function getAdminAnalytics() {
  const res = await api.get('/analytics/admin');
  return res.data;
}