import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  CalendarDays,
  ScanLine,
  Users,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { LoadingState, EmptyState, StatusBadge, PageHeader } from '../components/UiHelpers';
import {
  getMyEvents,
  submitEvent,
  completeEvent,
  generateCertificates,
  getEventRegistrations,
} from '../services/eventService';
import { getOrganizerAnalytics } from '../services/analyticsService';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StudentsPanel({ info }) {
  if (!info || info.loading) {
    return <p className="py-4 text-center text-sm text-slate-400">Loading students...</p>;
  }
  if (info.error) {
    return <p className="py-4 text-center text-sm text-red-600">{info.error}</p>;
  }
  if (info.rows.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-500">No students have registered for this event yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">GR No.</th>
            <th className="px-3 py-2">Roll No.</th>
            <th className="px-3 py-2">Department</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Mobile</th>
            <th className="px-3 py-2">Registration ID</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {info.rows.map((r, i) => (
            <tr key={r._id}>
              <td className="px-3 py-2 tabular-nums text-slate-400">{i + 1}</td>
              <td className="px-3 py-2 font-medium text-slate-800">{r.participant?.name || r.student?.name}</td>
              <td className="px-3 py-2 text-slate-600">{r.participant?.grNo || '-'}</td>
              <td className="px-3 py-2 text-slate-600">{r.participant?.rollNo || '-'}</td>
              <td className="px-3 py-2 text-slate-600">{r.participant?.department || r.student?.department || '-'}</td>
              <td className="px-3 py-2 text-slate-600">{r.participant?.email || r.student?.email || '-'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-600">{r.participant?.mobile || '-'}</td>
              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-600">{r.registrationId}</td>
              <td className="px-3 py-2">
                <StatusBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MyEvents() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState({});
  const [details, setDetails] = useState({});
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setExpanded({});
    setDetails({});
    try {
      const [eventsRes, analyticsRes] = await Promise.all([getMyEvents(), getOrganizerAnalytics()]);
      setEvents(eventsRes.events);
      const map = {};
      analyticsRes.analytics.eventWise.forEach((e) => {
        map[e.eventId] = e;
      });
      setStats(map);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Could not load your events. Please refresh the page.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleStudents(id) {
    if (expanded[id]) {
      setExpanded((prev) => ({ ...prev, [id]: false }));
      return;
    }

    setExpanded((prev) => ({ ...prev, [id]: true }));
    if (details[id]?.rows) return;

    setDetails((prev) => ({ ...prev, [id]: { loading: true } }));
    try {
      const data = await getEventRegistrations(id);
      const rows = data.registrations.filter((r) => r.status !== 'CANCELLED');
      setDetails((prev) => ({ ...prev, [id]: { rows } }));
    } catch (err) {
      console.error(err);
      setDetails((prev) => ({ ...prev, [id]: { error: 'Could not load the students for this event.' } }));
    }
  }

  async function runAction(action, successText, errorText) {
    try {
      const res = await action();
      setMessage({ type: 'success', text: typeof successText === 'function' ? successText(res) : successText });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || errorText });
    }
  }

  function handleSubmit(id) {
    runAction(() => submitEvent(id), 'Event submitted for admin approval.', 'Failed to submit the event.');
  }

  function handleComplete(id) {
    if (!confirm('Mark this event as completed? This enables certificate generation.')) return;
    runAction(() => completeEvent(id), 'Event marked as completed.', 'Failed to mark the event completed.');
  }

  function handleGenerateCerts(id) {
    runAction(
      () => generateCertificates(id),
      (res) => `${res.generatedCount} certificate(s) generated.`,
      'Failed to generate certificates.'
    );
  }

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = events.filter(
      (e) => (!statusFilter || e.status === statusFilter) && (!q || e.title.toLowerCase().includes(q))
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const time = (e) => new Date(e.date).getTime();

    const upcoming = filtered
      .filter((e) => time(e) >= today.getTime())
      .sort((a, b) => time(a) - time(b) || a.startTime.localeCompare(b.startTime));
    const past = filtered.filter((e) => time(e) < today.getTime()).sort((a, b) => time(b) - time(a));

    return [...upcoming, ...past];
  }, [events, search, statusFilter]);

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

  const actionBtn = 'whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium';

  return (
    <DashboardLayout
      title="My Events"
      sidebarItems={sidebarItems}
      activeTab="events"
      onTabChange={handleTabChange}
    >
      <PageHeader
        title="My Events"
        subtitle={`${events.length} event${events.length === 1 ? '' : 's'} created by you`}
        action={
          <button
            onClick={() => navigate('/organizer/create-event')}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <PlusCircle size={16} /> Create event
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by event name"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <div
          role="status"
          className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <EmptyState
          message={
            events.length === 0
              ? 'You have not created any events yet. Use "Create event" to add your first one.'
              : 'No events match your search or filter.'
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Date and time</th>
                <th className="px-4 py-3">Venue</th>
                <th className="px-4 py-3">Registrations</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((ev) => {
                const s = stats[ev._id] || { registrations: 0, attendance: 0 };
                const isOpen = !!expanded[ev._id];
                return (
                  <Fragment key={ev._id}>
                    <tr className="align-top hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{ev.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{ev.category}</p>
                        {ev.status === 'REJECTED' && ev.rejectionReason && (
                          <p className="mt-1 max-w-xs text-xs text-red-600">Rejected: {ev.rejectionReason}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="text-slate-700">{formatDate(ev.date)}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {ev.startTime} to {ev.endTime}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{ev.venue}</td>
                      <td className="px-4 py-3">
                        <p className="whitespace-nowrap tabular-nums text-slate-700">
                          {s.registrations} <span className="text-slate-400">/ {ev.maxParticipants}</span>
                        </p>
                        <button
                          onClick={() => toggleStudents(ev._id)}
                          aria-expanded={isOpen}
                          className="mt-2 flex items-center gap-1 whitespace-nowrap rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isOpen ? 'Hide students' : 'Show students'}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">{s.attendance}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ev.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => navigate(`/organizer/events/${ev._id}/registrations`)}
                            className={`${actionBtn} flex items-center gap-1 border border-slate-200 text-slate-600 hover:bg-slate-50`}
                          >
                            <Users size={12} /> Registrations
                          </button>

                          {['DRAFT', 'REJECTED'].includes(ev.status) && (
                            <button
                              onClick={() => handleSubmit(ev._id)}
                              className={`${actionBtn} bg-indigo-600 text-white hover:bg-indigo-700`}
                            >
                              Submit for approval
                            </button>
                          )}
                          {ev.status === 'APPROVED' && (
                            <button
                              onClick={() => handleComplete(ev._id)}
                              className={`${actionBtn} bg-slate-800 text-white hover:bg-slate-900`}
                            >
                              Mark completed
                            </button>
                          )}
                          {ev.status === 'COMPLETED' && (
                            <button
                              onClick={() => handleGenerateCerts(ev._id)}
                              className={`${actionBtn} bg-amber-500 text-white hover:bg-amber-600`}
                            >
                              Generate certificates
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={7} className="px-4 py-3">
                          <p className="mb-2 text-xs font-medium text-slate-500">
                            Students registered for {ev.title}
                          </p>
                          <StudentsPanel info={details[ev._id]} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}