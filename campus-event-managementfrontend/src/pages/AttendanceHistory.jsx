import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, Award, Clock, MapPin } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { LoadingState, EmptyState } from '../components/UiHelpers';
import { getMyAttendance } from '../services/attendanceService';

export default function AttendanceHistory() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const data = await getMyAttendance();
        setAttendance(data.attendance);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard', icon: Calendar },
    { key: 'events', label: 'Browse Events', icon: Calendar },
    { key: 'registrations', label: 'My Registrations', icon: CheckCircle },
    { key: 'attendance', label: 'Attendance History', icon: Clock },
    { key: 'certificates', label: 'Certificates', icon: Award },
  ];

  function handleTabChange(key) {
    if (key === 'dashboard') navigate('/student');
    else navigate(`/student/${key}`);
  }

  return (
    <DashboardLayout
      title="Attendance History"
      sidebarItems={sidebarItems}
      activeTab="attendance"
      onTabChange={handleTabChange}
    >
      {loading ? (
        <LoadingState />
      ) : attendance.length === 0 ? (
        <EmptyState message="No attendance records yet." />
      ) : (
        <div className="space-y-3">
          {attendance.map((a) => (
            <div key={a._id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">{a.event?.title}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin size={12} /> {a.event?.venue}
                </p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Calendar size={12} /> Event date: {a.event?.date ? new Date(a.event.date).toLocaleDateString() : 'Date unavailable'}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-medium ${a.status === 'PRESENT' ? 'text-green-600' : 'text-slate-500'}`}>{a.status}</p>
                <p className="text-xs text-slate-400">Recorded {new Date(a.markedAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}