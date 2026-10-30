import api from './api';

export async function getMyRegistrations() {
  const res = await api.get('/registrations/my');
  return res.data;
}