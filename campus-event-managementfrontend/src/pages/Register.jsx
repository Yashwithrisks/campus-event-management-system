import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'STUDENT', department: '', studentId: '', phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      if (user.role === 'ORGANIZER') navigate('/organizer');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow border border-slate-200">
        <h1 className="text-2xl font-semibold text-slate-800 text-center">Create Account</h1>
        <p className="mt-1 text-sm text-slate-500 text-center">Join Campus Events</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input name="name" required value={form.name} onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" name="password" required minLength={6} value={form.password} onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">I am a</label>
            <select name="role" value={form.role} onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="STUDENT">Student</option>
              <option value="ORGANIZER">Organizer / Faculty</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
            <input name="department" value={form.department} onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {form.role === 'STUDENT' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Student ID</label>
              <input name="studentId" value={form.studentId} onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white rounded py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 mt-2">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}   