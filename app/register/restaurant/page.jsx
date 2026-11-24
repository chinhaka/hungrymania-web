'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/hungrymenia-api/public/api';

const DAYS_OF_WEEK = [
  { key: 'sunday', label: 'Sunday' },
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
];



function createDefaultSchedule() {
  const schedule = {};
  DAYS_OF_WEEK.forEach((d) => {
    schedule[d.key] = {
      closed: false,
      slots: [{ open: '08:00', close: '22:00' }],
    };
  });
  return schedule;
}

function WeeklyHoursEditor({ schedule, onChange }) {
  const safeSchedule = schedule || createDefaultSchedule();

  const toggleClosed = (dayKey, checked) => {
    const base = schedule || createDefaultSchedule();
    const current = base[dayKey] || { closed: false, slots: [{ open: '08:00', close: '22:00' }] };
    onChange({
      ...base,
      [dayKey]: {
        ...current,
        closed: checked,
        slots: current.slots && current.slots.length > 0 ? current.slots : [{ open: '08:00', close: '22:00' }],
      },
    });
  };

  const addSlot = (dayKey) => {
    const base = schedule || createDefaultSchedule();
    const current = base[dayKey] || { closed: false, slots: [{ open: '08:00', close: '22:00' }] };
    const existingSlots = current.slots && current.slots.length > 0 ? current.slots : [{ open: '08:00', close: '22:00' }];
    const lastSlot = existingSlots[existingSlots.length - 1];

    onChange({
      ...base,
      [dayKey]: {
        ...current,
        closed: false,
        slots: [
          ...existingSlots,
          { open: lastSlot?.open || '09:00', close: lastSlot?.close || '17:00' },
        ],
      },
    });
  };

  const removeSlot = (dayKey, slotIndex) => {
    const base = schedule || createDefaultSchedule();
    const current = base[dayKey];
    if (!current || !current.slots || current.slots.length <= 1) return;

    onChange({
      ...base,
      [dayKey]: {
        ...current,
        slots: current.slots.filter((_, idx) => idx !== slotIndex),
      },
    });
  };

  const updateSlotTime = (dayKey, slotIndex, field, val) => {
    const base = schedule || createDefaultSchedule();
    const current = base[dayKey] || { closed: false, slots: [{ open: '08:00', close: '22:00' }] };
    const existingSlots = current.slots && current.slots.length > 0 ? current.slots : [{ open: '08:00', close: '22:00' }];

    const nextSlots = existingSlots.map((slot, idx) =>
      idx === slotIndex ? { ...slot, [field]: val } : slot
    );

    onChange({
      ...base,
      [dayKey]: {
        ...current,
        slots: nextSlots,
      },
    });
  };

  return (
    <div className="bg-white border border-gray-300 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
        <div>
          <h4 className="text-xs font-extrabold text-gray-900">Opening &amp; Closing Hours</h4>
          <p className="text-[11px] text-gray-500">Mark a day as Closed or use + to add split shifts</p>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {DAYS_OF_WEEK.map((day) => {
          const dayData = safeSchedule[day.key] || {
            closed: false,
            slots: [{ open: '08:00', close: '22:00' }],
          };
          const slots = dayData.slots && dayData.slots.length > 0 ? dayData.slots : [{ open: '08:00', close: '22:00' }];

          return (
            <div key={day.key} className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="w-36 shrink-0 space-y-1.5">
                <div className="text-xs font-extrabold text-gray-900">{day.label}</div>
                <label className="inline-flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(dayData.closed)}
                    onChange={(e) => toggleClosed(day.key, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1B873D] focus:ring-[#1B873D]"
                  />
                  <span>Closed</span>
                </label>
              </div>

              <div className="flex-1 space-y-2.5">
                {slots.map((slot, slotIdx) => (
                  <div key={slotIdx} className="flex items-center gap-2 sm:gap-2.5">
                    <div className="relative flex-1">
                      <span className="-top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 absolute">
                        Opens at
                      </span>
                      <input
                        type="time"
                        disabled={Boolean(dayData.closed)}
                        required={!dayData.closed}
                        value={slot.open || '08:00'}
                        onChange={(e) => updateSlotTime(day.key, slotIdx, 'open', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded-xl disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none"
                      />
                    </div>

                    <div className="relative flex-1">
                      <span className="-top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 absolute">
                        Closes at
                      </span>
                      <input
                        type="time"
                        disabled={Boolean(dayData.closed)}
                        required={!dayData.closed}
                        value={slot.close || '22:00'}
                        onChange={(e) => updateSlotTime(day.key, slotIdx, 'close', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded-xl disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none"
                      />
                    </div>

                    {slotIdx === 0 && (
                      <button
                        type="button"
                        disabled={Boolean(dayData.closed)}
                        onClick={() => addSlot(day.key)}
                        title="Add another time slot"
                        className="w-8 h-8 rounded-xl border border-gray-200 hover:bg-green-50 hover:text-[#1B873D] disabled:opacity-35 text-gray-700 font-bold text-base flex items-center justify-center shrink-0 transition cursor-pointer"
                      >
                        +
                      </button>
                    )}

                    {slotIdx > 0 && (
                      <button
                        type="button"
                        onClick={() => removeSlot(day.key, slotIdx)}
                        title="Remove time slot"
                        className="w-8 h-8 rounded-xl border border-red-100 bg-red-50/60 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center shrink-0 transition cursor-pointer"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Searchable City Dropdown Component ---
function SearchableCitySelect({ districts, value, onChange }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Flatten all cities with their district name for easy searching
  const allCities = districts.flatMap((district) =>
    (district.cities || []).map((city) => ({
      ...city,
      district_name: district.name,
    }))
  );

  // Filter cities based on user input
  const filteredCities = query === ''
    ? allCities
    : allCities.filter((city) =>
        city.name.toLowerCase().includes(query.toLowerCase()) ||
        city.district_name.toLowerCase().includes(query.toLowerCase())
      );

  // Find currently selected city name for display
  const selectedCity = allCities.find((c) => String(c.id) === String(value));

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Type to search city (e.g. Colombo)..."
        value={isOpen ? query : (selectedCity ? `${selectedCity.name} (${selectedCity.district_name})` : query)}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          setQuery('');
        }}
        className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl shadow-xs focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] focus:outline-none placeholder:text-gray-400"
      />

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filteredCities.length > 0 ? (
            filteredCities.map((city) => (
              <div
                key={city.id}
                onClick={() => {
                  onChange(city.id);
                  setQuery('');
                  setIsOpen(false);
                }}
                className="px-4 py-2 text-xs text-gray-800 hover:bg-green-50 hover:text-[#1B873D] cursor-pointer flex justify-between items-center transition"
              >
                <span className="font-semibold">{city.name}</span>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                  {city.district_name}
                </span>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-xs text-gray-500 text-center">
              No cities found matching &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
        opening_hours: createDefaultSchedule(),
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
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // If single restaurant, automatically keep branch name synchronized with restaurant name
      if (name === 'restaurant_name' && prev.registration_type === 'single') {
        updated.branches = prev.branches.map((b, idx) =>
          idx === 0 ? { ...b, name: value } : b
        );
      }
      return updated;
    });
  };

  const handleTypeSwitch = (type) => {
    setFormData((prev) => ({
      ...prev,
      registration_type: type,
      branches:
        type === 'single'
          ? [
              {
                ...prev.branches[0],
                name: prev.restaurant_name,
                opening_hours: prev.branches[0]?.opening_hours || createDefaultSchedule(),
              },
            ]
          : prev.branches.map((b) => ({
              ...b,
              opening_hours: b.opening_hours || createDefaultSchedule(),
            })),
    }));
  };

  const handleBranchChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      branches: prev.branches.map((branch, idx) =>
        idx === index ? { ...branch, [field]: value } : branch
      ),
    }));
  };

  const handleBranchImagesUpdate = (index, updatedImages) => {
    setFormData((prev) => ({
      ...prev,
      branches: prev.branches.map((branch, idx) =>
        idx === index ? { ...branch, images: updatedImages } : branch
      ),
    }));
  };

  const addBranch = () => {
    setFormData((prev) => {
      if (prev.branches.length >= 3) return prev;
      return {
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
            opening_hours: createDefaultSchedule(),
            admin_name: '',
            admin_email: '',
            admin_password: '',
            admin_password_confirmation: '',
            images: [],
            supports_pickup: true,
            supports_booking: true,
          }
        ]
      };
    });
  };

  const removeBranch = (index) => {
    setFormData((prev) => {
      if (prev.branches.length <= 1) return prev;
      return {
        ...prev,
        branches: prev.branches.filter((_, idx) => idx !== index)
      };
    });
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
        // For single restaurants, force branch name to match restaurant name if empty/hidden
        const finalBranchName = formData.registration_type === 'single' ? formData.restaurant_name : branch.name;
        const hoursObj = branch.opening_hours || createDefaultSchedule();
        const firstOpenDay = DAYS_OF_WEEK
          .map((d) => hoursObj[d.key])
          .find((day) => day && !day.closed && day.slots && day.slots.length > 0);
        const fallbackOpen = firstOpenDay?.slots[0]?.open || branch.open_time || '08:00';
        const fallbackClose = firstOpenDay?.slots[0]?.close || branch.close_time || '22:00';

        dataPayload.append(`branches[${index}][name]`, finalBranchName);
        dataPayload.append(`branches[${index}][city_id]`, branch.city_id);
        dataPayload.append(`branches[${index}][address]`, branch.address);
        dataPayload.append(`branches[${index}][phone]`, branch.phone);
        dataPayload.append(`branches[${index}][email]`, branch.email);
        dataPayload.append(`branches[${index}][open_time]`, fallbackOpen);
        dataPayload.append(`branches[${index}][close_time]`, fallbackClose);
        dataPayload.append(`branches[${index}][opening_hours]`, JSON.stringify(hoursObj));
        dataPayload.append(`branches[${index}][admin_name]`, branch.admin_name);
        dataPayload.append(`branches[${index}][admin_email]`, branch.admin_email);
        dataPayload.append(`branches[${index}][admin_password]`, branch.admin_password);
        dataPayload.append(`branches[${index}][admin_password_confirmation]`, branch.admin_password_confirmation);
        dataPayload.append(`branches[${index}][supports_booking]`, branch.supports_booking !== false ? '1' : '0');
        dataPayload.append(`branches[${index}][supports_pickup]`, branch.supports_pickup !== false ? '1' : '0');

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
                  className={`p-4 rounded-2xl border text-left transition shadow-xs cursor-pointer ${
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
                  className={`p-4 rounded-2xl border text-left transition shadow-xs cursor-pointer ${
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
                      {formData.registration_type === 'single' ? 'Branch Details' : `Branch #${index + 1}`}
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
                    
                    {/* Conditionally hide Branch Name input if registration_type is single */}
                    {formData.registration_type === 'network' && (
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
                    )}

                    <div className={formData.registration_type === 'single' ? 'md:col-span-2' : ''}>
                      <label className="block text-xs font-extrabold text-gray-800 mb-1">City</label>
                      <SearchableCitySelect
                        districts={districts}
                        value={branch.city_id}
                        onChange={(cityId) => handleBranchChange(index, 'city_id', cityId)}
                      />
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

                    <div className="md:col-span-2">
                      <WeeklyHoursEditor
                        schedule={branch.opening_hours}
                        onChange={(updatedSchedule) => handleBranchChange(index, 'opening_hours', updatedSchedule)}
                      />
                    </div>

                    <div className="md:col-span-2 bg-white border border-gray-300 rounded-2xl p-4 shadow-2xs space-y-2.5">
                      <div>
                        <h4 className="text-xs font-extrabold text-gray-900">Branch Service Options</h4>
                        <p className="text-[11px] text-gray-500">Select which services customers can use at this branch</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 pt-1">
                        <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(branch.supports_booking)}
                            onChange={(e) => handleBranchChange(index, 'supports_booking', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-[#1B873D] focus:ring-[#1B873D]"
                          />
                          <span>🪑 Table Booking Available</span>
                        </label>

                        <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(branch.supports_pickup)}
                            onChange={(e) => handleBranchChange(index, 'supports_pickup', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-[#1B873D] focus:ring-[#1B873D]"
                          />
                          <span>🛍️ Pickup Available</span>
                        </label>
                      </div>
                    </div>

                    <div className="md:col-span-2 pt-2">
                      <DragDropImageUploader
                        images={branch.images}
                        onImagesChange={(updated) => handleBranchImagesUpdate(index, updated)}
                        maxImages={5}
                        label={formData.registration_type === 'single' ? "Branch Photos (At least 1 required)" : `Branch #${index + 1} Photos (At least 1 required)`}
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
                  className="bg-slate-200 hover:bg-slate-300 text-gray-800 px-6 py-3 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#1B873D] hover:bg-[#146C30] text-white px-8 py-3 rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
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