import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle,
  Award,
  Clock,
  Search,
  Filter,
  X,
} from 'lucide-react';

import DashboardLayout from '../layouts/DashboardLayout';
import { LoadingState, EmptyState, StatusBadge } from '../components/UiHelpers';
import { getEvents, registerForEvent } from '../services/eventService';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'Technical',
  'Cultural',
  'Sports',
  'Workshop',
  'Seminar',
  'Hackathon',
  'Competition',
  'Club Activity',
  'Placement',
  'Awareness',
  'Other',
];

export default function BrowseEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [registering, setRegistering] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '', rollNo: '', grNo: '', email: '', mobile: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  async function loadEvents(searchQuery = search, categoryQuery = category) {
    setLoading(true);

    try {
      const data = await getEvents({
        search: searchQuery || undefined,
        category: categoryQuery || undefined,
        sort: 'oldest',
      });

      setEvents(Array.isArray(data?.events) ? data.events : []);
    } catch (err) {
      console.error('Error loading events:', err);
      setMessage(
        err.response?.data?.message || 'Unable to load events.'
      );
    } finally {
      setLoading(false);
    }
  }

  // Fixed useEffect for category filtering
  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);

      try {
        const data = await getEvents({
          search: search || undefined,
          category: category || undefined,
          sort: 'oldest',
        });

        setEvents(Array.isArray(data?.events) ? data.events : []);
      } catch (err) {
        console.error('Error loading events:', err);
        setMessage(
          err.response?.data?.message || 'Unable to load events.'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [category]);

  function openRegistrationForm(event) {
    setForm({
      name: user?.name || '',
      rollNo: user?.rollNo || '',
      grNo: user?.studentId || '',
      email: user?.email || '',
      mobile: user?.phone || '',
    });
    setFormError('');
    setMessage('');
    setSelectedEvent(event);
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!selectedEvent) return;

    setRegistering(selectedEvent._id);
    setFormError('');

    try {
      await registerForEvent(selectedEvent._id, {
        ...form,
        department: user?.department || 'General',
      });
      setMessage('Registration successful! Check My Registrations for your QR pass.');
      setSelectedEvent(null);
      await loadEvents();
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setRegistering(null);
    }
  }

  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard', icon: Calendar },
    { key: 'events', label: 'Browse Events', icon: Calendar },
    { key: 'registrations', label: 'My Registrations', icon: CheckCircle },
    { key: 'attendance', label: 'Attendance History', icon: Clock },
    { key: 'certificates', label: 'Certificates', icon: Award },
  ];

  function handleTabChange(key) {
    if (key === 'dashboard') {
      navigate('/student');
    } else {
      navigate(`/student/${key}`);
    }
  }

  function getEventAction(ev) {
    if (ev.myRegistration && ev.myRegistration.status !== 'CANCELLED') {
      return <StatusBadge status={ev.myRegistration.status} />;
    }

    if (ev.status === 'COMPLETED') {
      return <span className="text-slate-400 text-xs font-medium">Completed</span>;
    }

    if (ev.status === 'ONGOING') {
      return <span className="text-slate-400 text-xs font-medium">In progress</span>;
    }

    if (Number(ev.availableSeats) <= 0) {
      return <span className="text-rose-600 text-xs font-medium">Event Full</span>;
    }

    if (
      ev.registrationDeadline &&
      !Number.isNaN(new Date(ev.registrationDeadline).getTime()) &&
      new Date() > new Date(ev.registrationDeadline)
    ) {
      return <span className="text-slate-400 text-xs font-medium">Closed</span>;
    }

    return (
      <button
        type="button"
        onClick={() => openRegistrationForm(ev)}
        disabled={registering === ev._id}
        className="bg-indigo-600 text-white text-xs font-medium px-3.5 py-1.5 rounded-md hover:bg-indigo-700 transition disabled:opacity-50 whitespace-nowrap shadow-sm"
      >
        Register
      </button>
    );
  }

  return (
    <DashboardLayout
      title="Browse Events"
      sidebarItems={sidebarItems}
      activeTab="events"
      onTabChange={handleTabChange}
    >
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search events by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') loadEvents();
            }}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="relative min-w-[180px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => loadEvents()}
          className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
        >
          Search
        </button>
      </div>

      {message && (
        <div className="mb-6 text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage('')}
            className="text-indigo-400 hover:text-indigo-700 font-bold text-lg leading-none"
            aria-label="Close message"
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : events.length === 0 ? (
        <EmptyState message="No upcoming events found matching your criteria." />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">
              College Events Schedule
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {events.length} available events
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Sr. No.</th>
                  <th className="px-4 py-3.5">Event</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Day</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Time</th>
                  <th className="px-4 py-3.5">Venue</th>
                  <th className="px-4 py-3.5">Organizer</th>
                  <th className="px-4 py-3.5">Seats Left</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {events.map((ev, index) => (
                  <tr
                    key={ev._id || `${ev.title}-${index}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3.5 text-slate-500">{index + 1}</td>

                    <td className="px-4 py-3.5 font-medium text-slate-800 min-w-[180px]">
                      {ev.title || 'Untitled Event'}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-block bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">
                        {ev.category || 'Other'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 min-w-[130px] text-slate-600">
                      {ev.festivalDay
                        ? `Day ${ev.festivalDay} - ${ev.festivalDayName}`
                        : '—'}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                      {ev.date &&
                      !Number.isNaN(new Date(ev.date).getTime())
                        ? new Date(ev.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                      {ev.startTime && ev.endTime
                        ? `${ev.startTime} - ${ev.endTime}`
                        : ev.time || '—'}
                    </td>

                    <td className="px-4 py-3.5 min-w-[120px] text-slate-600">
                      {ev.venue || '—'}
                    </td>

                    <td className="px-4 py-3.5 min-w-[130px] text-slate-600">
                      {ev.organizer?.name || '—'}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600">
                      <span className={Number(ev.availableSeats) <= 5 ? 'text-amber-600 font-semibold' : ''}>
                        {ev.availableSeats ?? '—'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {getEventAction(ev)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !registering) setSelectedEvent(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-title"
            className="my-auto w-full max-w-xl rounded-xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2 id="registration-title" className="text-lg font-semibold text-slate-900">Event Registration</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedEvent.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                disabled={Boolean(registering)}
                aria-label="Close registration form"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 px-5 py-5 sm:px-6">
              {formError && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Full name
                  <input
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Roll number
                  <input
                    required
                    value={form.rollNo}
                    onChange={(e) => setForm({ ...form, rollNo: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  GR number
                  <input
                    required
                    value={form.grNo}
                    onChange={(e) => setForm({ ...form, grNo: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Email
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  Contact number
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    title="Enter a 10-digit phone number"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
              </div>

              <p className="text-xs text-slate-500">Department: {user?.department || 'General'}</p>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  disabled={Boolean(registering)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(registering)}
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {registering ? 'Registering...' : 'Confirm registration'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}