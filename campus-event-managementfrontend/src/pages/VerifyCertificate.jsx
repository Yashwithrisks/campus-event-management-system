import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldX, Search } from 'lucide-react';
import { verifyCertificate } from '../services/certificateService';

export default function VerifyCertificate() {
  const [certId, setCertId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!certId.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await verifyCertificate(certId.trim());
      setResult(data);
    } catch (err) {
      setResult({ valid: false, message: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">Certificate Verification</h1>
          <p className="text-sm text-slate-500 mt-1">Verify the authenticity of a Campus Events certificate</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder="e.g. CERT-2026-000452-XXXX"
              className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
            >
              <Search size={16} /> {loading ? 'Checking...' : 'Verify'}
            </button>
          </form>

          {searched && result && (
            <div className={`mt-5 p-4 rounded-lg border ${result.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              {result.valid ? (
                <div className="flex gap-3">
                  <ShieldCheck className="text-green-600 flex-shrink-0" size={28} />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Certificate is Valid</p>
                    <div className="mt-2 text-sm text-slate-700 space-y-1">
                      <p><span className="text-slate-500">Student:</span> {result.certificate.studentName}</p>
                      <p><span className="text-slate-500">Event:</span> {result.certificate.eventName}</p>
                      <p><span className="text-slate-500">Department:</span> {result.certificate.organizer}</p>
                      <p><span className="text-slate-500">Date:</span> {new Date(result.certificate.date).toDateString()}</p>
                      <p><span className="text-slate-500">Certificate ID:</span> {result.certificate.certificateId}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <ShieldX className="text-red-600 flex-shrink-0" size={28} />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Certificate Not Found</p>
                    <p className="text-sm text-red-600 mt-1">{result.message || 'This certificate ID could not be verified.'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-400 mt-4">
          <Link to="/login" className="text-indigo-600 hover:underline">Go to Login</Link>
        </p>
      </div>
    </div>
  );
}