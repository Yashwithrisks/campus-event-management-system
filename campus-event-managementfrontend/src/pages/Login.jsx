import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, QrCode, ShieldCheck, Ticket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@campus.edu', password: 'Admin@123' },
  { label: 'Organizer', email: 'organizer@campus.edu', password: 'Organizer@123' },
  { label: 'Student', email: 'student@campus.edu', password: 'Student@123' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function fillDemo(account) {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'ORGANIZER') navigate('/organizer');
      else navigate('/student');
    } catch (err) {
      if (!err.response) {
        setError("Can't reach the server. Check that the backend is running on port 5000.");
      } else {
        setError(err.response.data?.message || 'Login failed. Check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30';

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      {/* Brand side */}
      <aside className="hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-mark text-ink">
            <Ticket size={20} />
          </span>
          <span className="font-display text-xl font-semibold">Campus Events</span>
        </div>

        <div>
          <h2 className="max-w-md font-display text-4xl font-semibold leading-tight xl:text-5xl">
            From event approval to verified certificate, in one place.
          </h2>
          <p className="mt-4 max-w-sm text-slate-300">
            Organizers publish events, students register in one step, and a QR pass handles
            attendance at the door.
          </p>

          <div className="mt-10 flex max-w-sm -rotate-2 overflow-hidden rounded-xl bg-white text-ink shadow-2xl">
            <div className="flex w-20 flex-col items-center justify-center bg-mark px-3 py-4">
              <span className="font-display text-3xl font-bold leading-none">23</span>
              <span className="text-sm font-medium">Sep</span>
            </div>
            <div className="relative flex-1 border-l-2 border-dashed border-slate-300 p-4">
              <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-ink" />
              <span className="absolute -bottom-2.5 -left-2.5 h-5 w-5 rounded-full bg-ink" />
              <p className="font-display text-base font-semibold">Web Development Workshop</p>
              <p className="mt-1 text-xs text-slate-500">Lab 204, 2:00 PM</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                <QrCode size={28} />
                Show this pass at the entrance
              </div>
            </div>
          </div>
        </div>

        <p className="flex items-center gap-2 text-sm text-slate-400">
          <ShieldCheck size={16} />
          Every certificate can be verified publicly with its ID.
        </p>
      </aside>

      {/* Form side */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-mark text-ink">
              <Ticket size={20} />
            </span>
            <span className="font-display text-xl font-semibold text-ink">Campus Events</span>
          </div>

          <h1 className="font-display text-3xl font-semibold text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage or join campus events.</p>

          <div className="mt-6">
            <p className="mb-2 text-xs font-medium text-slate-500">Try a demo account</p>
            <div className="flex gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  type="button"
                  key={a.label}
                  onClick={() => fillDemo(a)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@campus.edu"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            New here?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:underline">
              Create an account
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-slate-500">
            <Link to="/verify" className="font-medium text-indigo-600 hover:underline">
              Verify a certificate
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}