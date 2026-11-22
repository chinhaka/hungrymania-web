'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/hungrymenia-api/public/api';
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'http://localhost/hungrymenia-api/public/uploads/';

const INITIAL_FORM_STATE = {
  name: '',
  description: '',
  category_id: '',
  food_type_id: '',
  price: '',
  cost: '',
  serving_size: '1',
  preparation_time: '15',
  is_featured: false,
  breakfast: true,
  lunch: true,
  dinner: true,
  is_active: true,
};

// --- Reusable Drag & Drop Multi-Image Uploader (Up to 5) ---
function DragDropImageUploader({
  images,
  onImagesChange,
  maxImages = 5,
  label = 'Upload Images',
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files) => {
    const fileArray = Array.from(files).filter((file) => file.type.startsWith('image/'));
    const combined = [...images, ...fileArray].slice(0, maxImages);
    onImagesChange(combined);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  };

  const moveImage = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;
    const updated = [...images];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(newIndex, 0, movedItem);
    onImagesChange(updated);
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-extrabold text-gray-800 tracking-wide">
        {label} <span className="text-gray-400 font-normal">({images.length}/{maxImages})</span>
      </label>

      {images.length < maxImages && (
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
            multiple={maxImages > 1}
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            id="menu-file-input"
          />
          <label htmlFor="menu-file-input" className="cursor-pointer flex flex-col items-center justify-center space-y-1.5">
            <div className="w-9 h-9 rounded-full bg-green-100 text-[#1B873D] flex items-center justify-center font-bold text-base shadow-xs">
              📁
            </div>
            <p className="text-xs font-semibold text-gray-700">
              Drag &amp; drop menu photos here, or <span className="text-[#1B873D] underline">browse files</span>
            </p>
            <p className="text-[10px] text-gray-400">PNG, JPG, WEBP up to 3MB (Image 1 is mandatory)</p>
          </label>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          {images.map((file, idx) => {
            const previewUrl =
              typeof file === 'string'
                ? file.startsWith('http')
                  ? file
                  : `${IMAGE_BASE_URL}${file}`
                : URL.createObjectURL(file);

            return (
              <div key={idx} className="relative group bg-white border border-gray-300 rounded-xl overflow-hidden shadow-xs">
                <img src={previewUrl} alt={`Preview ${idx + 1}`} className="h-24 w-full object-cover" />

                <span className="absolute top-1 left-1 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                  #{idx + 1} {idx === 0 && '(Main)'}
                </span>

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => moveImage(idx, -1)}
                      className="bg-white text-gray-900 p-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 shadow-xs cursor-pointer"
                      title="Move Left"
                    >
                      &larr;
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="bg-red-600 text-white p-1.5 rounded-lg text-xs font-bold hover:bg-red-700 shadow-xs cursor-pointer"
                    title="Remove Photo"
                  >
                    ✕
                  </button>
                  {idx < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 1)}
                      className="bg-white text-gray-900 p-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 shadow-xs cursor-pointer"
                      title="Move Right"
                    >
                      &rarr;
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MenuManagementContent() {
  const params = useParams();
  const branchId = params?.id;

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [foodTypes, setFoodTypes] = useState([]);
  const [userRole, setUserRole] = useState(50);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modal & edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [images, setImages] = useState([]);

  // Pagination states (15 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  async function loadData() {
    if (!branchId) return;
    try {
      const storedUser = JSON.parse(localStorage.getItem('hungrymenia_user') || '{}');
      setUserRole(storedUser.role_id || 50);

      const [optRes, branchRes] = await Promise.all([
        fetch(`${API_URL}/menu-options`),
        fetch(`${API_URL}/branches/${branchId}`),
      ]);

      const optData = await optRes.json();
      const branchData = await branchRes.json();

      if (optData.status) {
        setCategories(optData.categories || []);
        setFoodTypes(optData.food_types || []);
      }
      if (branchData?.branch?.menu_items) {
        setMenuItems(branchData.branch.menu_items);
      } else if (branchData?.menu_items) {
        setMenuItems(branchData.menu_items);
      }
    } catch (err) {
      console.error('Failed to load menu management data', err);
    }
  }

  useEffect(() => {
    loadData();
  }, [branchId]);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  if (userRole && ![50, 51].includes(Number(userRole))) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-extrabold text-red-600 mb-2">Access Denied 🔒</h1>
        <p className="text-gray-500 text-xs mb-6">You do not have management permissions (Required role: 50 or 51).</p>
        <Link href={`/branches/${branchId}`} className="bg-[#1B873D] text-white px-5 py-2.5 rounded-xl text-xs font-bold">
          &larr; Back to Branch View
        </Link>
      </main>
    );
  }

  const openCreateModal = () => {
    setError(null);
    setEditingItem(null);
    setFormData(INITIAL_FORM_STATE);
    setImages([]);
    setIsModalOpen(true);
  };

  const handleEditClick = (item) => {
    setError(null);
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      category_id: item.category_id || '',
      food_type_id: item.food_type_id || '',
      price: item.price || '',
      cost: item.cost || '',
      serving_size: String(item.serving_size || '1'),
      preparation_time: String(item.preparation_time || '15'),
      is_featured: !!item.is_featured,
      breakfast: !!item.breakfast,
      lunch: !!item.lunch,
      dinner: !!item.dinner,
      is_active: item.is_active !== undefined ? !!item.is_active : true,
    });

    const existingImages = [item.image_1, item.image_2, item.image_3, item.image_4, item.image_5].filter(Boolean);
    setImages(existingImages);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (loading) return;
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(INITIAL_FORM_STATE);
    setImages([]);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const token = localStorage.getItem('hungrymenia_token') || '';
      const res = await fetch(`${API_URL}/branches/${branchId}/menu-items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status) {
        setSuccess('Menu item deleted successfully.');
        loadData();
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch (err) {
      alert('Error deleting item');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (images.length === 0) {
      setError('At least 1 image (Image 1) is mandatory for menu items.');
      setLoading(false);
      return;
    }

    try {
      const dataPayload = new FormData();
      Object.keys(formData).forEach((key) => {
        dataPayload.append(key, typeof formData[key] === 'boolean' ? (formData[key] ? 1 : 0) : formData[key]);
      });

      images.forEach((img, idx) => {
        dataPayload.append(`image_${idx + 1}`, img);
      });

      const token = localStorage.getItem('hungrymenia_token') || '';
      const url = editingItem
        ? `${API_URL}/branches/${branchId}/menu-items/${editingItem.id}`
        : `${API_URL}/branches/${branchId}/menu-items`;

      if (editingItem) {
        dataPayload.append('_method', 'PUT');
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: dataPayload,
      });

      const data = await res.json();
      if (!res.ok || !data.status) {
        throw new Error(data.message || 'Operation failed.');
      }

      setSuccess(editingItem ? 'Menu item updated successfully! ✨' : 'Menu item created successfully! 🎉');
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData(INITIAL_FORM_STATE);
      setImages([]);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(menuItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMenuItems = menuItems.slice(startIndex, startIndex + itemsPerPage);

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#146C30] to-[#1B873D] py-7 px-8 rounded-3xl text-white shadow-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <Link href={`/branches/${branchId}`} className="text-xs font-semibold text-green-200 hover:text-white transition">
              &larr; Back to Branch View
            </Link>
            <h1 className="text-2xl font-extrabold mt-1.5">Menu Management Portal</h1>
            <p className="text-green-100 text-xs mt-0.5">View, edit, and organize dishes for this branch</p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="bg-amber-400 hover:bg-amber-300 text-gray-950 px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition cursor-pointer shrink-0 self-start sm:self-auto"
          >
            + Add Menu Item
          </button>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-xs font-semibold flex justify-between items-center">
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess(null)} className="text-green-900 font-bold ml-4 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Primary View: Existing Menu Items Table with Pagination */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-5">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Existing Menu Items ({menuItems.length})</h2>
              <p className="text-xs text-gray-400">Showing up to 15 items per page</p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="bg-[#1B873D] hover:bg-[#146C30] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
            >
              ➕ New Dish
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-gray-700">
                <tr>
                  <th className="p-3">Image</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Serving</th>
                  <th className="p-3">Prep Time</th>
                  <th className="p-3">Price</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMenuItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-400">
                      No menu items found for this branch. Click &ldquo;+ Add Menu Item&rdquo; to create one.
                    </td>
                  </tr>
                ) : (
                  paginatedMenuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3">
                        <img
                          src={
                            item.image_1
                              ? item.image_1.startsWith('http')
                                ? item.image_1
                                : `${IMAGE_BASE_URL}${item.image_1}`
                              : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
                          }
                          alt={item.name}
                          className="w-10 h-10 rounded-xl object-cover border"
                        />
                      </td>
                      <td className="p-3 font-bold text-gray-900">{item.name}</td>
                      <td className="p-3">{item.menu_category?.name || 'General'}</td>
                      <td className="p-3">{item.serving_size || 1} Persons</td>
                      <td className="p-3">{item.preparation_time || 15} mins</td>
                      <td className="p-3 font-bold text-[#1B873D]">Rs {item.price}</td>
                      <td className="p-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleEditClick(item)}
                          className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-200 transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                &larr; Previous
              </button>

              <span className="text-xs font-bold text-gray-600">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Menu Item Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-7 py-5 flex justify-between items-center">
              <h2 className="text-base font-extrabold text-gray-900">
                {editingItem ? `Edit Dish: ${editingItem.name}` : '➕ Add New Menu Item'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs flex items-center justify-center transition cursor-pointer"
                aria-label="Close modal"
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
                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Dish Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Seafood Fried Rice"
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Category *</label>
                  <select
                    name="category_id"
                    required
                    value={formData.category_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Food Type *</label>
                  <select
                    name="food_type_id"
                    required
                    value={formData.food_type_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  >
                    <option value="">Select Food Type</option>
                    {foodTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows="2"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Price (Rs) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Cost (Rs)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Serving Size (Persons)</label>
                  <select
                    name="serving_size"
                    value={formData.serving_size}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Person' : 'Persons'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Preparation Time (Mins)</label>
                  <input
                    type="number"
                    name="preparation_time"
                    value={formData.preparation_time}
                    onChange={handleChange}
                    placeholder="e.g. 15"
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B873D] focus:outline-none"
                  />
                </div>

                {/* Drag & Drop Image Uploader (Up to 5 images) */}
                <div className="md:col-span-2 pt-1">
                  <DragDropImageUploader
                    images={images}
                    onImagesChange={setImages}
                    maxImages={5}
                    label="Dish Gallery Photos (Max 5, Image 1 is Main)"
                  />
                </div>

                <div className="md:col-span-2 flex flex-wrap gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-900 hover:text-[#1B873D] cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      name="breakfast"
                      checked={formData.breakfast}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#1B873D] rounded border-slate-300 focus:ring-[#1B873D]"
                    />
                    Breakfast ☀️
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-900 hover:text-[#1B873D] cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      name="lunch"
                      checked={formData.lunch}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#1B873D] rounded border-slate-300 focus:ring-[#1B873D]"
                    />
                    Lunch 🍽️
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-900 hover:text-[#1B873D] cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      name="dinner"
                      checked={formData.dinner}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#1B873D] rounded border-slate-300 focus:ring-[#1B873D]"
                    />
                    Dinner 🌙
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-900 hover:text-[#1B873D] cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#1B873D] rounded border-slate-300 focus:ring-[#1B873D]"
                    />
                    Featured ⭐
                  </label>
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
                  {loading ? 'Saving...' : editingItem ? 'Update Item ✨' : 'Create Item 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function MenuManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="animate-pulse text-gray-400 font-medium text-sm">Loading menu management...</div>
        </div>
      }
    >
      <MenuManagementContent />
    </Suspense>
  );
}