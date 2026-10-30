import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, CalendarDays, ScanLine } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { createEvent } from '../services/eventService';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Hackathon', 'Competition', 'Club Activity', 'Placement', 'Awareness', 'Other'];

export default function CreateEvent() {
  const [form, setForm] = useState({
    title: '', description: '', category: 'Technical', department: '', venue: '',
    date: '', startTime: '', endTime: '', registrationDeadline: '', maxParticipants: '',
  });
  const [poster, setPoster] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (poster) formData.append('poster', poster);

      await createEvent(formData);
      setSuccess('Event created as draft! Go to "My Events" to submit it for approval.');
      setForm({
        title: '', description: '', category: 'Technical', department: '', venue: '',
        date: '', startTime: '', endTime: '', registrationDeadline: '', maxParticipants: '',
      });
      setPoster(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  }

  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'create-event', label: 'Create Event', icon: PlusCircle },
    { key: 'events', label: 'My Events', icon: CalendarDays },
    { key: 'scanner', label: 'QR Scanner', icon: ScanLine },
  ];

  function handleTabChange(key) {
    if (key === 'dashboard') navigate('/organizer');
    else navigate(`/organizer/${key}`);
  }

  return (
    <DashboardLayout
      title="Create Event"
      sidebarItems={sidebarItems}
      activeTab="create-event"
      onTabChange={handleTabChange}
    >
      <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-2xl">
        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
        {success && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Event Title</label>
            <input name="title" required value={form.title} onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea name="description" required rows={4} value={form.description} onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select name="category" value={form.category} onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <input name="department" required value={form.department} onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Venue</label>
            <input name="venue" required value={form.venue} onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Event Date</label>
              <input type="date" name="date" required value={form.date} onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
              <input type="time" name="startTime" required value={form.startTime} onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
              <input type="time" name="endTime" required value={form.endTime} onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Registration Deadline</label>
              <input type="date" name="registrationDeadline" required value={form.registrationDeadline} onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Participants</label>
              <input type="number" name="maxParticipants" required min={1} value={form.maxParticipants} onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Event Poster (optional)</label>
            <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(e) => setPoster(e.target.files[0])}
              className="w-full text-sm text-slate-500" />
          </div>

          <button type="submit" disabled={loading}
            className="bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Event (Draft)'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}