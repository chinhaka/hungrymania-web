'use client';
import { useState, useEffect } from 'react';

const MEAL_OPTIONS = [
  { value: 'all', label: 'All Meals', icon: '🍽️', desc: 'Show breakfast, lunch & dinner items' },
  { value: 'breakfast', label: 'Breakfast', icon: '☀️', desc: 'Morning dishes & specials' },
  { value: 'lunch', label: 'Lunch', icon: '🍛', desc: 'Midday plates & combos' },
  { value: 'dinner', label: 'Dinner', icon: '🌙', desc: 'Evening & night menu items' },
];

function FilterSelectionModal({
  isOpen,
  title,
  subtitle,
  options,
  selectedValue,
  onSelect,
  onClose,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900">{title}</h3>
            {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs flex items-center justify-center transition cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="p-3 max-h-80 overflow-y-auto space-y-1.5">
          {options.map((option) => {
            const isSelected = String(selectedValue) === String(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSelect(option.value);
                  onClose();
                }}
                className={`w-full px-3.5 py-2.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                  isSelected
                    ? 'bg-green-50 border-[#1B873D] text-[#146C30]'
                    : 'bg-white border-slate-200/80 text-gray-800 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {option.icon && <span className="text-base shrink-0">{option.icon}</span>}
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold truncate">{option.label}</div>
                    {option.desc && (
                      <div className="text-[10px] text-gray-500 truncate">{option.desc}</div>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <span className="text-xs font-extrabold text-[#1B873D] shrink-0">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MenuSearchFilters({
  selectedMealTime,
  setSelectedMealTime,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories = [],
  selectedFoodType,
  setSelectedFoodType,
  foodTypes = [],
}) {
  const [openModal, setOpenModal] = useState(null); // 'meal' | 'category' | 'type' | null

  const categoryOptions = [
    { value: 'all', label: 'All Categories', icon: '📂', desc: 'Show items across all categories' },
    ...categories.map((cat) => ({
      value: cat,
      label: cat,
      icon: '🍲',
    })),
  ];

  const foodTypeOptions = [
    { value: 'all', label: 'All Types', icon: '🥗', desc: 'Show all food types' },
    ...foodTypes.map((type) => ({
      value: type,
      label: type,
      icon: '✨',
    })),
  ];

  const selectedMealObj = MEAL_OPTIONS.find((m) => m.value === selectedMealTime);
  const mealButtonLabel =
    selectedMealTime === 'all' ? 'Meal' : selectedMealObj?.label || selectedMealTime;
  const mealButtonIcon = selectedMealObj?.icon || '🍽️';

  const categoryButtonLabel = selectedCategory === 'all' ? 'Category' : selectedCategory;
  const typeButtonLabel = selectedFoodType === 'all' ? 'Type' : selectedFoodType;

  return (
    <>
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 items-center">
          {/* Meal Picker Modal Button */}
          <button
            type="button"
            onClick={() => setOpenModal('meal')}
            className={`lg:col-span-2 h-10 px-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition cursor-pointer min-w-0 ${
              selectedMealTime !== 'all'
                ? 'bg-amber-50 border-amber-400 text-amber-800'
                : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/80 text-gray-800'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <span className="shrink-0">{mealButtonIcon}</span>
              <span className="truncate">{mealButtonLabel}</span>
            </span>
            <span className="text-[10px] opacity-60 shrink-0">▼</span>
          </button>

          {/* Category Picker Modal Button */}
          <button
            type="button"
            onClick={() => setOpenModal('category')}
            className={`lg:col-span-2 h-10 px-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition cursor-pointer min-w-0 ${
              selectedCategory !== 'all'
                ? 'bg-green-50 border-[#1B873D] text-[#146C30]'
                : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/80 text-gray-800'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <span className="shrink-0">📂</span>
              <span className="truncate">{categoryButtonLabel}</span>
            </span>
            <span className="text-[10px] opacity-60 shrink-0">▼</span>
          </button>

          {/* Food Type Picker Modal Button */}
          <button
            type="button"
            onClick={() => setOpenModal('type')}
            className={`lg:col-span-2 h-10 px-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition cursor-pointer min-w-0 ${
              selectedFoodType !== 'all'
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/80 text-gray-800'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <span className="shrink-0">🥗</span>
              <span className="truncate">{typeButtonLabel}</span>
            </span>
            <span className="text-[10px] opacity-60 shrink-0">▼</span>
          </button>

          {/* Search Input */}
          <div className="sm:col-span-2 lg:col-span-6 relative flex items-center">
            <span className="left-3 text-gray-400 text-xs pointer-events-none absolute">🔍</span>
            <input
              type="text"
              placeholder="Search dishes or ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-8 pr-8 text-xs font-medium text-gray-900 bg-slate-50/60 focus:bg-white border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B873D] focus:border-[#1B873D] placeholder:text-gray-400 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="right-2.5 text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer absolute"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Meal Selection Modal */}
      <FilterSelectionModal
        isOpen={openModal === 'meal'}
        title="Select Meal"
        subtitle="Filter menu items by meal time"
        options={MEAL_OPTIONS}
        selectedValue={selectedMealTime}
        onSelect={setSelectedMealTime}
        onClose={() => setOpenModal(null)}
      />

      {/* Category Selection Modal */}
      <FilterSelectionModal
        isOpen={openModal === 'category'}
        title="Select Category"
        subtitle="Filter menu items by dish category"
        options={categoryOptions}
        selectedValue={selectedCategory}
        onSelect={setSelectedCategory}
        onClose={() => setOpenModal(null)}
      />

      {/* Food Type Selection Modal */}
      <FilterSelectionModal
        isOpen={openModal === 'type'}
        title="Select Type"
        subtitle="Filter menu items by food type"
        options={foodTypeOptions}
        selectedValue={selectedFoodType}
        onSelect={setSelectedFoodType}
        onClose={() => setOpenModal(null)}
      />
    </>
  );
}