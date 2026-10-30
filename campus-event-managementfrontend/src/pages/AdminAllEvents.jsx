import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck,
  Users,
  CalendarDays,
} from 'lucide-react';

import DashboardLayout from '../layouts/DashboardLayout';
import {
  LoadingState,
  EmptyState,
  StatusBadge,
} from '../components/UiHelpers';
import { getEvents } from '../services/eventService';

export default function AdminAllEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const navigate = useNavigate();

  async function load() {
    setLoading(true);

    try {
      const data = await getEvents(
        filter ? { status: filter } : {}
      );

      setEvents(data.events);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const sidebarItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      key: 'approvals',
      label: 'Pending Approvals',
      icon: FileCheck,
    },
    {
      key: 'events',
      label: 'All Events',
      icon: CalendarDays,
    },
    {
      key: 'users',
      label: 'User Management',
      icon: Users,
    },
  ];

  function handleTabChange(key) {
    if (key === 'dashboard') {
      navigate('/admin');
    } else {
      navigate(`/admin/${key}`);
    }
  }

  const statuses = [
    '',
    'DRAFT',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'ONGOING',
    'COMPLETED',
    'CANCELLED',
  ];

  // Date format: 14 Oct 2026 (weekday removed)
  function formatEventDate(date) {
    if (!date) return '—';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '—';
    }

    return parsedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <DashboardLayout
      title="All Events"
      sidebarItems={sidebarItems}
      activeTab="events"
      onTabChange={handleTabChange}
    >
      <div className="mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status || 'All Statuses'}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : events.length === 0 ? (
        <EmptyState message="No events found." />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Organizer</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Registrations</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>

            <tbody>
              {events.map((ev) => (
                <tr
                  key={ev._id}
                  className="border-t border-slate-100"
                >
                  <td className="px-4 py-2.5 text-slate-700">
                    {ev.title}
                  </td>

                  <td className="px-4 py-2.5 text-slate-500">
                    {ev.organizer?.name || '—'}
                  </td>

                  <td className="px-4 py-2.5 text-slate-500">
                    {formatEventDate(ev.date)}
                  </td>

                  <td className="px-4 py-2.5 text-slate-500">
                    {ev.registeredCount ?? 0}/{ev.maxParticipants ?? 0}
                  </td>

                  <td className="px-4 py-2.5">
                    <StatusBadge status={ev.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
