import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, CalendarDays, ScanLine, ArrowLeft } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { LoadingState, EmptyState, StatusBadge } from '../components/UiHelpers';
import { getEventRegistrations } from '../services/eventService';

export default function EventRegistrations() {
  const { id } = useParams();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const data = await getEventRegistrations(id);
        setRegistrations(data.registrations);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

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
      title="Event Registrations"
      sidebarItems={sidebarItems}
      activeTab="events"
      onTabChange={handleTabChange}
    >
      <button onClick={() => navigate('/organizer/events')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4">
        <ArrowLeft size={16} /> Back to My Events
      </button>

      {loading ? (
        <LoadingState />
      ) : registrations.length === 0 ? (
        <EmptyState message="No registrations yet." />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">GR No.</th>
                <th className="px-4 py-2">Roll No.</th>
                <th className="px-4 py-2">Department</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Mobile</th>
                <th className="px-4 py-2">Reg. ID</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r._id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 text-slate-700">{r.participant?.name || r.student?.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{r.participant?.grNo || '-'}</td>
                  <td className="px-4 py-2.5 text-slate-500">{r.participant?.rollNo || '-'}</td>
                  <td className="px-4 py-2.5 text-slate-500">{r.participant?.department || r.student?.department}</td>
                  <td className="px-4 py-2.5 text-slate-500">{r.participant?.email || r.student?.email}</td>
                  <td className="px-4 py-2.5 text-slate-500">{r.participant?.mobile || '-'}</td>
                  <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{r.registrationId}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}