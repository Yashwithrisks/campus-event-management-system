
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  Ticket,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const ROLE_LABEL = {
  STUDENT: 'Student',
  ORGANIZER: 'Event Organizer',
  ADMIN: 'Administrator',
};

function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('') || 'U'
  );
}

export default function DashboardLayout({
  title,
  sidebarItems = [],
  activeTab,
  onTabChange,
  children,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleLogout() {
    setDrawerOpen(false);
    logout();
    navigate('/login');
  }

  function pick(key) {
    setDrawerOpen(false);
    onTabChange(key);
  }

  const sidebar = (
    <div className="flex h-full flex-col overflow-hidden bg-[#10213f] text-slate-300">
      {/* Brand */}
      <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-white/[0.08] px-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-950/30">
          <Ticket size={23} strokeWidth={2.3} />
        </span>

        <div className="min-w-0">
          <p className="font-display text-[16px] font-bold tracking-tight text-white">
            Campus Events
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300">
            Event Management
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation menu"
          className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white md:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <div className="px-5 pb-2 pt-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Workspace
        </p>
      </div>

      <nav
        aria-label="Dashboard navigation"
        className="flex-1 space-y-1 overflow-y-auto px-3 pb-5"
      >
        {sidebarItems.map((item) => {
          const active = activeTab === item.key;
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => pick(item.key)}
              aria-current={active ? 'page' : undefined}
              className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3.5 py-3 text-left text-[13px] transition-all duration-200 ${
                active
                  ? 'bg-blue-600 font-semibold text-white shadow-lg shadow-blue-950/30'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {active && (
                <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-blue-200" />
              )}

              {Icon && (
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors ${
                    active
                      ? 'bg-white/15 text-white'
                      : 'text-slate-400 group-hover:bg-white/[0.06] group-hover:text-blue-300'
                  }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                </span>
              )}

              <span className="min-w-0 flex-1 truncate">{item.label}</span>

              {active && (
                <ChevronRight
                  size={16}
                  className="shrink-0 text-blue-100"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Upgrade / info panel */}
      <div className="mx-3 mb-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles size={16} className="text-blue-300" />
          <span className="text-xs font-semibold text-white">
            Campus Connect
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Discover events, manage registrations and celebrate campus life.
        </p>
      </div>

      {/* User profile and logout */}
      <div className="shrink-0 border-t border-white/[0.08] p-3">
        <div className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/[0.04]">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 text-sm font-bold text-white shadow-md">
            {initials(user?.name)}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white">
              {user?.name || 'Campus User'}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              {ROLE_LABEL[user?.role] || user?.role || 'Member'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-red-500/15 hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f8ff]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] md:block">
        {sidebar}
      </aside>

      {/* Mobile navigation drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="absolute inset-0 h-full w-full cursor-default bg-slate-950/55 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
          />

          <aside className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="min-h-screen md:pl-[260px]">
        <Navbar
          title={title}
          onMenuClick={() => setDrawerOpen(true)}
        />

        <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
