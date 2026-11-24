'use client';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchBranches } from '@/services/api';
import CitySelect from '@/components/CitySelect';
import RestaurantCard from '@/components/RestaurantCard';

const SECTION_META: Record<string, { title: string; subtitle: string; icon: string }> = {
  paid_ads: {
    title: 'Featured Paid Ads',
    subtitle: 'Promoted restaurants & spotlight offers',
    icon: '📣',
  },
  rated: {
    title: 'Most Rated',
    subtitle: 'Top-rated restaurants loved by diners',
    icon: '⭐',
  },
  near_you: {
    title: 'Places Near You',
    subtitle: 'Restaurants close to your location or selected city',
    icon: '📍',
  },
  for_you: {
    title: 'Places You May Like',
    subtitle: 'Curated picks with active promotions & strong ratings',
    icon: '✨',
  },
};

function RestaurantsListingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const section = searchParams.get('section') || '';
  const initialCity = searchParams.get('city_id') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialBooking = searchParams.get('supports_booking') === '1';
  const initialPickup = searchParams.get('supports_pickup') === '1';
  const initialSort = searchParams.get('sort') || (section === 'rated' ? 'rating' : 'recommended');
  const initialPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [branches, setBranches] = useState<any[]>([]);
  const [search, setSearch] = useState<string>(initialSearch);
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [bookingOnly, setBookingOnly] = useState<boolean>(initialBooking);
  const [pickupOnly, setPickupOnly] = useState<boolean>(initialPickup);
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [lastPage, setLastPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setSearch(initialSearch);
    setSelectedCity(initialCity);
    setBookingOnly(initialBooking);
    setPickupOnly(initialPickup);
    setSortBy(initialSort);
    setCurrentPage(initialPage);
  }, [initialSearch, initialCity, initialBooking, initialPickup, initialSort, initialPage]);

  const syncUrl = (next: {
    section?: string;
    city_id?: string;
    search?: string;
    supports_booking?: boolean;
    supports_pickup?: boolean;
    sort?: string;
    page?: number;
  }) => {
    const qs = new URLSearchParams();
    const s = next.section !== undefined ? next.section : section;
    const c = next.city_id !== undefined ? next.city_id : selectedCity;
    const q = next.search !== undefined ? next.search : search;
    const b = next.supports_booking !== undefined ? next.supports_booking : bookingOnly;
    const p = next.supports_pickup !== undefined ? next.supports_pickup : pickupOnly;
    const so = next.sort !== undefined ? next.sort : sortBy;
    const pg = next.page !== undefined ? next.page : currentPage;

    if (s) qs.set('section', s);
    if (c) qs.set('city_id', c);
    if (q.trim()) qs.set('search', q.trim());
    if (b) qs.set('supports_booking', '1');
    if (p) qs.set('supports_pickup', '1');
    if (so && so !== 'recommended') qs.set('sort', so);
    if (pg > 1) qs.set('page', String(pg));

    const queryString = qs.toString();
    router.replace(queryString ? `/restaurants?${queryString}` : '/restaurants', { scroll: false });
  };

  useEffect(() => {
    async function loadRestaurants() {
      setLoading(true);
      const data = await fetchBranches(search, selectedCity, currentPage, {
        section,
        supportsBooking: bookingOnly,
        supportsPickup: pickupOnly,
        sort: sortBy,
      });
      setBranches(data.data || []);
      setLastPage(data.last_page || 1);
      setTotalCount(data.total ?? (data.data ? data.data.length : 0));
      setLoading(false);
    }
    loadRestaurants();
  }, [search, selectedCity, currentPage, section, bookingOnly, pickupOnly, sortBy]);

  const meta = useMemo(() => {
    return (
      SECTION_META[section] || {
        title: 'All Restaurants',
        subtitle: 'Browse all available dining spots',
        icon: '🍽️',
      }
    );
  }, [section]);

  const handlePageChange = (nextPage: number) => {
    const clamped = Math.min(Math.max(nextPage, 1), lastPage);
    setCurrentPage(clamped);
    syncUrl({ page: clamped });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-gray-800 pb-16">
      <div className="bg-gradient-to-br from-[#146C30] via-[#1B873D] to-[#0f5424] text-white py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-green-100 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-full transition"
            >
              <span>&larr;</span>
              <span>Back to Home</span>
            </Link>

            {section && (
              <Link
                href="/restaurants"
                className="text-xs font-bold text-amber-200 hover:text-white underline"
              >
                View All Restaurants
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl">{meta.icon}</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{meta.title}</h1>
              <p className="text-green-100 text-xs sm:text-sm mt-0.5">{meta.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-5 relative z-20 space-y-6">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <CitySelect
              selectedCity={selectedCity}
              setSelectedCity={(val: string) => {
                setSelectedCity(val);
                setCurrentPage(1);
                syncUrl({ city_id: val, page: 1 });
              }}
            />

            <div className="w-full md:w-auto flex-[2] flex items-center px-3 py-2 border-t md:border-t-0 md:border-l border-gray-200">
              <span className="text-gray-400 mr-2">🔍</span>
              <input
                type="text"
                placeholder="Search restaurant name or address..."
                value={search}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearch(val);
                  setCurrentPage(1);
                  syncUrl({ search: val, page: 1 });
                }}
                className="w-full bg-transparent text-gray-900 font-medium text-sm focus:outline-none placeholder-gray-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const nextVal = !bookingOnly;
                  setBookingOnly(nextVal);
                  setCurrentPage(1);
                  syncUrl({ supports_booking: nextVal, page: 1 });
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  bookingOnly
                    ? 'bg-[#1B873D] text-white border-[#1B873D]'
                    : 'bg-slate-50 text-gray-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                📅 Bookings
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextVal = !pickupOnly;
                  setPickupOnly(nextVal);
                  setCurrentPage(1);
                  syncUrl({ supports_pickup: nextVal, page: 1 });
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  pickupOnly
                    ? 'bg-[#1B873D] text-white border-[#1B873D]'
                    : 'bg-slate-50 text-gray-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🛍️ Pickup
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="restaurants-sort" className="text-xs font-bold text-gray-500">
                Sort:
              </label>
              <select
                id="restaurants-sort"
                value={sortBy}
                onChange={(e) => {
                  const val = e.target.value;
                  setSortBy(val);
                  setCurrentPage(1);
                  syncUrl({ sort: val, page: 1 });
                }}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B873D] cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="rating">Most Rated</option>
                <option value="reviews">Most Reviewed</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 font-bold">
          <span>
            {loading ? 'Loading restaurants...' : `${totalCount} restaurant${totalCount === 1 ? '' : 's'} found`}
          </span>
          {lastPage > 1 && (
            <span>
              Page {currentPage} of {lastPage}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white rounded-3xl h-80 animate-pulse shadow-xs border border-slate-200 p-4"
              />
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-gray-500 text-sm font-semibold">
              No restaurants found matching your filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCity('');
                setBookingOnly(false);
                setPickupOnly(false);
                setSortBy('recommended');
                setCurrentPage(1);
                router.replace(section ? `/restaurants?section=${section}` : '/restaurants');
              }}
              className="mt-4 text-xs bg-green-50 text-[#1B873D] border border-green-200 px-4 py-2 rounded-xl font-extrabold hover:bg-green-100 transition cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branches.map((branch) => (
                <RestaurantCard key={branch.id} branch={branch} />
              ))}
            </div>

            {lastPage > 1 && (
              <div className="flex justify-center items-center gap-3 pt-8">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                >
                  &larr; Previous
                </button>

                <span className="text-xs font-bold text-gray-600 px-2">
                  Page {currentPage} of {lastPage}
                </span>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === lastPage}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function RestaurantsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-pulse text-gray-400 font-semibold text-sm">
            Loading restaurants...
          </div>
        </div>
      }
    >
      <RestaurantsListingContent />
    </Suspense>
  );
}