'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { fetchBranchDetails } from '@/services/api';
import Link from 'next/link';
import MenuSearchFilters from '@/components/MenuSearchFilters';
import MealCard from '@/components/MealCard';
import ReserveTableModal from '@/components/ReserveTableModal';
import FavouriteButton from '@/components/FavouriteButton';
import { useFavourites } from '@/context/FavouritesContext';

const IMAGE_BASE_URL =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'http://localhost/hungrymenia-api/public/uploads/';

const DAYS_OF_WEEK = [
  { key: 'sunday', label: 'Sunday' },
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
];

interface WeeklyDayItem {
  key: string;
  label: string;
  isToday: boolean;
  closed: boolean;
  labelText: string;
}

interface ScheduleSummary {
  isOpen: boolean;
  todayText: string;
  weeklyList: WeeklyDayItem[];
  hasCustomWeekly: boolean;
}

function parseTimeToMinutes(timeStr: any): number | null {
  if (!timeStr) return null;
  const clean = String(timeStr).trim().toUpperCase();

  const ampmMatch = clean.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(AM|PM)$/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2] || '0', 10);
    const period = ampmMatch[3];
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  const parts = clean.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      return hours * 60 + minutes;
    }
  }

  return null;
}

function formatDisplayTime(timeStr: any): string {
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return timeStr ? String(timeStr) : '';
  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function parseOpeningHours(openingHours: any): Record<string, any> | null {
  if (!openingHours) return null;
  if (typeof openingHours === 'string') {
    try {
      return JSON.parse(openingHours);
    } catch {
      return null;
    }
  }
  return typeof openingHours === 'object' ? openingHours : null;
}

function getScheduleSummary(branch: any, now = new Date()): ScheduleSummary {
  const parsedHours = parseOpeningHours(branch.opening_hours);
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const todayIndex = now.getDay();
  const todayKey = DAYS_OF_WEEK[todayIndex].key;

  const weeklyList: WeeklyDayItem[] = DAYS_OF_WEEK.map((day, idx) => {
    const entry = parsedHours?.[day.key];
    if (entry) {
      if (entry.closed) {
        return { ...day, isToday: idx === todayIndex, closed: true, labelText: 'Closed' };
      }
      const slots = Array.isArray(entry.slots)
        ? entry.slots.filter((s: any) => s?.open && s?.close)
        : [];
      const text =
        slots.length > 0
          ? slots
              .map((s: any) => `${formatDisplayTime(s.open)} – ${formatDisplayTime(s.close)}`)
              .join(', ')
          : `${formatDisplayTime(branch.open_time)} – ${formatDisplayTime(branch.close_time)}`;
      return { ...day, isToday: idx === todayIndex, closed: false, labelText: text };
    }

    const fallbackOpen = formatDisplayTime(branch.open_time) || '8:00 AM';
    const fallbackClose = formatDisplayTime(branch.close_time) || '10:00 PM';
    return {
      ...day,
      isToday: idx === todayIndex,
      closed: false,
      labelText: `${fallbackOpen} – ${fallbackClose}`,
    };
  });

  if (parsedHours && parsedHours[todayKey]) {
    const todayEntry = parsedHours[todayKey];
    if (todayEntry.closed) {
      return { isOpen: false, todayText: 'Closed today', weeklyList, hasCustomWeekly: true };
    }

    const slots = Array.isArray(todayEntry.slots)
      ? todayEntry.slots.filter((s: any) => s?.open && s?.close)
      : [];
    if (slots.length > 0) {
      const todayText = slots
        .map((s: any) => `${formatDisplayTime(s.open)} – ${formatDisplayTime(s.close)}`)
        .join(', ');

      const isWithinAnySlot = slots.some((slot: any) => {
        const openMins = parseTimeToMinutes(slot.open);
        const closeMins = parseTimeToMinutes(slot.close);
        if (openMins === null || closeMins === null) return false;
        if (closeMins > openMins) return currentMins >= openMins && currentMins < closeMins;
        if (closeMins < openMins) return currentMins >= openMins || currentMins < closeMins;
        return true;
      });

      return { isOpen: isWithinAnySlot, todayText, weeklyList, hasCustomWeekly: true };
    }
  }

  const openMins = parseTimeToMinutes(branch.open_time);
  const closeMins = parseTimeToMinutes(branch.close_time);
  const formattedOpen = formatDisplayTime(branch.open_time);
  const formattedClose = formatDisplayTime(branch.close_time);
  const todayText =
    formattedOpen && formattedClose ? `${formattedOpen} – ${formattedClose}` : 'Hours available';

  let openNow = true;
  if (openMins !== null && closeMins !== null) {
    if (closeMins > openMins) openNow = currentMins >= openMins && currentMins < closeMins;
    else if (closeMins < openMins) openNow = currentMins >= openMins || currentMins < closeMins;
  }

  return { isOpen: openNow, todayText, weeklyList, hasCustomWeekly: Boolean(parsedHours) };
}

function BranchContent() {
  const params = useParams();
  const branchId = params?.id as string | undefined;
  const { isFavourite, toggleFavourite } = useFavourites();

  const [branch, setBranch] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [isReserveOpen, setIsReserveOpen] = useState<boolean>(false);
  const [reservationBanner, setReservationBanner] = useState<string | null>(null);
  const [showHoursDrawer, setShowHoursDrawer] = useState<boolean>(false);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFoodType, setSelectedFoodType] = useState<string>('all');
  const [selectedMealTime, setSelectedMealTime] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [bannerIndex, setBannerIndex] = useState<number>(0);
  const [scheduleInfo, setScheduleInfo] = useState<ScheduleSummary | null>(null);
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

  const refreshSchedule = useCallback(() => {
    if (!branch) return;
    setScheduleInfo(getScheduleSummary(branch, new Date()));
  }, [branch]);

  useEffect(() => {
    refreshSchedule();
    const interval = setInterval(refreshSchedule, 60000);
    return () => clearInterval(interval);
  }, [refreshSchedule]);

  const branchPhotos: string[] = branch
    ? [branch.image_1, branch.image_2, branch.image_3, branch.image_4, branch.image_5].filter(
        Boolean
      )
    : [];

  useEffect(() => {
    if (branchPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % branchPhotos.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [branchPhotos.length]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedFoodType, selectedMealTime, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-gray-500 font-semibold text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1B873D] animate-ping" />
          <span>Loading restaurant &amp; menu...</span>
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md shadow-xs">
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Restaurant Not Found</h2>
          <p className="text-gray-500 text-xs mb-6">
            The restaurant you are looking for does not exist or is currently inactive.
          </p>
          <Link
            href="/restaurants"
            className="inline-flex items-center justify-center bg-[#1B873D] hover:bg-[#146C30] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition"
          >
            &larr; Back to Restaurants
          </Link>
        </div>
      </div>
    );
  }

  const restaurantName = branch.restaurant?.name?.trim() || branch.name?.trim() || 'Restaurant';
  const showBranchSubtitle =
    branch.name &&
    branch.restaurant?.name &&
    branch.restaurant.name.trim().toLowerCase() !== branch.name.trim().toLowerCase();

  const supportsBooking =
    branch.supports_booking !== undefined ? Boolean(branch.supports_booking) : true;
  const supportsPickup =
    branch.supports_pickup !== undefined ? Boolean(branch.supports_pickup) : true;
  const hasReviewsCount =
    branch.reviews_count !== undefined &&
    branch.reviews_count !== null &&
    Number(branch.reviews_count) > 0;

  const menuItems: any[] = branch.menu_items || [];
  const categories: string[] = [
    ...new Set(menuItems.map((item: any) => item.menu_category?.name).filter(Boolean)),
  ];
  const foodTypes: string[] = [
    ...new Set(menuItems.map((item: any) => item.food_type?.name).filter(Boolean)),
  ];

  const filteredItems = menuItems.map((item: any) => {
    const catName = item.menu_category?.name;
    const foodTypeName = item.food_type?.name;

    const matchesCategory = selectedCategory === 'all' || catName === selectedCategory;
    const matchesFoodType = selectedFoodType === 'all' || foodTypeName === selectedFoodType;

    let matchesMeal = true;
    if (selectedMealTime === 'breakfast') matchesMeal = item.breakfast === 1;
    if (selectedMealTime === 'lunch') matchesMeal = item.lunch === 1;
    if (selectedMealTime === 'dinner') matchesMeal = item.dinner === 1;

    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return {
      ...item,
      isVisible: matchesCategory && matchesFoodType && matchesMeal && matchesSearch,
    };
  });

  const activeFilteredItems = filteredItems.filter((item: any) => item.isVisible);
  const totalPages = Math.ceil(activeFilteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = activeFilteredItems.slice(startIndex, startIndex + itemsPerPage);

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedFoodType !== 'all' ||
    selectedMealTime !== 'all' ||
    searchQuery.trim() !== '';

  const getImageUrl = (path: string) =>
    path.startsWith('http') ? path : `${IMAGE_BASE_URL}${path}`;

  return (
    <main className="min-h-screen bg-slate-50 text-gray-900 pb-20">
      <div className="relative h-72 sm:h-80 md:h-[22rem] w-full overflow-hidden bg-neutral-900">
        {branchPhotos.length > 0 ? (
          branchPhotos.map((photo, idx) => (
            <img
              key={idx}
              src={getImageUrl(photo)}
              alt={`${restaurantName} photo ${idx + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${
                idx === bannerIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            />
          ))
        ) : (
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
            alt={restaurantName}
            className="w-full h-full object-cover opacity-75"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/25" />

        <div className="absolute top-4 inset-x-0 px-4 sm:px-6 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/restaurants"
              className="inline-flex items-center gap-1.5 bg-black/45 hover:bg-black/65 text-white text-xs font-bold px-3.5 py-2 rounded-full backdrop-blur-md border border-white/15 transition"
            >
              <span>&larr;</span>
              <span>All Restaurants</span>
            </Link>

            <div className="flex items-center gap-2.5">
              {branchPhotos.length > 1 && (
                <div className="flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  {branchPhotos.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      aria-label={`Slide ${idx + 1}`}
                      onClick={() => setBannerIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === bannerIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}

              <FavouriteButton
                isFavourite={isFavourite(branch.id)}
                onToggle={(e: any) => toggleFavourite(branch.id, e)}
              />
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 pb-6 sm:pb-8 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-end gap-4 sm:gap-5">
            {branch.restaurant?.logo && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-white shadow-xl overflow-hidden shrink-0 border-2 border-white/40">
                <img
                  src={getImageUrl(branch.restaurant.logo)}
                  alt={restaurantName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="text-white min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                {showBranchSubtitle && (
                  <span className="bg-white/15 text-white border border-white/25 text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md">
                    {branch.name}
                  </span>
                )}

                <span className="inline-flex items-center gap-1 bg-black/45 text-white border border-white/15 text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md">
                  <span className="text-amber-400">★</span>
                  <span>{branch.rating || '4.5'}</span>
                  <span className="text-white/70">
                    {hasReviewsCount ? `(${branch.reviews_count})` : '(-)'}
                  </span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight truncate">
                {restaurantName}
              </h1>

              <p className="text-gray-200 text-xs sm:text-sm mt-1 truncate">
                📍 {branch.address}
                {branch.city?.name ? `, ${branch.city.name}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-4 relative z-20 space-y-6">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
              {scheduleInfo && (
                <button
                  type="button"
                  onClick={() => setShowHoursDrawer((prev) => !prev)}
                  className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  {scheduleInfo.isOpen ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-extrabold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Open
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-red-600 font-extrabold">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Closed
                    </span>
                  )}
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-700 font-semibold">{scheduleInfo.todayText}</span>
                  <span className="text-[10px] text-[#1B873D] font-extrabold ml-0.5">
                    {showHoursDrawer ? 'Hide ▲' : 'Hours ▼'}
                  </span>
                </button>
              )}

              {supportsBooking && (
                <span className="inline-flex items-center gap-1.5 bg-green-50 text-[#146C30] border border-green-200/70 px-3 py-1.5 rounded-xl font-bold">
                  <span>📅</span>
                  <span>Bookings</span>
                </span>
              )}

              {supportsPickup && (
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-gray-800 border border-slate-200/70 px-3 py-1.5 rounded-xl font-bold">
                  <span>🛍️</span>
                  <span>Pickup</span>
                </span>
              )}

              {branch.phone && (
                <a
                  href={`tel:${branch.phone}`}
                  className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-gray-700 border border-slate-200/70 px-3 py-1.5 rounded-xl font-semibold transition"
                >
                  <span>📞</span>
                  <span>{branch.phone}</span>
                </a>
              )}
            </div>

            {supportsBooking && (
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsReserveOpen(true)}
                  className="w-full sm:w-auto bg-[#1B873D] hover:bg-[#146C30] text-white px-5 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>📅</span>
                  <span>Reserve a Table</span>
                </button>
              </div>
            )}
          </div>

          {showHoursDrawer && scheduleInfo?.weeklyList && (
            <div className="pt-3.5 border-t border-slate-100">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2.5">
                Weekly Opening Hours
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {scheduleInfo.weeklyList.map((day) => (
                  <div
                    key={day.key}
                    className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                      day.isToday
                        ? 'bg-green-50/80 border-green-200 text-gray-900 font-bold'
                        : 'bg-slate-50/70 border-slate-200/70 text-gray-700'
                    }`}
                  >
                    <span className="truncate">
                      {day.label}
                      {day.isToday && (
                        <span className="ml-1.5 text-[10px] font-extrabold text-[#1B873D]">
                          (Today)
                        </span>
                      )}
                    </span>
                    <span
                      className={`text-[11px] shrink-0 ${
                        day.closed ? 'text-red-600 font-bold' : 'text-gray-600 font-medium'
                      }`}
                    >
                      {day.labelText}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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

        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
                Menu{' '}
                <span className="text-gray-400 font-bold text-base">
                  ({activeFilteredItems.length})
                </span>
              </h2>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedFoodType('all');
                  setSelectedMealTime('all');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-[#1B873D] hover:underline cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>

          {paginatedItems.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="text-2xl mb-2">🍽️</div>
              <p className="text-gray-700 font-bold text-sm">No menu items found</p>
              <p className="text-gray-400 text-xs mt-1">
                Try adjusting your search or clearing active filters.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedFoodType('all');
                    setSelectedMealTime('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 bg-green-50 text-[#1B873D] border border-green-200 px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-green-100 transition cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {paginatedItems.map((item: any) => (
                  <MealCard
                    key={item.id}
                    item={item}
                    branchDiscounts={branch.discounts || []}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 pt-8">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                  >
                    &larr; Previous
                  </button>

                  <span className="text-xs font-bold text-gray-600 px-2">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {supportsBooking && (
        <ReserveTableModal
          branch={branch}
          isOpen={isReserveOpen}
          onClose={() => setIsReserveOpen(false)}
          onSuccess={(created: any) =>
            setReservationBanner(
              `Reservation ${created.reservation_code} submitted and is pending branch approval.`
            )
          }
        />
      )}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-pulse text-gray-400 font-medium text-sm">
            Loading restaurant &amp; menu...
          </div>
        </div>
      }
    >
      <BranchContent />
    </Suspense>
  );
}