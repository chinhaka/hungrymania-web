'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/hungrymenia-api/public/api';

export default function ReserveTableModal({ branch, isOpen, onClose, onSuccess }) {
  const { user, setShowLoginModal } = useAuth();

  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [tableId, setTableId] = useState('');
  const [guestsCount, setGuestsCount] = useState('2');
  const [reservationDate, setReservationDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reservationTime, setReservationTime] = useState('19:00');
  const [specialNotes, setSpecialNotes] = useState('');

  // Optional food pre-selection: { [menuItemId]: quantity }
  const [selectedFoods, setSelectedFoods] = useState({});
  const [foodSearch, setFoodSearch] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setGuestName((prev) => prev || user.name || '');
      setGuestPhone((prev) => prev || user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen || !branch?.id) return;
    setError(null);
    setSelectedFoods({});
    setFoodSearch('');

    async function loadOptions() {
      setLoadingOptions(true);
      try {
        const res = await fetch(`${API_URL}/v1/branches/${branch.id}/reservation-options`, {
          headers: { Accept: 'application/json' },
        });
        const data = await res.json();
        if (data.status) {
          setTables(data.tables || []);
          setMenuItems(data.menu_items || []);
        }
      } catch (err) {
        console.error('Failed to load reservation options:', err);
      } finally {
        setLoadingOptions(false);
      }
    }

    loadOptions();
  }, [isOpen, branch?.id]);

  if (!isOpen || !branch) return null;

  const setFoodQty = (itemId, qty) => {
    const numId = Number(itemId);
    setSelectedFoods((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[numId];
      } else {
        next[numId] = qty;
      }
      return next;
    });
  };

  const filteredMenu = menuItems.filter((m) =>
    m.name.toLowerCase().includes(foodSearch.toLowerCase())
  );

  const selectedItemsList = Object.entries(selectedFoods)
    .map(([id, qty]) => {
      const dish = menuItems.find((m) => Number(m.id) === Number(id));
      if (!dish || qty <= 0) return null;
      return {
        menu_item_id: dish.id,
        name: dish.name,
        price: Number(dish.price || 0),
        quantity: qty,
        lineTotal: Number(dish.price || 0) * qty,
      };
    })
    .filter(Boolean);

  const foodSubtotal = selectedItemsList.reduce((sum, row) => sum + row.lineTotal, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('hungrymenia_token') : null;
    if (!user || !token) {
      onClose?.();
      setShowLoginModal?.(true);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        restaurant_table_id: tableId ? Number(tableId) : null,
        guest_name: guestName,
        guest_phone: guestPhone || null,
        guests_count: Number(guestsCount),
        reservation_date: reservationDate,
        reservation_time: reservationTime,
        special_notes: specialNotes || null,
        items: selectedItemsList.map((row) => ({
          menu_item_id: row.menu_item_id,
          quantity: row.quantity,
        })),
      };

      const res = await fetch(`${API_URL}/v1/branches/${branch.id}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.status) {
        throw new Error(data.message || 'Failed to submit reservation.');
      }

      onSuccess?.(data.data);
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-7 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-base font-extrabold text-gray-900">📅 Reserve a Table</h2>
            <p className="text-xs text-gray-500">
              {branch.restaurant?.name ? `${branch.restaurant.name} - ` : ''}
              {branch.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mx-7 mt-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-gray-800 mb-1">Your Name *</label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-800 mb-1">Phone Number</label>
              <input
                type="text"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="0771234567"
                className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-800 mb-1">Date *</label>
              <input
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                value={reservationDate}
                onChange={(e) => setReservationDate(e.target.value)}
                className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-800 mb-1">Time *</label>
              <input
                type="time"
                required
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
                className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-800 mb-1">Guests *</label>
              <select
                value={guestsCount}
                onChange={(e) => setGuestsCount(e.target.value)}
                className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-800 mb-1">Preferred Table (Optional)</label>
              <select
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                disabled={loadingOptions}
                className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
              >
                <option value="">Any Available Table</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.table_number} • {t.seats} Seats ({t.zone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Food Pre-Selection */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-xs font-extrabold text-gray-900">
                  🍽️ Pre-select Foods <span className="text-gray-400 font-semibold">(Optional)</span>
                </h3>
                <p className="text-[11px] text-gray-500">
                  Add dishes now so the branch can prepare them ahead of your arrival.
                </p>
              </div>
              <input
                type="text"
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
                placeholder="Search dishes..."
                className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B873D]"
              />
            </div>

            {loadingOptions ? (
              <p className="text-xs text-gray-400 py-4 text-center">Loading menu items...</p>
            ) : filteredMenu.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No menu items found.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-200/80 bg-white rounded-xl border border-slate-200 px-3">
                {filteredMenu.map((dish) => {
                  const qty = selectedFoods[Number(dish.id)] || 0;
                  return (
                    <div key={dish.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate">{dish.name}</div>
                        <div className="text-[11px] font-semibold text-[#1B873D]">
                          Rs {Number(dish.price || 0)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setFoodQty(dish.id, qty - 1)}
                          disabled={qty <= 0}
                          className="w-7 h-7 rounded-lg border border-gray-300 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-extrabold text-gray-900">{qty}</span>
                        <button
                          type="button"
                          onClick={() => setFoodQty(dish.id, qty + 1)}
                          className="w-7 h-7 rounded-lg bg-[#1B873D] hover:bg-[#146C30] text-white font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedItemsList.length > 0 && (
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-semibold text-gray-600">
                  {selectedItemsList.reduce((acc, r) => acc + r.quantity, 0)} item(s) selected
                </span>
                <span className="font-extrabold text-[#1B873D]">
                  Pre-order Subtotal: Rs {foodSubtotal.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-800 mb-1">Special Notes (Optional)</label>
            <textarea
              rows="2"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="Birthday seating, allergies, high chair needed..."
              className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="bg-slate-100 hover:bg-slate-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#1B873D] hover:bg-[#146C30] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Request Reservation (Pending)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}