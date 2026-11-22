'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/hungrymenia-api/public/api';

function NotificationsContent() {
  const { user, setShowLoginModal } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: perPage,
    total: 0,
  });

  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const loadNotifications = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hungrymenia_token') : null;
    if (!user || !token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
        filter,
      });

      const res = await fetch(`${API_URL}/v1/my/notifications/all?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (data.status) {
        setNotifications(data.notifications || []);
        setUnreadCount(Number(data.unread_count || 0));
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user, page, perPage, filter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (id) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hungrymenia_token') : null;
    if (!token) return;

    setNotifications((prev) =>
      prev.map((item) => (Number(item.id) === Number(id) ? { ...item, is_read: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await fetch(`${API_URL}/v1/my/notifications/${id}/read`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    await loadNotifications();
  };

  const markAllAsRead = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hungrymenia_token') : null;
    if (!token) return;

    await fetch(`${API_URL}/v1/my/notifications/read-all`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    await loadNotifications();
  };

  const handleViewNotification = async (item) => {
    setSelectedNotification(item);
    if (!item.is_read) {
      await markAsRead(item.id);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xs space-y-4">
          <h1 className="text-xl font-extrabold text-gray-900">Sign In to View Notifications</h1>
          <p className="text-xs text-gray-500">
            Sign in to view your reservation updates and account notifications.
          </p>
          <button
            type="button"
            onClick={() => setShowLoginModal?.(true)}
            className="w-full bg-[#1B873D] hover:bg-[#146C30] text-white py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#146C30] to-[#1B873D] py-7 px-8 rounded-3xl text-white shadow-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <Link href="/" className="text-xs font-semibold text-green-200 hover:text-white transition">
              &larr; Back to Home
            </Link>
            <h1 className="text-2xl font-extrabold mt-1.5 flex items-center gap-2.5">
              <span>All Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-amber-400 text-gray-950 px-2.5 py-0.5 rounded-full font-extrabold">
                  {unreadCount} Unread
                </span>
              )}
            </h1>
            <p className="text-green-100 text-xs mt-0.5">
              Showing {pagination.total} total notification(s)
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 self-start sm:self-auto"
            >
              ✓ Mark All as Read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFilter('all');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              filter === 'all'
                ? 'bg-[#1B873D] text-white shadow-xs'
                : 'bg-white text-gray-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All ({pagination.total})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter('unread');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              filter === 'unread'
                ? 'bg-[#1B873D] text-white shadow-xs'
                : 'bg-white text-gray-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notification List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-xs text-gray-400">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400">
              No {filter === 'unread' ? 'unread ' : ''}notifications found.
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                  item.is_read ? 'bg-white' : 'bg-green-50/50'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#1B873D] shrink-0" />
                    )}
                    <h2 className="text-sm font-extrabold text-gray-900">{item.title}</h2>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.is_read
                          ? 'bg-slate-100 text-gray-500'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {item.is_read ? 'Read' : 'Unread'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{item.message}</p>
                  {item.created_at && (
                    <p className="text-[11px] text-gray-400">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleViewNotification(item)}
                    className="bg-slate-100 hover:bg-slate-200 text-gray-800 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    👁️ View
                  </button>

                  {!item.is_read && (
                    <button
                      type="button"
                      onClick={() => markAsRead(item.id)}
                      className="bg-[#1B873D] hover:bg-[#146C30] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      ✓ Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {pagination.last_page > 1 && (
          <div className="flex justify-center items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.current_page <= 1}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              &larr; Previous
            </button>

            <span className="text-xs font-extrabold text-gray-700">
              Page {pagination.current_page} of {pagination.last_page}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
              disabled={pagination.current_page >= pagination.last_page}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>

      {/* View Notification Detail Modal */}
      {selectedNotification && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-extrabold text-gray-900">
                {selectedNotification.title}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {selectedNotification.message}
            </p>

            {selectedNotification.created_at && (
              <p className="text-[11px] text-gray-400">
                Received: {new Date(selectedNotification.created_at).toLocaleString()}
              </p>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="bg-[#1B873D] hover:bg-[#146C30] text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="animate-pulse text-gray-400 font-medium text-sm">Loading notifications...</div>
        </div>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}