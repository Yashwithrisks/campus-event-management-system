import api from './api';

export async function loginUser(email, password) {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function registerUser(payload) {
  const res = await api.post('/auth/register', payload);
  return res.data;
}

export async function getCurrentUser() {
  const res = await api.get('/auth/me');
  return res.data;
}