'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/hungrymenia-api/public/api';

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  role_id: '52',
  password: '',
  password_confirmation: '',
  is_active: true,
};

function BranchTeamContent() {
  const { user, setShowLoginModal } = useAuth();

  const [members, setMembers] = useState([]);
  const [quota, setQuota] = useState({
    manager_count: 0,
    manager_limit: 1,
    manager_slots_left: 1,
    staff_count: 0,
    staff_limit: 2,
    staff_slots_left: 2,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const roleId = Number(user?.role_id);
  const branchId = user?.branch_id ? Number(user.branch_id) : null;
  const hasPermission = [50, 51].includes(roleId) && Boolean(branchId);

  const loadTeam = useCallback(async () => {
    if (!hasPermission) return;
    try {
      const token = localStorage.getItem('hungrymenia_token') || '';
      const res = await fetch(`${API_URL}/v1/my-branch/team`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.status) {
        setMembers(data.members || []);
        if (data.quota) setQuota(data.quota);
      } else {
        setError(data.message || 'Unable to load branch team.');
      }
    } catch (err) {
      console.error('Failed to load branch team:', err);
      setError('Failed to load branch team.');
    }
  }, [hasPermission]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xs space-y-4">
          <h1 className="text-xl font-extrabold text-gray-900">Sign In Required</h1>
          <p className="text-xs text-gray-500">Log in with a branch manager account to manage branch staff.</p>
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
            Only branch owners (role 50) or managers (role 51) with an assigned branch can manage team accounts.
          </p>
          <Link href="/" className="inline-block bg-[#1B873D] text-white px-5 py-2.5 rounded-xl text-xs font-bold">
            &larr; Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const allSlotsFull = quota.manager_slots_left === 0 && quota.staff_slots_left === 0;

  const openCreateModal = () => {
    if (allSlotsFull) return;
    setError(null);
    setEditingMember(null);
    const defaultRole = quota.staff_slots_left > 0 ? '52' : '51';
    setFormData({ ...INITIAL_FORM, role_id: defaultRole });
    setIsModalOpen(true);
  };

  const handleEditClick = (member) => {
    setError(null);
    setEditingMember(member);
    setFormData({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      role_id: String(member.role_id || '52'),
      password: '',
      password_confirmation: '',
      is_active: member.is_active !== undefined ? !!member.is_active : true,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (loading) return;
    setIsModalOpen(false);
    setEditingMember(null);
    setFormData(INITIAL_FORM);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDelete = async (memberId) => {
    if (!confirm('Remove this team member account? They will immediately lose branch access.')) return;
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('hungrymenia_token') || '';
      const res = await fetch(`${API_URL}/v1/my-branch/team/${memberId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.status) {
        setSuccess(data.message || 'Team member removed.');
        if (data.quota) setQuota(data.quota);
        await loadTeam();
      } else {
        setError(data.message || 'Failed to delete account.');
      }
    } catch (err) {
      setError('Error deleting team member.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('hungrymenia_token') || '';
      const url = editingMember
        ? `${API_URL}/v1/my-branch/team/${editingMember.id}`
        : `${API_URL}/v1/my-branch/team`;

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        role_id: Number(formData.role_id),
        is_active: formData.is_active,
        ...(formData.password
          ? {
              password: formData.password,
              password_confirmation: formData.password_confirmation,
            }
          : {}),
        ...(editingMember ? { _method: 'PUT' } : {}),
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
        throw new Error(data.message || 'Failed to save team member.');
      }

      setSuccess(data.message || 'Team member saved successfully!');
      if (data.quota) setQuota(data.quota);
      closeModal();
      await loadTeam();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const canSelectManager =
    quota.manager_slots_left > 0 || (editingMember && Number(editingMember.role_id) === 51);
  const canSelectStaff =
    quota.staff_slots_left > 0 || (editingMember && Number(editingMember.role_id) === 52);

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#146C30] to-[#1B873D] py-7 px-8 rounded-3xl text-white shadow-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <Link href="/" className="text-xs font-semibold text-green-200 hover:text-white transition">
              &larr; Back to Home
            </Link>
            <h1 className="text-2xl font-extrabold mt-1.5">Branch Team &amp; Staff Accounts</h1>
            <p className="text-green-100 text-xs mt-0.5">
              Branch #{branchId} • Allowed up to 1 Manager (Role 51) &amp; 2 Staff (Role 52)
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={allSlotsFull}
            className="bg-amber-400 hover:bg-amber-300 disabled:bg-white/20 disabled:text-white/60 disabled:cursor-not-allowed text-gray-950 px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition cursor-pointer shrink-0 self-start sm:self-auto"
          >
            {allSlotsFull ? 'All 3 Slots Filled' : '+ Add Team Member'}
          </button>
        </div>

        {/* Quota Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase">Branch Manager (Role 51)</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">
                {quota.manager_count} <span className="text-sm font-semibold text-gray-400">/ {quota.manager_limit}</span>
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {quota.manager_slots_left > 0
                  ? `${quota.manager_slots_left} manager slot available`
                  : 'Manager slot filled'}
              </p>
            </div>
            <span className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
              👔
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase">Branch Staff (Role 52)</p>
              <p className="text-2xl font-extrabold text-[#1B873D] mt-1">
                {quota.staff_count} <span className="text-sm font-semibold text-gray-400">/ {quota.staff_limit}</span>
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {quota.staff_slots_left > 0
                  ? `${quota.staff_slots_left} staff ${quota.staff_slots_left === 1 ? 'slot' : 'slots'} available`
                  : 'All 2 staff slots filled'}
              </p>
            </div>
            <span className="w-11 h-11 rounded-2xl bg-green-50 text-[#1B873D] flex items-center justify-center text-xl">
              🧑‍🍳
            </span>
          </div>
        </div>

        {error && !isModalOpen && (
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

        {/* Team Members Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-7">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-extrabold text-gray-900">Branch Team Accounts ({members.length} / 3)</h2>
            {!allSlotsFull && (
              <button
                type="button"
                onClick={openCreateModal}
                className="bg-[#1B873D] hover:bg-[#146C30] text-white px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                ➕ Create Account
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-gray-700">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-400">
                      No manager or staff accounts created for this branch yet.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-extrabold text-gray-900">
                        {m.name}
                        {Number(m.id) === Number(user?.id) && (
                          <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                            You
                          </span>
                        )}
                      </td>
                      <td className="p-3">{m.email}</td>
                      <td className="p-3">{m.phone || '—'}</td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            Number(m.role_id) === 51
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {Number(m.role_id) === 51 ? 'Manager (51)' : 'Staff (52)'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            m.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {m.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleEditClick(m)}
                          className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-200 transition cursor-pointer"
                        >
                          Edit
                        </button>
                        {Number(m.id) !== Number(user?.id) && (
                          <button
                            type="button"
                            onClick={() => handleDelete(m.id)}
                            className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold hover:bg-red-200 transition cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-100 px-7 py-5 flex justify-between items-center">
              <h2 className="text-base font-extrabold text-gray-900">
                {editingMember ? `Edit Account: ${editingMember.name}` : '👤 Create Branch Team Account'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
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

            <form onSubmit={handleSubmit} className="p-7 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-gray-800 mb-1">Account Role *</label>
                <select
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                >
                  <option value="52" disabled={!canSelectStaff}>
                    Staff Account (Role 52) — {quota.staff_slots_left} of 2 left
                  </option>
                  <option value="51" disabled={!canSelectManager}>
                    Branch Manager (Role 51) — {quota.manager_slots_left} of 1 left
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-800 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Kasun Perera"
                  className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="staff@branch.com"
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0771234567"
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">
                    {editingMember ? 'New Password (Optional)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    required={!editingMember}
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">
                    Confirm Password {editingMember ? '' : '*'}
                  </label>
                  <input
                    type="password"
                    name="password_confirmation"
                    required={!editingMember || Boolean(formData.password)}
                    minLength={6}
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#1B873D] rounded border-gray-300"
                />
                Account Active (can log in)
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="bg-slate-100 hover:bg-slate-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#1B873D] hover:bg-[#146C30] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
                >
                  {loading ? 'Saving...' : editingMember ? 'Update Account ✨' : 'Create Account 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function BranchTeamPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="animate-pulse text-gray-400 font-medium text-sm">Loading branch team...</div>
        </div>
      }
    >
      <BranchTeamContent />
    </Suspense>
  );
}