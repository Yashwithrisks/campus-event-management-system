import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, Award, Clock, MapPin, X } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { LoadingState, EmptyState, StatusBadge } from '../components/UiHelpers';
import { getMyRegistrations } from '../services/registrationService';
import { cancelRegistration } from '../services/eventService';

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQr, setSelectedQr] = useState(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const data = await getMyRegistrations();
      setRegistrations(data.registrations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancel(eventId) {
    if (!confirm('Are you sure you want to cancel this registration?')) return;
    try {
      await cancelRegistration(eventId);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel registration.');
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
    if (key === 'dashboard') navigate('/student');
    else navigate(`/student/${key}`);
  }

  return (
    <DashboardLayout
      title="My Registrations"
      sidebarItems={sidebarItems}
      activeTab="registrations"
      onTabChange={handleTabChange}
    >
      {loading ? (
        <LoadingState />
      ) : registrations.length === 0 ? (
        <EmptyState message="No registrations yet." />
      ) : (
        <div className="space-y-3">
          {registrations.map((reg) => (
            <div key={reg._id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{reg.event?.title}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Calendar size={12} /> {reg.event ? new Date(reg.event.date).toDateString() : ''}
                  <MapPin size={12} className="ml-2" /> {reg.event?.venue}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {reg.event?.category && <span>Category: {reg.event.category}</span>}
                  {reg.event?.category && reg.registeredAt && <span className="mx-2">·</span>}
                  {reg.registeredAt && <span>Registered: {new Date(reg.registeredAt).toLocaleDateString()}</span>}
                </p>
                <p className="text-xs text-slate-400 mt-1">Registration ID: {reg.registrationId}</p>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={reg.status} />
                {reg.status === 'REGISTERED' && (
                  <>
                    <button
                      onClick={() => setSelectedQr(reg)}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700"
                    >
                      Show QR Pass
                    </button>
                    <button
                      onClick={() => handleCancel(reg.event._id)}
                      className="text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded hover:bg-red-50"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedQr && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setSelectedQr(null)}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedQr(null)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-700">
              <X size={18} />
            </button>
            <h3 className="text-sm font-semibold text-slate-800">{selectedQr.event?.title}</h3>
            <p className="text-xs text-slate-500 mt-1">{selectedQr.event?.venue}</p>
            <img src={selectedQr.qrCode} alt="QR Code" className="mx-auto mt-4 w-48 h-48" />
            <p className="text-xs text-slate-400 mt-3">Registration ID: {selectedQr.registrationId}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Show this QR code at the event entrance.</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}