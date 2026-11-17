'use client';

export default function MenuSearchFilters({
  selectedMealTime,
  setSelectedMealTime,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  selectedFoodType,
  setSelectedFoodType,
  foodTypes,
}) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/90 space-y-5">
      {/* Top Row: Search Input & Meal Time Tabs */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 pb-5 border-b border-slate-100">
        
        {/* Meal Time Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-xs font-bold text-gray-400 mr-2 uppercase tracking-wider">Meal:</span>
          {['all', 'breakfast', 'lunch', 'dinner'].map((meal) => (
            <button
              key={meal}
              onClick={() => setSelectedMealTime(meal)}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold capitalize transition cursor-pointer shrink-0 ${
                selectedMealTime === meal
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
              }`}
            >
              {meal === 'all' ? '🍽️ All Meals' : meal === 'breakfast' ? '☀️ Breakfast' : meal === 'lunch' ? '🍛 Lunch' : '🌙 Dinner'}
            </button>
          ))}
        </div>

        {/* Professional Search Bar */}
        <div className="relative w-full lg:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search dishes or ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-medium text-gray-900 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1B873D] focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-gray-400 mr-1 shrink-0 uppercase tracking-wider">Category:</span>
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#1B873D] text-white shadow-sm'
              : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#1B873D] text-white shadow-sm'
                : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Food Type Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pt-1">
        <span className="text-xs font-bold text-gray-400 mr-1 shrink-0 uppercase tracking-wider">Type:</span>
        <button
          onClick={() => setSelectedFoodType('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
            selectedFoodType === 'all'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
          }`}
        >
          All Types
        </button>
        {foodTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedFoodType(type)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              selectedFoodType === type
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}