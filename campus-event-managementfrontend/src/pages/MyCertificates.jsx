import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, Award, Clock, Download } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { LoadingState, EmptyState } from '../components/UiHelpers';
import { getMyCertificates, getCertificateDownloadUrl } from '../services/certificateService';

export default function MyCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const data = await getMyCertificates();
        setCertificates(data.certificates);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleDownload(id) {
    const token = localStorage.getItem('token');
    fetch(getCertificateDownloadUrl(id), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'certificate.pdf';
        a.click();
      });
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
      title="My Certificates"
      sidebarItems={sidebarItems}
      activeTab="certificates"
      onTabChange={handleTabChange}
    >
      {loading ? (
        <LoadingState />
      ) : certificates.length === 0 ? (
        <EmptyState message="No certificates available." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map((cert) => (
            <div key={cert._id} className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{cert.event?.title}</p>
                  <p className="text-xs text-slate-400 mt-1">Certificate ID: {cert.certificateId}</p>
                  <p className="text-xs text-slate-400">Issued: {new Date(cert.issuedAt).toDateString()}</p>
                  <button
                    onClick={() => handleDownload(cert._id)}
                    className="mt-3 flex items-center gap-1 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700"
                  >
                    <Download size={14} /> Download PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}