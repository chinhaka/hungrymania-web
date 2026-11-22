'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/hungrymenia-api/public/api';

const INITIAL_FORM = {
  scope: 'branch',
  menu_item_id: '',
  title: '',
  promo_code: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order_amount: '',
  starts_at: '',
  ends_at: '',
  is_active: true,
};


function DiscountManagementContent() {
  const { user, setShowLoginModal } = useAuth();

  const [discounts, setDiscounts] = useState([]);
  const [platformPromotions, setPlatformPromotions] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [togglingPromoId, setTogglingPromoId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [editingDiscount, setEditingDiscount] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const roleId = Number(user?.role_id);
  const branchId = user?.branch_id ? Number(user.branch_id) : null;
  const hasPermission = [50, 51].includes(roleId) && Boolean(branchId);

  const loadDiscounts = useCallback(async () => {
    if (!hasPermission) return;
    try {
      const token = localStorage.getItem('hungrymenia_token') || '';
      const res = await fetch(`${API_URL}/v1/my-branch/discounts`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.status === 403 || !data.status) {
        setError(data.message || 'You are not authorized to view these discounts.');
        return;
      }

      setDiscounts(data.discounts || []);
      setPlatformPromotions(data.platform_promotions || []);
      setMenuItems(data.menu_items || []);
    } catch (err) {
      console.error('Failed to load branch discounts:', err);
      setError('Failed to load branch discounts.');
    }
  }, [hasPermission]);

  useEffect(() => {
    loadDiscounts();
  }, [loadDiscounts]);

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xs space-y-4">
          <h1 className="text-xl font-extrabold text-gray-900">Sign In Required</h1>
          <p className="text-xs text-gray-500">
            Please log in with a branch manager account to manage discounts and promos.
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

  if (!hasPermission) {
    return (
      <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xs space-y-3">
          <h1 className="text-2xl font-extrabold text-red-600">Access Denied 🔒</h1>
          <p className="text-xs text-gray-500">
            Only authenticated branch managers (role 50 or 51) with an assigned branch can access this page.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block bg-[#1B873D] text-white px-5 py-2.5 rounded-xl text-xs font-bold"
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const activePlatformPromoIds = new Set(
    discounts
      .filter((d) => d.source_type === 'hungrymania' && d.platform_promotion_id)
      .map((d) => Number(d.platform_promotion_id))
  );

  const handleTogglePlatformPromo = async (promoId) => {
    setTogglingPromoId(promoId);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('hungrymenia_token') || '';
      const res = await fetch(`${API_URL}/v1/my-branch/discounts/platform-toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ platform_promotion_id: promoId }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) {
        throw new Error(data.message || 'Failed to update HungryMania promotion.');
      }
      setSuccess(data.message);
      await loadDiscounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setTogglingPromoId(null);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEditClick = (discount) => {
    setEditingDiscount(discount);
    setFormData({
      scope: discount.scope || 'branch',
      menu_item_id: discount.menu_item_id || '',
      title: discount.title || '',
      promo_code: discount.promo_code || '',
      discount_type: discount.discount_type || 'percentage',
      discount_value: discount.discount_value || '',
      min_order_amount: discount.min_order_amount || '',
      starts_at: discount.starts_at ? String(discount.starts_at).slice(0, 16) : '',
      ends_at: discount.ends_at ? String(discount.ends_at).slice(0, 16) : '',
      is_active: discount.is_active !== undefined ? !!discount.is_active : true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (discountId) => {
    if (!confirm('Remove this discount?')) return;
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('hungrymenia_token') || '';
      const res = await fetch(`${API_URL}/v1/my-branch/discounts/${discountId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.status) {
        setSuccess('Discount removed successfully.');
        await loadDiscounts();
      } else {
        setError(data.message || 'Failed to delete discount.');
      }
    } catch (err) {
      setError('Error deleting discount.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('hungrymenia_token') || '';
      const url = editingDiscount
        ? `${API_URL}/v1/my-branch/discounts/${editingDiscount.id}`
        : `${API_URL}/v1/my-branch/discounts`;

      const payload = {
        ...formData,
        menu_item_id: formData.scope === 'menu_item' ? formData.menu_item_id : null,
        min_order_amount: formData.min_order_amount || null,
        starts_at: formData.starts_at || null,
        ends_at: formData.ends_at || null,
        ...(editingDiscount ? { _method: 'PUT' } : {}),
      };

      const res = await fetch(url, {
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
        throw new Error(data.message || 'Failed to save discount.');
      }

      setSuccess(editingDiscount ? 'Discount updated successfully! ✨' : 'Discount created successfully! 🎉');
      setEditingDiscount(null);
      setFormData(INITIAL_FORM);
      await loadDiscounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDiscountBadge = (d) => {
    const val = Number(d.discount_value || 0);
    return d.discount_type === 'fixed' ? `Rs ${val} Off` : `${val}% Off`;
  };

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#146C30] to-[#1B873D] py-7 px-8 rounded-3xl text-white shadow-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <Link href="/" className="text-xs font-semibold text-green-200 hover:text-white transition">
              &larr; Back to Home
            </Link>
            <h1 className="text-2xl font-extrabold mt-1.5">Discounts &amp; Promos</h1>
            <p className="text-green-100 text-xs mt-0.5">
              Managing offers for Branch #{branchId}
            </p>
          </div>
          <Link
            href={`/branches/${branchId}/menu/manage`}
            className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl font-bold text-xs transition shrink-0 self-start sm:self-auto"
          >
            🍽️ Manage Menu
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-xs font-semibold">
            {success}
          </div>
        )}

        {/* Section 1: HungryMania Platform Promotions */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-7">
          <div className="mb-4">
            <h2 className="text-base font-extrabold text-gray-900">⚡ HungryMania Platform Promotions</h2>
            <p className="text-xs text-gray-500">Select active system campaigns to apply to your branch</p>
          </div>

          {platformPromotions.length === 0 ? (
            <p className="text-xs text-gray-400 py-4">No active HungryMania promotions available right now.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {platformPromotions.map((promo) => {
                const isApplied = activePlatformPromoIds.has(Number(promo.id));
                return (
                  <div
                    key={promo.id}
                    className={`border rounded-2xl p-4 flex items-start justify-between gap-3 transition ${
                      isApplied ? 'border-[#1B873D] bg-green-50/50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-gray-900">{promo.title}</span>
                        <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                          {promo.discount_type === 'fixed'
                            ? `Rs ${Number(promo.discount_value)} Off`
                            : `${Number(promo.discount_value)}% Off`}
                        </span>
                        {promo.code && (
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            {promo.code}
                          </span>
                        )}
                      </div>
                      {promo.description && <p className="text-[11px] text-gray-500">{promo.description}</p>}
                    </div>

                    <button
                      type="button"
                      disabled={togglingPromoId === promo.id}
                      onClick={() => handleTogglePlatformPromo(promo.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                        isApplied
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-[#1B873D] text-white hover:bg-[#146C30]'
                      }`}
                    >
                      {togglingPromoId === promo.id ? '...' : isApplied ? 'Remove' : 'Apply'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Create / Edit Custom Branch Discount */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-7">
          <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-gray-900">
              {editingDiscount ? `Edit Discount: ${editingDiscount.title}` : '➕ Create Custom Branch Discount'}
            </h2>
            {editingDiscount && (
              <button
                type="button"
                onClick={() => {
                  setEditingDiscount(null);
                  setFormData(INITIAL_FORM);
                }}
                className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-gray-800 mb-1">Discount Applies To *</label>
                <select
                  name="scope"
                  value={formData.scope}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                >
                  <option value="branch">Entire Restaurant Branch</option>
                  <option value="menu_item">Specific Menu Item</option>
                </select>
              </div>

              {formData.scope === 'menu_item' ? (
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Select Menu Item *</label>
                  <select
                    name="menu_item_id"
                    required={formData.scope === 'menu_item'}
                    value={formData.menu_item_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  >
                    <option value="">Choose a dish</option>
                    {menuItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} (Rs {item.price})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Promo Code (Optional)</label>
                  <input
                    type="text"
                    name="promo_code"
                    value={formData.promo_code}
                    onChange={handleChange}
                    placeholder="e.g. DINE20"
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  />
                </div>
              )}

              <div className={formData.scope === 'menu_item' ? '' : 'md:col-span-2'}>
                <label className="block text-xs font-extrabold text-gray-800 mb-1">Discount Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. 20% Off Dine-in or Weekend Burger Deal"
                  className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                />
              </div>

              {formData.scope === 'menu_item' && (
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Promo Code (Optional)</label>
                  <input
                    type="text"
                    name="promo_code"
                    value={formData.promo_code}
                    onChange={handleChange}
                    placeholder="e.g. BURGER15"
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-gray-800 mb-1">Discount Type *</label>
                <select
                  name="discount_type"
                  value={formData.discount_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (Rs)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-800 mb-1">
                  Discount Value ({formData.discount_type === 'fixed' ? 'Rs' : '%'}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="discount_value"
                  required
                  value={formData.discount_value}
                  onChange={handleChange}
                  placeholder={formData.discount_type === 'fixed' ? 'e.g. 500' : 'e.g. 20'}
                  className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-800 mb-1">Minimum Order (Rs)</label>
                <input
                  type="number"
                  step="0.01"
                  name="min_order_amount"
                  value={formData.min_order_amount}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                />
              </div>

              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#1B873D] rounded border-gray-300"
                  />
                  Active Discount
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#1B873D] hover:bg-[#146C30] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
              >
                {loading ? 'Saving...' : editingDiscount ? 'Update Discount ✨' : 'Save Discount 🏷️'}
              </button>
            </div>
          </form>
        </div>

        {/* Section 3: Active Branch Discounts Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-7">
          <h2 className="text-base font-extrabold text-gray-900 mb-4">Active Discounts on Branch ({discounts.length})</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-gray-700">
                <tr>
                  <th className="p-3">Title</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Applies To</th>
                  <th className="p-3">Offer</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {discounts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-400">
                      No discounts configured for this branch yet.
                    </td>
                  </tr>
                ) : (
                  discounts.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-bold text-gray-900">
                        {d.title}
                        {d.promo_code && (
                          <span className="ml-2 text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {d.promo_code}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            d.source_type === 'hungrymania'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {d.source_type === 'hungrymania' ? 'HungryMania' : 'Branch'}
                        </span>
                      </td>
                      <td className="p-3">
                        {d.scope === 'menu_item'
                          ? `Dish: ${d.menu_item?.name || `#${d.menu_item_id}`}`
                          : 'Entire Branch'}
                      </td>
                      <td className="p-3 font-extrabold text-[#1B873D]">{formatDiscountBadge(d)}</td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            d.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {d.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2 whitespace-nowrap">
                        {d.source_type !== 'hungrymania' && (
                          <button
                            type="button"
                            onClick={() => handleEditClick(d)}
                            className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-200 transition cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(d.id)}
                          className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold hover:bg-red-200 transition cursor-pointer"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DiscountManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="animate-pulse text-gray-400 font-medium text-sm">Loading discounts &amp; promos...</div>
        </div>
      }
    >
      <DiscountManagementContent />
    </Suspense>
  );
}