'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/hungrymenia-api/public/api';

export function CustomerNotificationsBell({ user }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hungrymenia_token') : null;
    if (!user || !token) return;
    try {
      const res = await fetch(`${API_URL}/v1/my/notifications`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.status) {
        // Strictly keep the latest 10 notifications inside the navbar dropdown
        setNotifications((data.notifications || []).slice(0, 10));
        setUnreadCount(Number(data.unread_count || 0));
      }
    } catch (_) {}
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    if (!user) return;
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications, user]);

  if (!user) return null;

  const markRead = async (id) => {
    const token = localStorage.getItem('hungrymenia_token') || '';
    setNotifications((prev) =>
      prev.map((n) => (Number(n.id) === Number(id) ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await fetch(`${API_URL}/v1/my/notifications/${id}/read`, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    fetchNotifications();
  };

  const markAllRead = async () => {
    const token = localStorage.getItem('hungrymenia_token') || '';
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    await fetch(`${API_URL}/v1/my/notifications/read-all`, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    fetchNotifications();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-sm transition cursor-pointer"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
            <span className="text-xs font-extrabold text-gray-900">
              Recent Notifications ({notifications.length})
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-bold text-[#1B873D] hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.is_read) markRead(n.id);
                  }}
                  className={`px-4 py-3 text-xs cursor-pointer transition ${
                    n.is_read ? 'bg-white text-gray-500 hover:bg-slate-50/60' : 'bg-green-50/70 text-gray-900 hover:bg-green-50'
                  }`}
                >
                  <div className="font-extrabold flex items-center justify-between gap-2">
                    <span className="truncate">{n.title}</span>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#1B873D] shrink-0" />}
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                </div>
              ))
            )}
          </div>

          {/* View More Footer Button */}
          <div className="border-t border-slate-100 bg-slate-50 p-2.5">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="w-full block text-center bg-white hover:bg-slate-100 text-[#1B873D] border border-slate-200 py-2 rounded-xl text-xs font-extrabold transition"
            >
              View More &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}