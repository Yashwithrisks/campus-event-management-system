import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { LayoutDashboard, PlusCircle, CalendarDays, ScanLine, CheckCircle2, XCircle } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getMyEvents } from '../services/eventService';
import { scanAttendance } from '../services/attendanceService';

export default function QrScanner() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState('');
  const [result, setResult] = useState(null);
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const data = await getMyEvents();
      const approved = data.events.filter((e) => ['APPROVED', 'ONGOING'].includes(e.status));
      setEvents(approved);
    }
    load();
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  async function submitScan(payload) {
    try {
      const res = await scanAttendance({ ...payload, eventId: selectedEvent });
      setResult({ success: true, data: res.attendance });
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Scan failed.' });
    }
  }

  async function startCamera() {
    if (!selectedEvent) {
      alert('Please select an event first.');
      return;
    }
    setResult(null);
    setScanning(true);
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          await scanner.stop();
          setScanning(false);
          submitScan({ qrText: decodedText });
        },
        () => {}
      );
    } catch (err) {
      alert('Could not access camera. Use manual entry instead.');
      setScanning(false);
    }
  }

  async function stopCamera() {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
    }
    setScanning(false);
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!selectedEvent) {
      alert('Please select an event first.');
      return;
    }
    setResult(null);
    submitScan({ registrationId: manualId });
    setManualId('');
  }

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
      title="QR Scanner"
      sidebarItems={sidebarItems}
      activeTab="scanner"
      onTabChange={handleTabChange}
    >
      <div className="max-w-md">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Event</label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Select an approved event --</option>
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>{ev.title}</option>
            ))}
          </select>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Scan Attendance</h3>

          {!scanning ? (
            <button
              onClick={startCamera}
              className="w-full bg-indigo-600 text-white text-sm font-medium py-2.5 rounded hover:bg-indigo-700"
            >
              Start Camera Scan
            </button>
          ) : (
            <>
              <div id="qr-reader" className="w-full rounded overflow-hidden" />
              <button
                onClick={stopCamera}
                className="w-full mt-3 border border-slate-300 text-slate-600 text-sm py-2 rounded hover:bg-slate-50"
              >
                Stop Camera
              </button>
            </>
          )}

          <div className="mt-5 pt-5 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-2">Or enter Registration ID manually</p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="REG-2026-000123"
                className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button type="submit" className="bg-slate-700 text-white text-sm px-4 py-2 rounded hover:bg-slate-800">
                Mark
              </button>
            </form>
          </div>
        </div>

        {result && (
          <div className={`mt-4 p-4 rounded-lg border flex items-start gap-3 ${
            result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            {result.success ? <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} /> : <XCircle className="text-red-600 flex-shrink-0" size={20} />}
            <div className="text-sm">
              {result.success ? (
                <>
                  <p className="font-medium text-green-800">Attendance marked!</p>
                  <p className="text-green-700 text-xs mt-1">{result.data.studentName} — {result.data.eventName}</p>
                </>
              ) : (
                <p className="text-red-700">{result.message}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}