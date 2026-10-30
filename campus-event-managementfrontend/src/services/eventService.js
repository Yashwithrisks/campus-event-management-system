import api from './api';

// Get all events
export async function getEvents(params = {}) {
  const res = await api.get('/events', { params });
  return res.data;
}

// Get a single event by ID
export async function getEventById(id) {
  const res = await api.get(`/events/${id}`);
  return res.data;
}

// Register student for an event
export async function registerForEvent(eventId, details) {
  if (!eventId) {
    throw new Error('Event ID is required.');
  }

  if (!details || typeof details !== 'object') {
    throw new Error('Please provide student registration details.');
  }

  const res = await api.post(`/registrations/${eventId}`, {
    name: details.name,
    grNo: details.grNo,
    rollNo: details.rollNo,
    department: details.department,
    email: details.email,
    mobile: details.mobile,
  });

  return res.data;
}

// Cancel event registration
export async function cancelRegistration(eventId) {
  if (!eventId) {
    throw new Error('Event ID is required.');
  }

  const res = await api.delete(`/registrations/${eventId}`);
  return res.data;
}

// Get logged-in student's registrations
export async function getMyEvents() {
  const res = await api.get('/events/mine');
  return res.data;
}

// Create a new event
export async function createEvent(formData) {
  const res = await api.post('/events', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
}

// Update an existing event
export async function updateEvent(id, formData) {
  const res = await api.put(`/events/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
}

// Submit an event for approval
export async function submitEvent(id) {
  const res = await api.post(`/events/${id}/submit`);
  return res.data;
}

// Get registrations for a specific event
export async function getEventRegistrations(id) {
  const res = await api.get(`/registrations/event/${id}`);
  return res.data;
}

// Mark an event as completed
export async function completeEvent(id) {
  const res = await api.post(`/events/${id}/complete`);
  return res.data;
}

// Generate event certificates
export async function generateCertificates(id) {
  const res = await api.post(`/events/${id}/certificates/generate`);
  return res.data;
}
