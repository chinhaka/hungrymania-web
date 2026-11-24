'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { fetchBranches, fetchDistrictsAndCities } from '@/services/api';
import CitySelect from '@/components/CitySelect';
import FeaturedAdCard from '@/components/FeaturedAdCard';
import RestaurantCard from '@/components/RestaurantCard';
import { useFavourites } from '@/context/FavouritesContext';

function computeDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isBranchOpenNow(branch: any, now: Date | null): boolean {
  if (!now) return true;
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentMins = now.getHours() * 60 + now.getMinutes();

  const parseMins = (val?: string | null) => {
    if (!val) return null;
    const parts = String(val).trim().split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  let hoursObj = branch.opening_hours;
  if (typeof hoursObj === 'string') {
    try {
      hoursObj = JSON.parse(hoursObj);
    } catch {
      hoursObj = null;
    }
  }

  const dayEntry = hoursObj?.[dayKeys[now.getDay()]];
  if (dayEntry) {
    if (dayEntry.closed) return false;
    const slots = Array.isArray(dayEntry.slots) ? dayEntry.slots : [];
    if (slots.length > 0) {
      return slots.some((slot: any) => {
        const o = parseMins(slot?.open);
        const c = parseMins(slot?.close);
        if (o === null || c === null) return false;
        return c > o ? currentMins >= o && currentMins < c : currentMins >= o || currentMins < c;
      });
    }
  }

  const openMins = parseMins(branch.open_time);
  const closeMins = parseMins(branch.close_time);
  if (openMins === null || closeMins === null) return true;
  return closeMins > openMins
    ? currentMins >= openMins && currentMins < closeMins
    : currentMins >= openMins || currentMins < closeMins;
}

function buildRestaurantsUrl(params: Record<string, string | boolean | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val === undefined || val === '' || val === false) return;
    qs.set(key, val === true ? '1' : String(val));
  });
  const queryString = qs.toString();
  return queryString ? `/restaurants?${queryString}` : '/restaurants';
}

interface CategoryShelfProps {
  title: string;
  subtitle: string;
  icon: string;
  items: any[];
  viewMoreHref: string;
  defaultLimit?: number;
}

function CategoryShelf({
  title,
  subtitle,
  icon,
  items,
  viewMoreHref,
  defaultLimit = 3,
}: CategoryShelfProps) {
  if (!items || items.length === 0) return null;

  const visibleItems = items.slice(0, defaultLimit);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{icon}</span>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">{title}</h2>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>

        <Link
          href={viewMoreHref}
          className="text-xs font-extrabold text-[#1B873D] hover:text-[#146C30] bg-green-50 hover:bg-green-100 border border-green-200/80 px-3.5 py-2 rounded-xl transition shrink-0"
        >
          View More →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleItems.map((branch) => (
          <RestaurantCard key={`${title}-${branch.id}`} branch={branch} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { favouriteIds } = useFavourites();

  const [now, setNow] = useState<Date | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [featuredAds, setFeaturedAds] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  const [search, setSearch] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [bookingOnly, setBookingOnly] = useState<boolean>(false);
  const [pickupOnly, setPickupOnly] = useState<boolean>(false);
  const [openNowOnly, setOpenNowOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('recommended');

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadLocations() {
      const data = await fetchDistrictsAndCities();
      setDistricts(data);
    }
    loadLocations();

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const paginatedData = await fetchBranches(search, selectedCity, 1, {
        supportsBooking: bookingOnly,
        supportsPickup: pickupOnly,
        sort: sortBy,
      });
      const list = paginatedData.data || [];
      setBranches(list);

      if (Array.isArray(paginatedData.featured_ads) && paginatedData.featured_ads.length > 0) {
        setFeaturedAds(paginatedData.featured_ads);
      } else {
        setFeaturedAds(list.filter((b: any) => Boolean(b.is_paid_ad || b.is_featured || b.is_sponsored)));
      }

      setLoading(false);
    }
    loadData();
  }, [search, selectedCity, bookingOnly, pickupOnly, sortBy]);

  const quickCities = districts.flatMap((d) => d.cities || []).slice(0, 5);

  const filteredBranches = useMemo(() => {
    const list = branches.filter((branch) => {
      if (bookingOnly && branch.supports_booking === false) return false;
      if (pickupOnly && branch.supports_pickup === false) return false;
      if (openNowOnly && now && !isBranchOpenNow(branch, now)) return false;
      return true;
    });

    if (sortBy === 'rating') {
      return [...list].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }
    if (sortBy === 'reviews') {
      return [...list].sort((a, b) => Number(b.reviews_count || 0) - Number(a.reviews_count || 0));
    }
    if (sortBy === 'newest') {
      return [...list].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    }
    return list;
  }, [branches, bookingOnly, pickupOnly, openNowOnly, sortBy, now]);

  const paidAdBranches = useMemo(() => {
    return featuredAds.filter((ad) => {
      if (selectedCity && String(ad.city_id) !== String(selectedCity)) return false;
      if (bookingOnly && ad.supports_booking === false) return false;
      if (pickupOnly && ad.supports_pickup === false) return false;
      return true;
    });
  }, [featuredAds, selectedCity, bookingOnly, pickupOnly]);

  const mostRatedBranches = useMemo(() => {
    return [...filteredBranches].sort((a, b) => {
      const rDiff = Number(b.rating || 0) - Number(a.rating || 0);
      if (rDiff !== 0) return rDiff;
      return Number(b.reviews_count || 0) - Number(a.reviews_count || 0);
    });
  }, [filteredBranches]);

  const placesNearYou = useMemo(() => {
    if (userCoords) {
      return [...filteredBranches]
        .map((b) => {
          const lat = parseFloat(b.latitude ?? b.lat);
          const lng = parseFloat(b.longitude ?? b.lng);
          const dist =
            !isNaN(lat) && !isNaN(lng)
              ? computeDistanceKm(userCoords.lat, userCoords.lng, lat, lng)
              : Number.MAX_SAFE_INTEGER;
          return { branch: b, dist };
        })
        .sort((a, b) => a.dist - b.dist)
        .map((x) => x.branch);
    }

    if (selectedCity) {
      const inCity = filteredBranches.filter((b) => String(b.city_id) === String(selectedCity));
      const others = filteredBranches.filter((b) => String(b.city_id) !== String(selectedCity));
      return [...inCity, ...others];
    }

    return [...filteredBranches].reverse();
  }, [filteredBranches, userCoords, selectedCity]);

  const placesYouMayLike = useMemo(() => {
    const favIdSet = new Set((favouriteIds || []).map((id: any) => String(id)));
    const favCityIds = new Set(
      filteredBranches
        .filter((b) => favIdSet.has(String(b.id)))
        .map((b) => String(b.city_id))
    );

    return [...filteredBranches].sort((a, b) => {
      const aScore =
        (favCityIds.has(String(a.city_id)) ? 2 : 0) +
        (a.discounts && a.discounts.length > 0 ? 1 : 0) +
        Number(a.rating || 0) * 0.1;
      const bScore =
        (favCityIds.has(String(b.city_id)) ? 2 : 0) +
        (b.discounts && b.discounts.length > 0 ? 1 : 0) +
        Number(b.rating || 0) * 0.1;
      return bScore - aScore;
    });
  }, [filteredBranches, favouriteIds]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(selectedCity) ||
    bookingOnly ||
    pickupOnly ||
    openNowOnly ||
    sortBy !== 'recommended';

  const clearAllFilters = () => {
    setSearch('');
    setSelectedCity('');
    setBookingOnly(false);
    setPickupOnly(false);
    setOpenNowOnly(false);
    setSortBy('recommended');
  };

  return (
    <main className="min-h-screen bg-slate-50 text-gray-800 pb-16">
      <div className="bg-gradient-to-br from-[#146C30] via-[#1B873D] to-[#0f5424] text-white py-14 px-4 sm:px-6 text-center relative overflow-visible">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative max-w-4xl mx-auto">
          <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 inline-block">
            Explore &amp; Reserve Tables Instantly
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
            Discover the Best Restaurants &amp; Menus
          </h1>
          <p className="text-green-100 mb-7 text-sm sm:text-base md:text-lg max-w-xl mx-auto">
            Search top-rated dining spots, browse live menus, and book your next experience.
          </p>

          <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-2 max-w-3xl mx-auto">
            <CitySelect selectedCity={selectedCity} setSelectedCity={setSelectedCity} />

            <div className="w-full md:w-auto flex-[2] flex items-center px-3 py-2 border-t md:border-t-0 md:border-l border-gray-200">
              <span className="text-gray-400 mr-2">🔍</span>
              <input
                type="text"
                placeholder="Search restaurant name, location, or dish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-gray-900 font-medium text-sm focus:outline-none placeholder-gray-400"
              />
            </div>

            <Link
              href={buildRestaurantsUrl({
                city_id: selectedCity,
                search,
                supports_booking: bookingOnly,
                supports_pickup: pickupOnly,
                sort: sortBy,
              })}
              className="w-full md:w-auto bg-amber-500 text-white px-7 py-3 rounded-xl font-semibold text-sm hover:bg-amber-600 shadow-md transition text-center"
            >
              Search
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap justify-center items-center gap-2">
            <span className="text-xs text-green-200 font-medium">Quick Filter:</span>
            {quickCities.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => setSelectedCity(selectedCity === String(city.id) ? '' : String(city.id))}
                className={`text-xs px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                  selectedCity === String(city.id)
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-5 relative z-20">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:px-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOpenNowOnly((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                openNowOnly
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-gray-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🕒 Open Now
            </button>

            <button
              type="button"
              onClick={() => setBookingOnly((prev) => !prev)}
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
              onClick={() => setPickupOnly((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                pickupOnly
                  ? 'bg-[#1B873D] text-white border-[#1B873D]'
                  : 'bg-slate-50 text-gray-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🛍️ Pickup
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition cursor-pointer"
              >
                ✕ Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="home-sort-select" className="text-xs font-bold text-gray-500">
                Sort:
              </label>
              <select
                id="home-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B873D] cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="rating">Most Rated</option>
                <option value="reviews">Most Reviewed</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            <Link
              href={buildRestaurantsUrl({
                city_id: selectedCity,
                search,
                supports_booking: bookingOnly,
                supports_pickup: pickupOnly,
                sort: sortBy,
              })}
              className="hidden sm:inline-flex items-center text-xs font-extrabold text-gray-700 hover:text-[#1B873D] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-green-50 transition"
            >
              Browse All →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 space-y-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-3xl h-80 animate-pulse shadow-xs border border-slate-200 p-4"
              />
            ))}
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-gray-500 text-sm font-semibold">
              No restaurants found matching your filters.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-4 text-xs bg-green-50 text-[#1B873D] border border-green-200 px-4 py-2 rounded-xl font-extrabold hover:bg-green-100 transition cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            {paidAdBranches.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 text-lg">📣</span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
                      Featured Paid Ads
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={buildRestaurantsUrl({
                        section: 'paid_ads',
                        city_id: selectedCity,
                        search,
                        supports_booking: bookingOnly,
                        supports_pickup: pickupOnly,
                      })}
                      className="text-xs font-extrabold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition shrink-0"
                    >
                      View More →
                    </Link>
                    <span className="text-[11px] bg-amber-100 text-amber-800 font-extrabold px-2.5 py-1 rounded-lg">
                      Paid Ad
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {paidAdBranches.slice(0, 2).map((branch) => (
                    <FeaturedAdCard key={`paid-ad-${branch.id}`} branch={branch} />
                  ))}
                </div>
              </section>
            )}

            <CategoryShelf
              title="Most Rated"
              subtitle="Top-rated spots loved by diners"
              icon="⭐"
              items={mostRatedBranches}
              viewMoreHref={buildRestaurantsUrl({
                section: 'rated',
                city_id: selectedCity,
                search,
                supports_booking: bookingOnly,
                supports_pickup: pickupOnly,
              })}
            />

            <CategoryShelf
              title="Places Near You"
              subtitle={
                userCoords
                  ? 'Sorted by distance from your current location'
                  : 'Local restaurants around you'
              }
              icon="📍"
              items={placesNearYou}
              viewMoreHref={buildRestaurantsUrl({
                section: 'near_you',
                city_id: selectedCity,
                search,
                supports_booking: bookingOnly,
                supports_pickup: pickupOnly,
              })}
            />

            <CategoryShelf
              title="Places You May Like"
              subtitle="Picked based on your favourites, deals & popularity"
              icon="✨"
              items={placesYouMayLike}
              viewMoreHref={buildRestaurantsUrl({
                section: 'for_you',
                city_id: selectedCity,
                search,
                supports_booking: bookingOnly,
                supports_pickup: pickupOnly,
              })}
            />
          </>
        )}
      </div>
    </main>
  );
}