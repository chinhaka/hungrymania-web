'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/hungrymenia-api/public/api';

function BranchReservationsContent() {
  const { user, setShowLoginModal } = useAuth();

  const [reservations, setReservations] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [statusFilter, setStatusFilter] = useState('pending');
  const [decisionNotes, setDecisionNotes] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);

  const roleId = Number(user?.role_id);
  const branchId = user?.branch_id ? Number(user.branch_id) : null;
  const hasPermission = [50, 51, 52].includes(roleId) && Boolean(branchId);

  const loadReservations = useCallback(
    async (silent = false) => {
      if (!hasPermission) return;
      try {
        const token = localStorage.getItem('hungrymenia_token') || '';
        const res = await fetch(
          `${API_URL}/v1/my-branch/reservations?status=${encodeURIComponent(statusFilter)}`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (res.ok && data.status) {
          setReservations(data.reservations || []);
          if (data.counts) setCounts(data.counts);
          setLastSynced(new Date().toLocaleTimeString());
        } else if (!silent) {
          setError(data.message || 'Failed to load reservations.');
        }
      } catch (err) {
        if (!silent) {
          console.error('Failed to load reservations:', err);
          setError('Error loading branch reservations.');
        }
      }
    },
    [hasPermission, statusFilter]
  );

  useEffect(() => {
    loadReservations(false);
    if (!hasPermission) return;

    const timer = setInterval(() => {
      loadReservations(true);
    }, 8000);

    return () => clearInterval(timer);
  }, [loadReservations, hasPermission]);

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xs space-y-4">
          <h1 className="text-xl font-extrabold text-gray-900">Sign In Required</h1>
          <p className="text-xs text-gray-500">Log in with a branch account (50, 51, or 52) to view reservations.</p>
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

  if (!hasPermission) {
    return (
      <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xs space-y-3">
          <h1 className="text-2xl font-extrabold text-red-600">Access Denied 🔒</h1>
          <p className="text-xs text-gray-500">
            Only branch owners (50), managers (51), and staff (52) with an assigned branch can manage reservations.
          </p>
          <Link href="/" className="inline-block bg-[#1B873D] text-white px-5 py-2.5 rounded-xl text-xs font-bold">
            &larr; Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const handleDecision = async (reservationId, nextStatus) => {
    setBusyId(reservationId);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('hungrymenia_token') || '';
      const res = await fetch(`${API_URL}/v1/my-branch/reservations/${reservationId}/decide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: nextStatus,
          decision_note: decisionNotes[reservationId] || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.status) {
        throw new Error(data.message || 'Failed to update reservation.');
      }

      setSuccess(data.message || `Reservation ${nextStatus}.`);
      await loadReservations(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const badgeStyle = (st) => {
    if (st === 'approved') return 'bg-green-100 text-green-800';
    if (st === 'rejected') return 'bg-red-100 text-red-700';
    if (st === 'cancelled') return 'bg-slate-200 text-slate-700';
    return 'bg-amber-100 text-amber-800';
  };

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#146C30] to-[#1B873D] py-7 px-8 rounded-3xl text-white shadow-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <Link href="/" className="text-xs font-semibold text-green-200 hover:text-white transition">
              &larr; Back to Home
            </Link>
            <h1 className="text-2xl font-extrabold mt-1.5 flex items-center gap-2.5">
              <span>Live Table Reservations</span>
              <span className="text-[11px] bg-white/15 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                Live Sync
              </span>
            </h1>
            <p className="text-green-100 text-xs mt-0.5">
              Branch #{branchId} • {lastSynced ? `Last updated: ${lastSynced}` : 'Syncing...'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadReservations(false)}
            className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 self-start sm:self-auto"
          >
            🔄 Refresh Now
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'pending', label: `Pending (${counts.pending})` },
            { key: 'approved', label: `Approved (${counts.approved})` },
            { key: 'rejected', label: `Rejected (${counts.rejected})` },
            { key: 'all', label: `All (${counts.all})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
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
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-xs font-semibold flex justify-between items-center">
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess(null)} className="font-bold cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Reservations List */}
        <div className="space-y-4">
          {reservations.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-gray-400">
              No {statusFilter === 'all' ? '' : statusFilter} reservations found for Branch #{branchId}.
            </div>
          ) : (
            reservations.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs font-mono font-extrabold bg-slate-100 text-gray-800 px-2.5 py-1 rounded-lg">
                      {r.reservation_code}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${badgeStyle(r.status)}`}>
                      {r.status}
                    </span>
                    <span className="text-xs font-extrabold text-gray-900">{r.guest_name}</span>
                    {r.guest_phone && <span className="text-xs text-gray-500">• 📞 {r.guest_phone}</span>}
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
                            <span className="font-semibold text-gray-800">Rs {Number(row.line_total).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {r.special_notes && (
                    <p className="text-xs text-gray-500">
                      <span className="font-bold text-gray-700">Note:</span> {r.special_notes}
                    </p>
                  )}

                  {r.decision_note && (
                    <p className="text-xs text-gray-500">
                      <span className="font-bold text-gray-700">Branch Reply:</span> {r.decision_note}
                    </p>
                  )}
                </div>

                {/* Approve / Reject Controls */}
                {r.status === 'pending' && (
                  <div className="w-full lg:w-72 shrink-0 space-y-2.5 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-5">
                    <input
                      type="text"
                      value={decisionNotes[r.id] || ''}
                      onChange={(e) =>
                        setDecisionNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                      placeholder="Optional note for customer..."
                      className="w-full px-3 py-2 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B873D]"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => handleDecision(r.id, 'approved')}
                        className="flex-1 bg-[#1B873D] hover:bg-[#146C30] text-white py-2 rounded-xl font-extrabold text-xs transition cursor-pointer"
                      >
                        {busyId === r.id ? '...' : '✓ Approve'}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => handleDecision(r.id, 'rejected')}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-extrabold text-xs transition cursor-pointer"
                      >
                        {busyId === r.id ? '...' : '✕ Reject'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

export default function BranchReservationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="animate-pulse text-gray-400 font-medium text-sm">Loading reservations...</div>
        </div>
      }
    >
      <BranchReservationsContent />
    </Suspense>
  );
}