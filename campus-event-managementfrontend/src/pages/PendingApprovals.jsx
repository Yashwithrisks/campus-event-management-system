import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileCheck, Users, CalendarDays } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { LoadingState, EmptyState } from '../components/UiHelpers';
import { getEvents } from '../services/eventService';
import { approveEvent, rejectEvent } from '../services/adminService';

export default function PendingApprovals() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const data = await getEvents({ status: 'PENDING_APPROVAL' });
      setEvents(data.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id) {
    try {
      await approveEvent(id);
      setMsg('Event approved.');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to approve.');
    }
  }

  async function handleReject(id) {
    if (!reason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    try {
      await rejectEvent(id, reason);
      setMsg('Event rejected.');
      setRejectingId(null);
      setReason('');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to reject.');
    }
  }

  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'approvals', label: 'Pending Approvals', icon: FileCheck },
    { key: 'events', label: 'All Events', icon: CalendarDays },
    { key: 'users', label: 'User Management', icon: Users },
  ];

  function handleTabChange(key) {
    if (key === 'dashboard') navigate('/admin');
    else navigate(`/admin/${key}`);
  }

  return (
    <DashboardLayout
      title="Pending Approvals"
      sidebarItems={sidebarItems}
      activeTab="approvals"
      onTabChange={handleTabChange}
    >
      {msg && (
        <div className="mb-4 text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-3 py-2">
          {msg}
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : events.length === 0 ? (
        <EmptyState message="No pending approvals." />
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <div key={ev._id} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{ev.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{ev.category} • {ev.department} • {new Date(ev.date).toDateString()} • {ev.venue}</p>
                  <p className="text-xs text-slate-400 mt-1">By: {ev.organizer?.name} ({ev.organizer?.email})</p>
                  <p className="text-xs text-slate-500 mt-2 max-w-xl">{ev.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(ev._id)}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectingId(rejectingId === ev._id ? null : ev._id)}
                    className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {rejectingId === ev._id && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleReject(ev._id)}
                    className="text-xs bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Confirm Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}