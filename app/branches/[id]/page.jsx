'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { fetchBranchDetails } from '@/services/api';
import Link from 'next/link';
import MenuSearchFilters from '@/components/MenuSearchFilters';
import MealCard from '@/components/MealCard';
import ReserveTableModal from '@/components/ReserveTableModal';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'http://localhost/hungrymenia-api/public/uploads/';

function BranchContent() {
  const params = useParams();
  const branchId = params?.id;

  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [reservationBanner, setReservationBanner] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFoodType, setSelectedFoodType] = useState('all');
  const [selectedMealTime, setSelectedMealTime] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [bannerIndex, setBannerIndex] = useState(0);
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

  const branchPhotos = branch ? [
    branch.image_1,
    branch.image_2,
    branch.image_3,
    branch.image_4,
    branch.image_5
  ].filter(Boolean) : [];

  useEffect(() => {
    if (branchPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % branchPhotos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [branchPhotos.length]);

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

  const showRestaurantName = branch.restaurant?.name && branch.restaurant.name.trim().toLowerCase() !== branch.name?.trim().toLowerCase();

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

  const getImageUrl = (path) => path.startsWith('http') ? path : `${IMAGE_BASE_URL}${path}`;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-16">
      {/* Modern Hero Showcase */}
      <div className="relative h-80 md:h-96 w-full overflow-hidden bg-neutral-900">
        {branchPhotos.length > 0 ? (
          branchPhotos.map((photo, idx) => (
            <img
              key={idx}
              src={getImageUrl(photo)}
              alt={`${branch.name} hero ${idx + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                idx === bannerIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            />
          ))
        ) : (
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
            alt={branch.name}
            className="w-full h-full object-cover opacity-80"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />

        <div className="absolute inset-0 flex items-end pb-8 px-6">
          <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="flex items-center gap-5">
              {branch.restaurant?.logo && (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white shadow-xl overflow-hidden shrink-0 border-2 border-white/30">
                  <img 
                    src={getImageUrl(branch.restaurant.logo)} 
                    alt={branch.restaurant.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="text-white">
                {showRestaurantName && (
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2 inline-block backdrop-blur-md">
                    {branch.restaurant?.name}
                  </span>
                )}
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{branch.name}</h1>
                <p className="text-gray-200 text-xs md:text-sm mt-2 flex items-center flex-wrap gap-2">
                  <span>📍 {branch.address}</span>
                  <span>•</span>
                  <span>🕒 {branch.open_time} - {branch.close_time}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsReserveOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl transition cursor-pointer"
              >
                📅 Reserve Table
              </button>
            </div>
          </div>
        </div>

        {branchPhotos.length > 1 && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full z-10">
            {branchPhotos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setBannerIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === bannerIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        {reservationBanner && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-5 py-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-4 shadow-xs">
            <span>✅ {reservationBanner}</span>
            <button
              type="button"
              onClick={() => setReservationBanner(null)}
              className="text-green-700 hover:text-green-950 font-extrabold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <MenuSearchFilters 
          selectedMealTime={selectedMealTime}
          setSelectedMealTime={setSelectedMealTime}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          selectedFoodType={selectedFoodType}
          setSelectedFoodType={setSelectedFoodType}
          foodTypes={foodTypes}
        />

        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-extrabold text-gray-900">Menu Items ({activeFilteredItems.length})</h2>
          </div>

          {paginatedItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
              <p className="text-gray-400 text-xs">No menu items found matching your filters.</p>
              <button
                onClick={() => { setSelectedCategory('all'); setSelectedFoodType('all'); setSelectedMealTime('all'); setSearchQuery(''); }}
                className="mt-3 text-xs text-[#1B873D] font-bold underline cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {paginatedItems.map((item) => (
                  <MealCard key={item.id} item={item} branchDiscounts={branch.discounts || []} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-12">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs cursor-pointer"
                  >
                    &larr; Previous
                  </button>

                  <span className="text-sm font-semibold text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs cursor-pointer"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ReserveTableModal
        branch={branch}
        isOpen={isReserveOpen}
        onClose={() => setIsReserveOpen(false)}
        onSuccess={(created) =>
          setReservationBanner(
            `Reservation ${created.reservation_code} submitted and is pending branch approval.`
          )
        }
      />
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 font-medium text-sm">Loading branch & menu...</div>
      </div>
    }>
      <BranchContent />
    </Suspense>
  );
}