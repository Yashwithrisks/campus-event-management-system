import api from './api';

export async function getUsers(params = {}) {
  const res = await api.get('/users', { params });
  return res.data;
}

export async function toggleSuspendUser(id) {
  const res = await api.patch(`/users/${id}/suspend`);
  return res.data;
}

export async function approveEvent(id) {
  const res = await api.post(`/events/${id}/approve`);
  return res.data;
}

export async function rejectEvent(id, reason) {
  const res = await api.post(`/events/${id}/reject`, { reason });
  return res.data;
}