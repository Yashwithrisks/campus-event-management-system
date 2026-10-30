import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  Award,
  Clock3,
  ArrowRight,
  Sparkles,
  CalendarCheck,
  MapPin,
} from 'lucide-react';

import DashboardLayout from '../layouts/DashboardLayout';
import { LoadingState, EmptyState } from '../components/UiHelpers';
import { getStudentAnalytics } from '../services/analyticsService';
import { useAuth } from '../context/AuthContext';

const sidebarItems = [
  { key: 'dashboard', label: 'Dashboard', icon: CalendarDays },
  { key: 'events', label: 'Browse Events', icon: CalendarCheck },
  { key: 'registrations', label: 'My Registrations', icon: CheckCircle2 },
  { key: 'attendance', label: 'Attendance History', icon: Clock3 },
  { key: 'certificates', label: 'Certificates', icon: Award },
];

function formatDate(date) {
  if (!date) return 'Date not announced';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date not available';
  }

  return parsedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StatCard({ label, value, description, icon: Icon, tone }) {
  const tones = {
    blue: {
      icon: 'bg-blue-50 text-blue-600',
      accent: 'bg-blue-500',
    },
    green: {
      icon: 'bg-emerald-50 text-emerald-600',
      accent: 'bg-emerald-500',
    },
    purple: {
      icon: 'bg-violet-50 text-violet-600',
      accent: 'bg-violet-500',
    },
    amber: {
      icon: 'bg-amber-50 text-amber-600',
      accent: 'bg-amber-500',
    },
  };

  const colors = tones[tone] || tones.blue;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div
        className={`absolute inset-x-0 top-0 h-1 ${colors.accent}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${colors.icon}`}
        >
          <Icon size={23} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(false);

        const data = await getStudentAnalytics();

        if (isMounted) {
          setAnalytics(data?.analytics ?? {});
        }
      } catch (err) {
        console.error('Failed to load student analytics:', err);

        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleTabChange(key) {
    if (key === 'dashboard') {
      navigate('/student');
    } else {
      navigate(`/student/${key}`);
    }
  }

  const upcomingEvents = Array.isArray(analytics?.upcomingEvents)
    ? analytics.upcomingEvents
    : [];
  const completedEvents = Array.isArray(analytics?.completedEvents)
    ? analytics.completedEvents
    : [];

  return (
    <DashboardLayout
      title="Student Dashboard"
      sidebarItems={sidebarItems}
      activeTab="dashboard"
      onTabChange={handleTabChange}
    >
      <div className="space-y-7 pb-8">
        {/* Welcome banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-lg shadow-blue-900/10 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border-[35px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-24 right-28 h-48 w-48 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50">
                <Sparkles size={14} />
                Your campus, your experiences
              </div>

              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Welcome, {user?.name || 'student'}!
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-blue-100 sm:text-base">
                Discover campus events, track your participation, and
                keep all your achievements in one place.
              </p>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-blue-100">
                {user?.email && <span>{user.email}</span>}
                {user?.department && <span>{user.department}</span>}
                {user?.studentId && <span>{user.studentId}</span>}
              </div>

              <button
                type="button"
                onClick={() => navigate('/student/events')}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
              >
                Explore Events
                <ArrowRight size={17} />
              </button>
            </div>

            <div className="hidden shrink-0 sm:grid sm:h-32 sm:w-32 sm:place-items-center sm:rounded-3xl sm:border sm:border-white/15 sm:bg-white/10">
              <CalendarDays size={68} strokeWidth={1.2} />
            </div>
          </div>
        </section>

        {/* Section heading */}
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Your Activity
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                A quick overview of your campus participation.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <LoadingState />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <p className="font-semibold text-red-800">
                Unable to load your dashboard.
              </p>
              <p className="mt-1 text-sm text-red-700">
                Please check your connection and try again.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Events Registered"
                value={analytics?.eventsRegistered ?? 0}
                description="Events you've signed up for"
                icon={CalendarDays}
                tone="blue"
              />

              <StatCard
                label="Events Attended"
                value={analytics?.eventsAttended ?? 0}
                description="Events you've participated in"
                icon={CheckCircle2}
                tone="green"
              />

              <StatCard
                label="Certificates Earned"
                value={analytics?.certificatesEarned ?? 0}
                description="Achievements you've earned"
                icon={Award}
                tone="purple"
              />

              <StatCard
                label="Attendance"
                value={`${analytics?.attendancePercentage ?? 0}%`}
                description="Your event attendance rate"
                icon={Clock3}
                tone="amber"
              />
            </div>
          )}
        </section>

        {/* Upcoming events */}
        {!loading && !error && (
          <>
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Upcoming Registered Events
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Events you've registered for that are coming up.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/student/registrations')}
                className="inline-flex items-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 sm:self-auto"
              >
                My Registrations
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {upcomingEvents.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {upcomingEvents.map((ev) => (
                    <div
                      key={ev._id}
                      className="group flex gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                    >
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <CalendarDays size={22} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="break-words font-semibold text-slate-900 transition group-hover:text-blue-700">
                          {ev.title || 'Campus Event'}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 size={14} />
                            {formatDate(ev.date)}
                          </span>

                          {ev.venue && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={14} />
                              {ev.venue}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="hidden items-center sm:flex">
                        <ArrowRight
                          size={18}
                          className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                    <CalendarCheck size={27} />
                  </div>

                  <EmptyState message="No upcoming events found." />

                  <button
                    type="button"
                    onClick={() => navigate('/student/events')}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Browse Events
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </section>
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <h2 className="text-lg font-bold text-slate-900">Completed Events</h2>
              <p className="mt-1 text-sm text-slate-500">Your registrations for events that have concluded.</p>
            </div>
            <div className="p-5 sm:p-6">
              {completedEvents.length > 0 ? (
                <div className="space-y-3">
                  {completedEvents.map((event) => (
                    <div key={event._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                      <div>
                        <h3 className="font-semibold text-slate-900">{event.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(event.date)}{event.category ? ` · ${event.category}` : ''}
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <p>Registration: {event.registrationStatus}</p>
                        <p className="mt-1">Attendance: {event.attendanceStatus?.replace('_', ' ') || 'Not recorded'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No completed events yet." />
              )}
            </div>
          </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
