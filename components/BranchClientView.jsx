'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchBranchDetails } from '@/services/api';
import Link from 'next/link';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'http://localhost/hungrymenia-api/public/storage/';

function FoodImageSlider({ images, itemName }) {
  const validImages = images.filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (validImages.length === 0) {
    return (
      <div className="h-48 bg-gray-100 relative">
        <img 
          src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c" 
          alt={itemName} 
          className="w-full h-full object-cover" 
        />
      </div>
    );
  }

  const nextImage = (e) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const prevImage = (e) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  return (
    <div className="h-48 bg-gray-100 relative overflow-hidden group">
      <img 
        src={`${IMAGE_BASE_URL}${validImages[currentIndex]}`} 
        alt={`${itemName} photo ${currentIndex + 1}`}
        className="w-full h-full object-cover transition duration-300"
      />
      
      {validImages.length > 1 && (
        <>
          <button 
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition text-xs z-10"
          >
            &#10094;
          </button>
          <button 
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition text-xs z-10"
          >
            &#10095;
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {validImages.map((_, idx) => (
              <span 
                key={idx} 
                className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function BranchClientView() {
  const params = useParams();
  const branchId = params?.id;

  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFoodType, setSelectedFoodType] = useState('all');
  const [selectedMealTime, setSelectedMealTime] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    if (!branchId) return;
    async function loadData() {
      setLoading(true);
      const data = await fetchBranchDetails(branchId);
      setBranch(data);
      setLoading(false);
    }
    loadData();
  }, [branchId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedFoodType, selectedMealTime, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 font-medium text-sm">Loading branch & menu...</div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Branch Not Found</h2>
        <p className="text-gray-500 text-xs mb-6">The restaurant branch you are looking for does not exist or is inactive.</p>
        <Link href="/" className="bg-[#1B873D] text-white px-5 py-2.5 rounded-xl font-semibold text-sm">
          Back to Home
        </Link>
      </div>
    );
  }

  const menuItems = branch.menu_items || [];
  const categories = [...new Set(menuItems.map((item) => item.menu_category?.name).filter(Boolean))];
  const foodTypes = [...new Set(menuItems.map((item) => item.food_type?.name).filter(Boolean))];

  const filteredItems = menuItems.map((item) => {
    const catName = item.menu_category?.name;
    const foodTypeName = item.food_type?.name;

    const matchesCategory = selectedCategory === 'all' || catName === selectedCategory;
    const matchesFoodType = selectedFoodType === 'all' || foodTypeName === selectedFoodType;
    
    let matchesMeal = true;
    if (selectedMealTime === 'breakfast') matchesMeal = item.breakfast === 1;
    if (selectedMealTime === 'lunch') matchesMeal = item.lunch === 1;
    if (selectedMealTime === 'dinner') matchesMeal = item.dinner === 1;

    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return { ...item, isVisible: matchesCategory && matchesFoodType && matchesMeal && matchesSearch };
  });

  const activeFilteredItems = filteredItems.filter(item => item.isVisible);
  const totalPages = Math.ceil(activeFilteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = activeFilteredItems.slice(startIndex, startIndex + itemsPerPage);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-16">
      <div className="bg-gradient-to-br from-[#146C30] via-[#1B873D] to-[#0f5424] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            {branch.restaurant?.logo && (
              <div className="w-20 h-20 rounded-2xl bg-white shadow-md overflow-hidden shrink-0 border-2 border-white/20">
                <img 
                  src={`${IMAGE_BASE_URL}${branch.restaurant.logo}`} 
                  alt={branch.restaurant.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2 inline-block">
                {branch.restaurant?.name}
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold">{branch.name}</h1>
              <p className="text-green-100 text-xs md:text-sm mt-1.5 flex items-center gap-2">
                <span>📍 {branch.address}</span>
                <span>•</span>
                <span>🕒 {branch.open_time} - {branch.close_time}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition">
              📅 Reserve Table
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <span className="text-xs font-bold text-gray-500 mr-1">Meal:</span>
              {['all', 'breakfast', 'lunch', 'dinner'].map((meal) => (
                <button
                  key={meal}
                  onClick={() => setSelectedMealTime(meal)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                    selectedMealTime === meal
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {meal}
                </button>
              ))}
            </div>

            <div className="w-full md:w-72">
              <input
                type="text"
                placeholder="Search menu dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 text-xs text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B873D]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-gray-500 mr-1 shrink-0">Category:</span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-[#1B873D] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#1B873D] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pt-1">
            <span className="text-xs font-bold text-gray-500 mr-1 shrink-0">Type:</span>
            <button
              onClick={() => setSelectedFoodType('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                selectedFoodType === 'all'
                  ? 'bg-gray-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Types
            </button>
            {foodTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedFoodType(type)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  selectedFoodType === type
                    ? 'bg-gray-800 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Menu Items ({activeFilteredItems.length})</h2>
          </div>

          {paginatedItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-xs">No menu items found matching your filters.</p>
              <button
                onClick={() => { setSelectedCategory('all'); setSelectedFoodType('all'); setSelectedMealTime('all'); setSearchQuery(''); }}
                className="mt-3 text-xs text-[#1B873D] font-bold underline"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {paginatedItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="relative">
                        <FoodImageSlider 
                          images={[item.image_1, item.image_2, item.image_3, item.image_4, item.image_5]} 
                          itemName={item.name} 
                        />
                        
                        {item.food_type && (
                          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-gray-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs z-10">
                            {item.food_type.name}
                          </span>
                        )}

                        {item.menu_category && (
                          <span className="absolute top-3 right-3 bg-[#1B873D]/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs z-10">
                            {item.menu_category.name}
                          </span>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-base font-bold text-gray-900">{item.name}</h3>
                          <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium shrink-0">
                            Serves {item.serving_size || 1}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1 line-clamp-2">{item.description}</p>

                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {item.breakfast === 1 && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-medium border border-amber-200/50">
                              ☀️ Breakfast
                            </span>
                          )}
                          {item.lunch === 1 && (
                            <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md font-medium border border-orange-200/50">
                              🍽️ Lunch
                            </span>
                          )}
                          {item.dinner === 1 && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium border border-indigo-200/50">
                              🌙 Dinner
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0 border-t border-gray-50 mt-4 flex items-center justify-between">
                      <div>
                        {item.discount_price ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-[#1B873D]">${item.discount_price}</span>
                            <span className="text-xs text-gray-400 line-through">${item.price}</span>
                          </div>
                        ) : (
                          <span className="text-sm font-extrabold text-gray-900">${item.price}</span>
                        )}
                        <span className="text-[10px] text-gray-400 block">⏱️ {item.preparation_time || 15} mins prep</span>
                      </div>

                      <button className="bg-green-50 text-[#1B873D] hover:bg-[#1B873D] hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition">
                        + Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-12">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
                  >
                    &larr; Previous
                  </button>

                  <span className="text-sm font-semibold text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}