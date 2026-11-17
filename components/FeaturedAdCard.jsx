'use client';
import Link from 'next/link';
import BranchImageSlider from './BranchImageSlider';

export default function FeaturedAdCard({ branch }) {
  const showRestaurantName =
    branch.restaurant?.name &&
    branch.restaurant.name.trim().toLowerCase() !== branch.name?.trim().toLowerCase();

  return (
    <Link
      href={`/branches/${branch.id}`}
      className="bg-white border border-amber-200/90 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-300 transition-all duration-300 flex flex-col sm:flex-row group cursor-pointer"
    >
      {/* Left: Auto-Swiping Image Container */}
      <div className="w-full sm:w-56 h-52 sm:h-auto shrink-0 relative">
        <BranchImageSlider
          images={[
            branch.image_1,
            branch.image_2,
            branch.image_3,
            branch.image_4,
            branch.image_5,
          ]}
          branchName={branch.name}
          compact
        />
      </div>

      {/* Right: Branch Details */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Top Row: Name & Ad + Rating Badges */}
          <div className="flex justify-between items-start gap-2">
            <div>
              {showRestaurantName && (
                <span className="text-[10px] uppercase tracking-wider text-amber-600 font-extrabold block mb-0.5">
                  {branch.restaurant.name}
                </span>
              )}
              <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-[#1B873D] transition leading-snug">
                {branch.name}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200">
                <span className="text-amber-500 text-xs">★</span>
                <span className="text-gray-900 text-xs font-bold">{branch.rating || '4.5'}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                Ad
              </span>
            </div>
          </div>

          {/* Cuisine & Location */}
          <div className="text-xs text-gray-500 flex items-center flex-wrap gap-1.5 mt-1.5">
            <span className="text-gray-700 font-medium">
              {branch.restaurant?.cuisine_types || 'Thai • Seafood'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-gray-600 truncate max-w-[200px]">
              📍 {branch.city?.name || branch.address}
            </span>
          </div>

          {/* Open Status */}
          <div className="flex items-center gap-2 text-xs mt-2">
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Open Now
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-500">Closes at {branch.close_time || '11 PM'}</span>
          </div>
        </div>

        {/* Bottom Row: Promo & Service Pills */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-[#1B873D] bg-green-50 border border-green-200/60 px-2.5 py-1 rounded-xl text-xs font-extrabold">
            <span>🏷️</span> {branch.promo_text || '20% Off Dine-in'}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600">
            <span className="bg-slate-100 px-2 py-1 rounded-lg">🛍️ Pickup</span>
            <span className="bg-slate-100 px-2 py-1 rounded-lg">📅 Book</span>
          </div>
        </div>
      </div>
    </Link>
  );
}