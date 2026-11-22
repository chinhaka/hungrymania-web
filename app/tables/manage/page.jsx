'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/hungrymenia-api/public/api';
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'http://localhost/hungrymenia-api/public/uploads/';

const INITIAL_FORM = {
  table_number: '',
  seats: '4',
  zone: 'Indoor',
  shape: 'Square',
  min_spend: '',
  description: '',
  is_available: true,
  is_active: true,
};

function SingleTableImageUploader({ image, onImageChange }) {
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (fileList) => {
    const file = Array.from(fileList || []).find((f) => f.type.startsWith('image/'));
    if (file) {
      onImageChange(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length > 0) {
      handleFile(e.dataTransfer.files);
    }
  };

  const previewUrl = image
    ? typeof image === 'string'
      ? image.startsWith('http')
        ? image
        : `${IMAGE_BASE_URL}${image}`
      : URL.createObjectURL(image)
    : null;

  return (
    <div className="space-y-2">
      <label className="block text-xs font-extrabold text-gray-800 tracking-wide">
        Table Photo <span className="text-gray-400 font-normal">(1 Image)</span>
      </label>

      {!previewUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          className={`border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer ${
            dragOver ? 'border-[#1B873D] bg-green-50/80' : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files)}
            className="hidden"
            id="table-image-input"
          />
          <label htmlFor="table-image-input" className="cursor-pointer flex flex-col items-center justify-center space-y-1.5">
            <div className="w-9 h-9 rounded-full bg-green-100 text-[#1B873D] flex items-center justify-center font-bold text-base">
              🪑
            </div>
            <p className="text-xs font-semibold text-gray-700">
              Drag &amp; drop a photo of this table, or <span className="text-[#1B873D] underline">browse</span>
            </p>
            <p className="text-[10px] text-gray-400">PNG, JPG, WEBP up to 3MB</p>
          </label>
        </div>
      ) : (
        <div className="relative w-full sm:w-56 h-36 rounded-2xl overflow-hidden border border-gray-300 group bg-slate-100">
          <img src={previewUrl} alt="Table preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
            <label
              htmlFor="table-image-replace"
              className="bg-white text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 cursor-pointer"
            >
              Replace
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files)}
              className="hidden"
              id="table-image-replace"
            />
            <button
              type="button"
              onClick={() => onImageChange(null)}
              className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 cursor-pointer"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TableManagementContent() {
  const { user, setShowLoginModal } = useAuth();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [image, setImage] = useState(null); // File | string | null
  const [hadExistingImage, setHadExistingImage] = useState(false);

  const roleId = Number(user?.role_id);
  const branchId = user?.branch_id ? Number(user.branch_id) : null;
  const hasPermission = [50, 51].includes(roleId) && Boolean(branchId);

  const loadTables = useCallback(async () => {
    if (!hasPermission) return;
    try {
      const token = localStorage.getItem('hungrymenia_token') || '';
      const res = await fetch(`${API_URL}/v1/my-branch/tables`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.status) {
        setTables(data.tables || []);
      } else {
        setError(data.message || 'Unable to load tables.');
      }
    } catch (err) {
      console.error('Failed to load tables:', err);
      setError('Failed to load branch tables.');
    }
  }, [hasPermission]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xs space-y-4">
          <h1 className="text-xl font-extrabold text-gray-900">Sign In Required</h1>
          <p className="text-xs text-gray-500">Log in as a branch manager to set up and manage dining tables.</p>
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
            Only branch managers (role 50 or 51) with an assigned branch can manage tables.
          </p>
          <Link href="/" className="inline-block bg-[#1B873D] text-white px-5 py-2.5 rounded-xl text-xs font-bold">
            &larr; Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const openCreateModal = () => {
    setError(null);
    setEditingTable(null);
    setFormData(INITIAL_FORM);
    setImage(null);
    setHadExistingImage(false);
    setIsModalOpen(true);
  };

  const handleEditClick = (table) => {
    setError(null);
    setEditingTable(table);
    setFormData({
      table_number: table.table_number || '',
      seats: String(table.seats || '4'),
      zone: table.zone || 'Indoor',
      shape: table.shape || 'Square',
      min_spend: table.min_spend || '',
      description: table.description || '',
      is_available: table.is_available !== undefined ? !!table.is_available : true,
      is_active: table.is_active !== undefined ? !!table.is_active : true,
    });
    setImage(table.image || null);
    setHadExistingImage(Boolean(table.image));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (loading) return;
    setIsModalOpen(false);
    setEditingTable(null);
    setFormData(INITIAL_FORM);
    setImage(null);
    setHadExistingImage(false);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDelete = async (tableId) => {
    if (!confirm('Delete this table permanently?')) return;
    try {
      const token = localStorage.getItem('hungrymenia_token') || '';
      const res = await fetch(`${API_URL}/v1/my-branch/tables/${tableId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.status) {
        setSuccess('Table deleted successfully.');
        await loadTables();
      } else {
        setError(data.message || 'Failed to delete table.');
      }
    } catch (err) {
      setError('Error deleting table.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = new FormData();
      payload.append('table_number', formData.table_number);
      payload.append('seats', formData.seats);
      payload.append('zone', formData.zone);
      payload.append('shape', formData.shape || '');
      payload.append('min_spend', formData.min_spend || '');
      payload.append('description', formData.description || '');
      payload.append('is_available', formData.is_available ? '1' : '0');
      payload.append('is_active', formData.is_active ? '1' : '0');

      if (image instanceof File) {
        payload.append('image', image);
      } else if (editingTable && hadExistingImage && image === null) {
        payload.append('remove_image', '1');
      }

      if (editingTable) {
        payload.append('_method', 'PUT');
      }

      const token = localStorage.getItem('hungrymenia_token') || '';
      const url = editingTable
        ? `${API_URL}/v1/my-branch/tables/${editingTable.id}`
        : `${API_URL}/v1/my-branch/tables`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const data = await res.json();
      if (!res.ok || !data.status) {
        throw new Error(data.message || 'Failed to save table.');
      }

      setSuccess(editingTable ? 'Table updated successfully! ✨' : 'Table created successfully! 🪑');
      closeModal();
      await loadTables();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalSeats = tables.reduce((sum, t) => sum + Number(t.seats || 0), 0);
  const availableCount = tables.filter((t) => t.is_available && t.is_active).length;

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#146C30] to-[#1B873D] py-7 px-8 rounded-3xl text-white shadow-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <Link href="/" className="text-xs font-semibold text-green-200 hover:text-white transition">
              &larr; Back to Home
            </Link>
            <h1 className="text-2xl font-extrabold mt-1.5">Table Setup &amp; Floor Plan</h1>
            <p className="text-green-100 text-xs mt-0.5">
              Configure dining tables, seat counts, zones, and photos for Branch #{branchId}
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="bg-amber-400 hover:bg-amber-300 text-gray-950 px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition cursor-pointer shrink-0 self-start sm:self-auto"
          >
            + Add Table
          </button>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase">Total Tables</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{tables.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase">Total Seating Capacity</p>
            <p className="text-2xl font-extrabold text-[#1B873D] mt-1">{totalSeats} Seats</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase">Available for Booking</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{availableCount} Tables</p>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-xs font-semibold flex justify-between items-center">
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess(null)} className="font-bold cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Tables List */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-7">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-extrabold text-gray-900">Branch Tables ({tables.length})</h2>
            <button
              type="button"
              onClick={openCreateModal}
              className="bg-[#1B873D] hover:bg-[#146C30] text-white px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              ➕ New Table
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-gray-700">
                <tr>
                  <th className="p-3">Photo</th>
                  <th className="p-3">Table</th>
                  <th className="p-3">Seats</th>
                  <th className="p-3">Zone / Shape</th>
                  <th className="p-3">Min Spend</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tables.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-400">
                      No tables added yet. Click &ldquo;+ Add Table&rdquo; to create your first dining table.
                    </td>
                  </tr>
                ) : (
                  tables.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70">
                      <td className="p-3">
                        <img
                          src={
                            t.image
                              ? t.image.startsWith('http')
                                ? t.image
                                : `${IMAGE_BASE_URL}${t.image}`
                              : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'
                          }
                          alt={t.table_number}
                          className="w-12 h-10 rounded-xl object-cover border"
                        />
                      </td>
                      <td className="p-3">
                        <div className="font-extrabold text-gray-900">{t.table_number}</div>
                        {t.description && (
                          <div className="text-[11px] text-gray-400 line-clamp-1 max-w-[200px]">{t.description}</div>
                        )}
                      </td>
                      <td className="p-3 font-bold text-gray-800">👥 {t.seats} Seats</td>
                      <td className="p-3">
                        <span className="font-semibold text-gray-700">{t.zone}</span>
                        {t.shape && <span className="text-gray-400"> • {t.shape}</span>}
                      </td>
                      <td className="p-3 font-semibold text-gray-700">
                        {t.min_spend ? `Rs ${Number(t.min_spend)}` : '—'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            t.is_available && t.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {t.is_available && t.is_active ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleEditClick(t)}
                          className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-200 transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold hover:bg-red-200 transition cursor-pointer"
                        >
                          Delete
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

      {/* Add / Edit Table Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-7 py-5 flex justify-between items-center">
              <h2 className="text-base font-extrabold text-gray-900">
                {editingTable ? `Edit Table: ${editingTable.table_number}` : '🪑 Add New Dining Table'}
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

            <form onSubmit={handleSubmit} className="p-7 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Table Number / Name *</label>
                  <input
                    type="text"
                    name="table_number"
                    required
                    value={formData.table_number}
                    onChange={handleChange}
                    placeholder="e.g. T-01 or VIP Booth 1"
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Number of Seats *</label>
                  <select
                    name="seats"
                    value={formData.seats}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Seat' : 'Seats'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Seating Zone *</label>
                  <select
                    name="zone"
                    value={formData.zone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  >
                    <option value="Indoor">Indoor (AC)</option>
                    <option value="Outdoor">Outdoor / Garden</option>
                    <option value="Rooftop">Rooftop</option>
                    <option value="VIP">VIP / Private Room</option>
                    <option value="Window">Window Side</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Table Shape</label>
                  <select
                    name="shape"
                    value={formData.shape}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  >
                    <option value="Square">Square</option>
                    <option value="Rectangle">Rectangle</option>
                    <option value="Round">Round</option>
                    <option value="Booth">Booth / Sofa</option>
                    <option value="Bar">Bar Counter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Minimum Spend (Rs)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="min_spend"
                    value={formData.min_spend}
                    onChange={handleChange}
                    placeholder="Optional (e.g. 5000)"
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  />
                </div>

                <div className="flex items-end gap-5 pb-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_available"
                      checked={formData.is_available}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#1B873D] rounded border-gray-300"
                    />
                    Available
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#1B873D] rounded border-gray-300"
                    />
                    Active
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">
                    Table Details &amp; Amenities
                  </label>
                  <textarea
                    name="description"
                    rows="2"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g. Corner window table with power outlet, suitable for family dining or meetings"
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <SingleTableImageUploader image={image} onImageChange={setImage} />
                </div>
              </div>

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
                  {loading ? 'Saving...' : editingTable ? 'Update Table ✨' : 'Create Table 🪑'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function TableManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="animate-pulse text-gray-400 font-medium text-sm">Loading table setup...</div>
        </div>
      }
    >
      <TableManagementContent />
    </Suspense>
  );
}