'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/hungrymenia-api/public/api';

// --- Reusable Drag & Drop Image Uploader ---
function DragDropImageUploader({ 
  images, 
  onImagesChange, 
  maxImages = 5, 
  label = "Upload Images" 
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

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
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

      {/* Drop Zone */}
      {images.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
            dragOver ? 'border-[#1B873D] bg-green-50/80' : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            multiple={maxImages > 1}
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            id={`file-input-${label.replace(/\s+/g, '-')}`}
          />
          <label 
            htmlFor={`file-input-${label.replace(/\s+/g, '-')}`} 
            className="cursor-pointer flex flex-col items-center justify-center space-y-2"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 text-[#1B873D] flex items-center justify-center font-bold text-lg shadow-xs">
              📁
            </div>
            <p className="text-xs font-semibold text-gray-700">
              Drag & drop images here, or <span className="text-[#1B873D] underline">browse files</span>
            </p>
            <p className="text-[10px] text-gray-400">PNG, JPG, WEBP up to 3MB</p>
          </label>
        </div>
      )}

      {/* Image Preview & Order Bar */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {images.map((file, idx) => {
            const previewUrl = typeof file === 'string' ? file : URL.createObjectURL(file);
            return (
              <div key={idx} className="relative group bg-white border border-gray-300 rounded-xl overflow-hidden shadow-xs">
                <img 
                  src={previewUrl} 
                  alt={`Preview ${idx + 1}`} 
                  className="h-24 w-full object-cover"
                />

                <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                  #{idx + 1}
                </span>

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => moveImage(idx, -1)}
                      className="bg-white text-gray-900 p-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 shadow-xs"
                      title="Move Left"
                    >
                      &larr;
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="bg-red-600 text-white p-1.5 rounded-lg text-xs font-bold hover:bg-red-700 shadow-xs"
                    title="Remove Photo"
                  >
                    ✕
                  </button>
                  {idx < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 1)}
                      className="bg-white text-gray-900 p-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 shadow-xs"
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

// --- Main Registration Page ---
export default function RestaurantRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [districts, setDistricts] = useState([]);
  const [restaurantLogos, setRestaurantLogos] = useState([]);

  const [formData, setFormData] = useState({
    registration_type: 'single',
    restaurant_name: '',
    registration_number: '',
    restaurant_email: '',
    restaurant_phone: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    admin_password_confirmation: '',
    branches: [
      {
        name: '',
        city_id: '',
        address: '',
        phone: '',
        email: '',
        open_time: '08:00',
        close_time: '22:00',
        admin_name: '',
        admin_email: '',
        admin_password: '',
        admin_password_confirmation: '',
        images: []
      }
    ]
  });

  useEffect(() => {
    async function loadCities() {
      try {
        const res = await fetch(`${API_URL}/cities`);
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) return;
        const data = await res.json();
        if (data.status && data.districts) {
          setDistricts(data.districts);
        }
      } catch (err) {
        console.error('Failed to load cities & districts:', err);
      }
    }
    loadCities();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeSwitch = (type) => {
    setFormData((prev) => ({
      ...prev,
      registration_type: type,
      branches: type === 'single' ? [prev.branches[0]] : prev.branches
    }));
  };

  const handleBranchChange = (index, field, value) => {
    const updatedBranches = [...formData.branches];
    updatedBranches[index][field] = value;
    setFormData((prev) => ({ ...prev, branches: updatedBranches }));
  };

  const handleBranchImagesUpdate = (index, updatedImages) => {
    const updatedBranches = [...formData.branches];
    updatedBranches[index].images = updatedImages;
    setFormData((prev) => ({ ...prev, branches: updatedBranches }));
  };

  const addBranch = () => {
    if (formData.branches.length < 3) {
      setFormData((prev) => ({
        ...prev,
        branches: [
          ...prev.branches,
          {
            name: '',
            city_id: '',
            address: '',
            phone: '',
            email: '',
            open_time: '08:00',
            close_time: '22:00',
            admin_name: '',
            admin_email: '',
            admin_password: '',
            admin_password_confirmation: '',
            images: []
          }
        ]
      }));
    }
  };

  const removeBranch = (index) => {
    if (formData.branches.length > 1) {
      const updatedBranches = formData.branches.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, branches: updatedBranches }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (restaurantLogos.length === 0) {
      setError('Please upload a restaurant logo.');
      setLoading(false);
      return;
    }

    if (formData.registration_type === 'network' && formData.admin_password !== formData.admin_password_confirmation) {
      setError('Network super admin passwords do not match.');
      setLoading(false);
      return;
    }

    for (let i = 0; i < formData.branches.length; i++) {
      if (formData.branches[i].admin_password !== formData.branches[i].admin_password_confirmation) {
        setError(`Passwords do not match for Branch #${i + 1} admin.`);
        setLoading(false);
        return;
      }
      if (!formData.branches[i].images || formData.branches[i].images.length === 0) {
        setError(`Branch #${i + 1} must have at least 1 photo uploaded.`);
        setLoading(false);
        return;
      }
    }

    try {
      const dataPayload = new FormData();
      dataPayload.append('registration_type', formData.registration_type);
      dataPayload.append('restaurant_name', formData.restaurant_name);
      dataPayload.append('registration_number', formData.registration_number || '');
      dataPayload.append('restaurant_email', formData.restaurant_email);
      dataPayload.append('restaurant_phone', formData.restaurant_phone);
      
      if (restaurantLogos[0]) {
        dataPayload.append('logo', restaurantLogos[0]);
      }

      dataPayload.append('admin_name', formData.admin_name);
      dataPayload.append('admin_email', formData.admin_email);
      dataPayload.append('admin_password', formData.admin_password);
      dataPayload.append('admin_password_confirmation', formData.admin_password_confirmation);

      formData.branches.forEach((branch, index) => {
        dataPayload.append(`branches[${index}][name]`, branch.name);
        dataPayload.append(`branches[${index}][city_id]`, branch.city_id);
        dataPayload.append(`branches[${index}][address]`, branch.address);
        dataPayload.append(`branches[${index}][phone]`, branch.phone);
        dataPayload.append(`branches[${index}][email]`, branch.email);
        dataPayload.append(`branches[${index}][open_time]`, branch.open_time);
        dataPayload.append(`branches[${index}][close_time]`, branch.close_time);
        dataPayload.append(`branches[${index}][admin_name]`, branch.admin_name);
        dataPayload.append(`branches[${index}][admin_email]`, branch.admin_email);
        dataPayload.append(`branches[${index}][admin_password]`, branch.admin_password);
        dataPayload.append(`branches[${index}][admin_password_confirmation]`, branch.admin_password_confirmation);

        branch.images.forEach((imgFile) => {
          dataPayload.append(`branches[${index}][images][]`, imgFile);
        });
      });



      const res = await fetch(`${API_URL}/restaurants/register`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: dataPayload,
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const htmlError = await res.text();
        console.error('Server returned HTML instead of JSON:', htmlError);
        throw new Error(`Server Error (${res.status}): Please check backend logs.`);
      }

      const data = await res.json();
      if (!res.ok || !data.status) {
        throw new Error(data.message || 'Registration failed.');
      }

      // Store returned registration data in sessionStorage for the summary page
        if (typeof window !== 'undefined') {
        sessionStorage.setItem('hungrymenia_registered_restaurant', JSON.stringify(data));
        }

      router.push('/register/restaurant/success');
    
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-md border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#146C30] to-[#1B873D] py-8 px-8 text-white">
          <Link href="/" className="text-xs font-semibold text-green-200 hover:text-white transition">
            &larr; Back to Home
          </Link>
          <h1 className="text-2xl font-extrabold mt-2">Register Your Restaurant</h1>
          <p className="text-green-100 text-xs mt-1">Upload brand assets, configure branch locations, and create manager accounts.</p>
        </div>

        {error && (
          <div className="mx-8 mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-semibold shadow-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-3">1. Structure & Main Info</h2>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleTypeSwitch('single')}
                  className={`p-4 rounded-2xl border text-left transition shadow-xs ${
                    formData.registration_type === 'single'
                      ? 'border-[#1B873D] bg-green-50 text-[#1B873D] font-bold'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm">Single Restaurant</div>
                  <div className="text-[11px] font-normal opacity-75 mt-0.5">1 Location only</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeSwitch('network')}
                  className={`p-4 rounded-2xl border text-left transition shadow-xs ${
                    formData.registration_type === 'network'
                      ? 'border-[#1B873D] bg-green-50 text-[#1B873D] font-bold'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm">Multi-Branch Network</div>
                  <div className="text-[11px] font-normal opacity-75 mt-0.5">Chain network (up to 3 branches)</div>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Restaurant Name</label>
                  <input
                    type="text"
                    name="restaurant_name"
                    required
                    value={formData.restaurant_name}
                    onChange={handleChange}
                    placeholder="e.g. Spice Route"
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Registration Number</label>
                  <input
                    type="text"
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleChange}
                    placeholder="e.g. PV123456"
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Business Email</label>
                  <input
                    type="email"
                    name="restaurant_email"
                    required
                    value={formData.restaurant_email}
                    onChange={handleChange}
                    placeholder="info@spiceroute.com"
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">Business Phone</label>
                  <input
                    type="text"
                    name="restaurant_phone"
                    required
                    value={formData.restaurant_phone}
                    onChange={handleChange}
                    placeholder="0712345678"
                    className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none placeholder:text-gray-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <DragDropImageUploader
                    images={restaurantLogos}
                    onImagesChange={setRestaurantLogos}
                    maxImages={1}
                    label="Restaurant Logo (Mandatory)"
                  />
                </div>
              </div>

              {formData.registration_type === 'network' && (
                <>
                  <h3 className="text-sm font-bold text-gray-900 pt-4 border-t border-gray-200">Network Super Admin Account</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-extrabold text-gray-800 mb-1">Admin Name</label>
                      <input
                        type="text"
                        name="admin_name"
                        required
                        value={formData.admin_name}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-gray-800 mb-1">Admin Email</label>
                      <input
                        type="email"
                        name="admin_email"
                        required
                        value={formData.admin_email}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-gray-800 mb-1">Password</label>
                      <input
                        type="password"
                        name="admin_password"
                        required
                        value={formData.admin_password}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-extrabold text-gray-800 mb-1">Confirm Password</label>
                      <input
                        type="password"
                        name="admin_password_confirmation"
                        required
                        value={formData.admin_password_confirmation}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-[#1B873D] hover:bg-[#146C30] text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Next: Branch Details &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <h2 className="text-base font-bold text-gray-900">
                  2. {formData.registration_type === 'single' ? 'Branch Details & Admin' : 'Configure Branches (Max 3)'}
                </h2>
                {formData.registration_type === 'network' && formData.branches.length < 3 && (
                  <button
                    type="button"
                    onClick={addBranch}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    + Add Another Branch
                  </button>
                )}
              </div>

              {formData.branches.map((branch, index) => (
                <div key={index} className="p-6 bg-slate-50 border border-slate-300 rounded-3xl space-y-5 shadow-xs">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="text-xs font-extrabold text-[#1B873D] uppercase tracking-wider">
                      Branch #{index + 1}
                    </span>
                    {formData.registration_type === 'network' && formData.branches.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBranch(index)}
                        className="text-red-600 hover:text-red-800 text-xs font-bold transition cursor-pointer"
                      >
                        Remove Branch
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-gray-800 mb-1">Branch Name</label>
                      <input
                        type="text"
                        required
                        value={branch.name}
                        onChange={(e) => handleBranchChange(index, 'name', e.target.value)}
                        placeholder="e.g. Colombo Branch"
                        className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none placeholder:text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-gray-800 mb-1">City</label>
                      <select
                        required
                        value={branch.city_id}
                        onChange={(e) => handleBranchChange(index, 'city_id', e.target.value)}
                        className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none"
                      >
                        <option value="">Select City (Grouped by District)</option>
                        {districts.map((district) => (
                          <optgroup key={district.id} label={`📍 ${district.name} District`}>
                            {district.cities?.map((city) => (
                              <option key={city.id} value={city.id}>
                                {city.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-extrabold text-gray-800 mb-1">Address</label>
                      <input
                        type="text"
                        required
                        value={branch.address}
                        onChange={(e) => handleBranchChange(index, 'address', e.target.value)}
                        placeholder="e.g. 412/A Main Street"
                        className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-gray-800 mb-1">Phone</label>
                      <input
                        type="text"
                        required
                        value={branch.phone}
                        onChange={(e) => handleBranchChange(index, 'phone', e.target.value)}
                        placeholder="0112345678"
                        className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-gray-800 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={branch.email}
                        onChange={(e) => handleBranchChange(index, 'email', e.target.value)}
                        placeholder="branch@spiceroute.com"
                        className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-gray-800 mb-1">Opening Time</label>
                      <input
                        type="time"
                        required
                        value={branch.open_time}
                        onChange={(e) => handleBranchChange(index, 'open_time', e.target.value)}
                        className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-gray-800 mb-1">Closing Time</label>
                      <input
                        type="time"
                        required
                        value={branch.close_time}
                        onChange={(e) => handleBranchChange(index, 'close_time', e.target.value)}
                        className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2 pt-2">
                      <DragDropImageUploader
                        images={branch.images}
                        onImagesChange={(updated) => handleBranchImagesUpdate(index, updated)}
                        maxImages={5}
                        label={`Branch #${index + 1} Photos (At least 1 required)`}
                      />
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-gray-200">
                      <h4 className="text-xs font-extrabold text-gray-900 mb-3">Branch Administrator Account</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-extrabold text-gray-800 mb-1">Branch Admin Name</label>
                          <input
                            type="text"
                            required
                            value={branch.admin_name}
                            onChange={(e) => handleBranchChange(index, 'admin_name', e.target.value)}
                            className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-extrabold text-gray-800 mb-1">Branch Admin Email</label>
                          <input
                            type="email"
                            required
                            value={branch.admin_email}
                            onChange={(e) => handleBranchChange(index, 'admin_email', e.target.value)}
                            className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-extrabold text-gray-800 mb-1">Password</label>
                          <input
                            type="password"
                            required
                            value={branch.admin_password}
                            onChange={(e) => handleBranchChange(index, 'admin_password', e.target.value)}
                            className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-extrabold text-gray-800 mb-1">Confirm Password</label>
                          <input
                            type="password"
                            required
                            value={branch.admin_password_confirmation}
                            onChange={(e) => handleBranchChange(index, 'admin_password_confirmation', e.target.value)}
                            className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ))}

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#1B873D] hover:bg-[#146C30] text-white px-8 py-3 rounded-xl font-bold text-xs shadow-md disabled:opacity-50 transition cursor-pointer"
                >
                  {loading ? 'Registering...' : 'Complete Registration 🚀'}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </main>
  );
}