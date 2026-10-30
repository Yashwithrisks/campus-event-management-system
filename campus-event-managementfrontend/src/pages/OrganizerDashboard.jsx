import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, CalendarDays, ScanLine, FileText } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { StatCard, LoadingState } from '../components/UiHelpers';
import { getOrganizerAnalytics } from '../services/analyticsService';

export default function OrganizerDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const data = await getOrganizerAnalytics();
        setAnalytics(data.analytics);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
      title="Organizer Dashboard"
      sidebarItems={sidebarItems}
      activeTab="dashboard"
      onTabChange={handleTabChange}
    >
      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Events" value={analytics?.totalEvents ?? 0} icon={CalendarDays} color="indigo" />
            <StatCard label="Pending Approvals" value={analytics?.pendingApprovals ?? 0} icon={FileText} color="amber" />
            <StatCard label="Approved Events" value={analytics?.approvedEvents ?? 0} icon={CalendarDays} color="green" />
            <StatCard label="Total Registrations" value={analytics?.totalRegistrations ?? 0} icon={LayoutDashboard} color="indigo" />
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Event-wise Statistics</h2>
            {analytics?.eventWise?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                      <th className="pb-2">Event</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Registrations</th>
                      <th className="pb-2">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.eventWise.map((e) => (
                      <tr key={e.eventId} className="border-b border-slate-50">
                        <td className="py-2 text-slate-700">{e.title}</td>
                        <td className="py-2 text-slate-500">{e.status}</td>
                        <td className="py-2 text-slate-500">{e.registrations}</td>
                        <td className="py-2 text-slate-500">{e.attendance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No events created yet.</p>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}