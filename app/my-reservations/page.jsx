'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/hungrymenia-api/public/api';

function formatBranchTitle(branch) {
  if (!branch) return 'Restaurant Branch';
  const restaurantName = branch.restaurant?.name?.trim() || branch.name?.trim() || 'Restaurant';
  const location = (branch.city?.name || branch.name || '').trim();
  const hasDistinct =
    location &&
    location.toLowerCase() !== restaurantName.toLowerCase() &&
    !restaurantName.toLowerCase().includes(location.toLowerCase());
  return hasDistinct ? `${restaurantName} - ${location}` : restaurantName;
}

function MyReservationsContent() {
  const { user, setShowLoginModal } = useAuth();

  const [reservations, setReservations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 8;

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: perPage,
    total: 0,
  });

  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [banner, setBanner] = useState(null);
  const [error, setError] = useState(null);

  const loadMyReservations = useCallback(
    async (silent = false) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hungrymenia_token') : null;
      if (!user || !token) return;

      if (!silent) setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          per_page: String(perPage),
          status: statusFilter,
        });

        const res = await fetch(`${API_URL}/v1/my/reservations?${params.toString()}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (data.status) {
          setReservations(data.reservations || []);
          if (data.pagination) setPagination(data.pagination);
        } else if (!silent) {
          setError(data.message || 'Failed to load your reservations.');
        }
      } catch (err) {
        if (!silent) {
          console.error('Failed to load customer reservations:', err);
          setError('Error loading your reservations.');
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [user, page, perPage, statusFilter]
  );

  useEffect(() => {
    loadMyReservations(false);
    if (!user) return;

    const timer = setInterval(() => {
      loadMyReservations(true);
    }, 10000);

    return () => clearInterval(timer);
  }, [loadMyReservations, user]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this pending reservation?')) return;
    setCancellingId(id);
    setError(null);
    setBanner(null);

    try {
      const token = localStorage.getItem('hungrymenia_token') || '';
      const res = await fetch(`${API_URL}/v1/my/reservations/${id}/cancel`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.status) {
        throw new Error(data.message || 'Could not cancel reservation.');
      }
      setBanner(data.message || 'Reservation cancelled.');
      await loadMyReservations(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xs space-y-4">
          <h1 className="text-xl font-extrabold text-gray-900">Sign In to View Bookings</h1>
          <p className="text-xs text-gray-500">
            Sign in to check your table reservations, approval status, and pre-selected meals.
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

  const statusBadge = (st) => {
    if (st === 'approved') return 'bg-green-100 text-green-800';
    if (st === 'rejected') return 'bg-red-100 text-red-700';
    if (st === 'cancelled') return 'bg-slate-200 text-slate-700';
    return 'bg-amber-100 text-amber-800';
  };

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#146C30] to-[#1B873D] py-7 px-8 rounded-3xl text-white shadow-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <Link href="/" className="text-xs font-semibold text-green-200 hover:text-white transition">
              &larr; Explore Restaurants
            </Link>
            <h1 className="text-2xl font-extrabold mt-1.5">My Reservations</h1>
            <p className="text-green-100 text-xs mt-0.5">
              Track live approval status, table assignments, and pre-selected foods
            </p>
          </div>

          <Link
            href="/"
            className="bg-amber-400 hover:bg-amber-300 text-gray-950 px-4 py-2 rounded-xl font-extrabold text-xs shadow-md transition shrink-0 self-start sm:self-auto"
          >
            + Book Another Table
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-[#1B873D] text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}
        {banner && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-2xl text-xs font-bold flex justify-between items-center">
            <span>✅ {banner}</span>
            <button type="button" onClick={() => setBanner(null)} className="cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-gray-400">
            Loading your reservations...
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <p className="text-xs text-gray-500">No reservations found for this filter.</p>
            <Link
              href="/"
              className="inline-block bg-[#1B873D] hover:bg-[#146C30] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition"
            >
              Browse Branches
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs font-mono font-extrabold bg-slate-100 text-gray-800 px-2.5 py-1 rounded-lg">
                      {r.reservation_code}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${statusBadge(
                        r.status
                      )}`}
                    >
                      {r.status}
                    </span>
                    <Link
                      href={`/branches/${r.restaurant_branch_id}`}
                      className="text-sm font-extrabold text-gray-900 hover:text-[#1B873D] transition"
                    >
                      {formatBranchTitle(r.branch)}
                    </Link>
                  </div>

                  <div className="text-xs text-gray-600 flex flex-wrap gap-3">
                    <span>📅 {r.reservation_date}</span>
                    <span>🕒 {r.reservation_time}</span>
                    <span>👥 {r.guests_count} Guests</span>
                    <span>
                      🪑 Table: <strong>{r.table?.table_number || 'Any Available'}</strong>
                    </span>
                  </div>

                  {r.items && r.items.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs space-y-1">
                      <div className="font-extrabold text-gray-800 text-[11px]">
                        🍽️ Pre-selected Foods (Subtotal: Rs {Number(r.food_subtotal || 0).toFixed(2)})
                      </div>
                      <ul className="space-y-0.5 text-gray-600 text-[11px]">
                        {r.items.map((row) => (
                          <li key={row.id}>
                            • {row.menu_item?.name || `Item #${row.menu_item_id}`} × {row.quantity} —{' '}
                            <span className="font-semibold text-gray-800">
                              Rs {Number(row.line_total).toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {r.decision_note && (
                    <p className="text-xs text-gray-500">
                      <span className="font-bold text-gray-700">Branch Note:</span> {r.decision_note}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/branches/${r.restaurant_branch_id}`}
                    className="bg-slate-100 hover:bg-slate-200 text-gray-800 px-3.5 py-2 rounded-xl text-xs font-bold transition"
                  >
                    View Branch
                  </Link>

                  {r.status === 'pending' && (
                    <button
                      type="button"
                      disabled={cancellingId === r.id}
                      onClick={() => handleCancel(r.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      {cancellingId === r.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
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
    </main>
  );
}

export default function MyReservationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="animate-pulse text-gray-400 font-medium text-sm">Loading my reservations...</div>
        </div>
      }
    >
      <MyReservationsContent />
    </Suspense>
  );
}