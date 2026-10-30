
import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Menu,
  CalendarDays,
  X,
  LoaderCircle,
} from 'lucide-react';

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService';

function timeAgo(dateStr) {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';

  const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function formatToday() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function Navbar({ title, onMenuClick }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [readingId, setReadingId] = useState(null);

  const wrapperRef = useRef(null);
  const mountedRef = useRef(true);

  async function load({ showLoading = false } = {}) {
    if (showLoading && mountedRef.current) {
      setLoading(true);
    }

    try {
      const data = await getNotifications();

      if (!mountedRef.current) return;

      setItems(Array.isArray(data?.notifications) ? data.notifications : []);
      setUnread(Number(data?.unreadCount) || 0);
    } catch (error) {
      // Keep the dashboard usable if notifications cannot load.
      console.error('Unable to load notifications:', error);
    } finally {
      if (mountedRef.current && showLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true;

    load({ showLoading: true });

    const timer = setInterval(() => {
      load();
    }, 30000);

    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    function handleOutside(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  async function handleRead(notification) {
    if (notification.isRead || readingId) return;

    setReadingId(notification._id);

    try {
      await markNotificationRead(notification._id);
      await load();
    } catch (error) {
      console.error('Unable to mark notification as read:', error);
    } finally {
      if (mountedRef.current) {
        setReadingId(null);
      }
    }
  }

  async function handleReadAll() {
    if (markingAll || unread === 0) return;

    setMarkingAll(true);

    try {
      await markAllNotificationsRead();
      await load();
    } catch (error) {
      console.error('Unable to mark all notifications as read:', error);
    } finally {
      if (mountedRef.current) {
        setMarkingAll(false);
      }
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="flex min-h-[76px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile menu and page title */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="-ml-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 md:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="hidden h-7 w-1 rounded-full bg-blue-600 sm:block" />

              <h1 className="truncate font-display text-lg font-bold tracking-tight text-[#172b4d] sm:text-xl">
                {title || 'Dashboard'}
              </h1>
            </div>

            <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
              Welcome back! Here is your campus overview.
            </p>
          </div>
        </div>

        {/* Right: Date and notifications */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 md:flex">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-blue-700">
              <CalendarDays size={17} />
            </span>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Today
              </p>
              <p className="text-xs font-semibold text-slate-700">
                {formatToday()}
              </p>
            </div>
          </div>

          <div className="relative" ref={wrapperRef}>
            <button
              type="button"
              aria-label={
                unread > 0
                  ? `Notifications, ${unread} unread`
                  : 'Notifications'
              }
              aria-expanded={open}
              aria-haspopup="true"
              onClick={() => setOpen((previous) => !previous)}
              className={`relative grid h-11 w-11 place-items-center rounded-xl border transition ${
                open
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              <Bell size={20} strokeWidth={1.9} />

              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-[19px] min-w-[19px] place-items-center rounded-full border-2 border-white bg-blue-600 px-1 text-[9px] font-bold text-white shadow-sm">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>

            {open && (
              <section
                aria-label="Notifications panel"
                className="absolute right-0 mt-3 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
              >
                {/* Dropdown header */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-white px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-700">
                      <Bell size={19} />
                    </span>

                    <div>
                      <h2 className="text-sm font-bold text-slate-800">
                        Notifications
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {unread > 0
                          ? `${unread} unread notification${unread === 1 ? '' : 's'}`
                          : 'You are all caught up'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close notifications"
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700"
                  >
                    <X size={17} />
                  </button>
                </div>

                {/* Mark all read */}
                {unread > 0 && (
                  <div className="flex justify-end border-b border-slate-100 px-4 py-2">
                    <button
                      type="button"
                      onClick={handleReadAll}
                      disabled={markingAll}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
                    >
                      {markingAll ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <CheckCheck size={15} />
                      )}
                      {markingAll ? 'Updating...' : 'Mark all as read'}
                    </button>
                  </div>
                )}

                {/* Notification list */}
                <div className="max-h-[400px] overflow-y-auto">
                  {loading && items.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 px-4 py-12">
                      <LoaderCircle
                        size={25}
                        className="animate-spin text-blue-600"
                      />
                      <p className="text-sm text-slate-500">
                        Loading notifications...
                      </p>
                    </div>
                  ) : items.length === 0 ? (
                    <div className="flex flex-col items-center px-5 py-10 text-center">
                      <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-500">
                        <Bell size={25} />
                      </span>
                      <p className="text-sm font-semibold text-slate-700">
                        No notifications yet
                      </p>
                      <p className="mt-1 max-w-[230px] text-xs leading-relaxed text-slate-500">
                        Updates about your campus events will appear here.
                      </p>
                    </div>
                  ) : (
                    items.map((notification) => {
                      const isUnread = !notification.isRead;
                      const isReading = readingId === notification._id;

                      return (
                        <button
                          key={notification._id}
                          type="button"
                          onClick={() => handleRead(notification)}
                          disabled={isReading}
                          className={`flex w-full gap-3 border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-blue-50/60 disabled:opacity-70 ${
                            isUnread ? 'bg-blue-50/40' : 'bg-white'
                          }`}
                        >
                          <span
                            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                              isUnread ? 'bg-blue-600' : 'bg-slate-200'
                            }`}
                          />

                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span
                                className={`text-[13px] leading-5 ${
                                  isUnread
                                    ? 'font-bold text-slate-800'
                                    : 'font-medium text-slate-700'
                                }`}
                              >
                                {notification.title}
                              </span>

                              {isReading && (
                                <LoaderCircle
                                  size={14}
                                  className="shrink-0 animate-spin text-blue-600"
                                />
                              )}
                            </span>

                            <span className="mt-1 block break-words text-xs leading-relaxed text-slate-500">
                              {notification.message}
                            </span>

                            <span className="mt-2 block text-[10px] font-medium text-slate-400">
                              {timeAgo(notification.createdAt)}
                            </span>
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2.5">
                  <p className="text-center text-[10px] text-slate-400">
                    Notifications refresh automatically
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
