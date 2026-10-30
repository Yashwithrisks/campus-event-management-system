import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileCheck, Users, CalendarDays } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { StatCard, LoadingState } from '../components/UiHelpers';
import { getAdminAnalytics } from '../services/analyticsService';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const data = await getAdminAnalytics();
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
      title="Admin Dashboard"
      sidebarItems={sidebarItems}
      activeTab="dashboard"
      onTabChange={handleTabChange}
    >
      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Users" value={analytics?.totalUsers ?? 0} icon={Users} color="indigo" />
            <StatCard label="Total Events" value={analytics?.totalEvents ?? 0} icon={CalendarDays} color="indigo" />
            <StatCard label="Pending Approvals" value={analytics?.pendingApprovals ?? 0} icon={FileCheck} color="amber" />
            <StatCard label="Certificates Generated" value={analytics?.certificatesGenerated ?? 0} icon={FileCheck} color="green" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Students" value={analytics?.totalStudents ?? 0} icon={Users} color="indigo" />
            <StatCard label="Total Organizers" value={analytics?.totalOrganizers ?? 0} icon={Users} color="indigo" />
            <StatCard label="Total Registrations" value={analytics?.totalRegistrations ?? 0} icon={CalendarDays} color="indigo" />
            <StatCard label="Total Attendance" value={analytics?.totalAttendance ?? 0} icon={FileCheck} color="green" />
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Events by Category</h2>
            {analytics?.categoryBreakdown?.length ? (
              <div className="space-y-2">
                {analytics.categoryBreakdown.map((c) => (
                  <div key={c._id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{c._id}</span>
                    <span className="font-medium text-slate-800">{c.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No data yet.</p>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}