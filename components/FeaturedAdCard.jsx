'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import BranchImageSlider from './BranchImageSlider';
import FavouriteButton from './FavouriteButton';
import { useFavourites } from '@/context/FavouritesContext';

function parseTimeToMinutes(timeStr) {
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

function formatDisplayTime(timeStr) {
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return timeStr || '';
  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function FeaturedAdCard({ branch }) {
  const [isOpen, setIsOpen] = useState(null);
  const { isFavourite, toggleFavourite } = useFavourites();

  const restaurantName = branch.restaurant?.name?.trim() || branch.name?.trim() || 'Restaurant';
  const branchLocation = (branch.city?.name || branch.name || '').trim();

  const hasDistinctBranchLocation =
    branchLocation &&
    branchLocation.toLowerCase() !== restaurantName.toLowerCase() &&
    !restaurantName.toLowerCase().includes(branchLocation.toLowerCase());

  const displayTitle = hasDistinctBranchLocation
    ? `${restaurantName} - ${branchLocation}`
    : restaurantName;

  useEffect(() => {
    function checkOpenStatus() {
      const openMins = parseTimeToMinutes(branch.open_time);
      const closeMins = parseTimeToMinutes(branch.close_time);

      if (openMins === null || closeMins === null) {
        setIsOpen(true);
        return;
      }

      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();

      if (closeMins > openMins) {
        setIsOpen(currentMins >= openMins && currentMins < closeMins);
      } else if (closeMins < openMins) {
        setIsOpen(currentMins >= openMins || currentMins < closeMins);
      } else {
        setIsOpen(true);
      }
    }

    checkOpenStatus();
    const interval = setInterval(checkOpenStatus, 60000);
    return () => clearInterval(interval);
  }, [branch.open_time, branch.close_time]);

  const formattedOpen = formatDisplayTime(branch.open_time);
  const formattedClose = formatDisplayTime(branch.close_time);

  return (
    <Link
      href={`/branches/${branch.id}`}
      className="bg-white border border-amber-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-amber-300 transition-all duration-200 flex flex-col sm:flex-row group cursor-pointer"
    >
      {/* Left: Compact Image Slider + Favourite Button */}
      <div className="w-full sm:w-44 h-36 sm:h-auto shrink-0 relative">
        <BranchImageSlider
          images={[
            branch.image_1,
            branch.image_2,
            branch.image_3,
            branch.image_4,
            branch.image_5,
          ]}
          branchName={displayTitle}
          compact
        />

        <FavouriteButton
          isFavourite={isFavourite(branch.id)}
          onToggle={(e) => toggleFavourite(branch.id, e)}
          className="absolute top-2.5 left-2.5 z-20"
        />
      </div>

      {/* Right: Compact Branch Details */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-sm font-extrabold text-gray-900 group-hover:text-[#1B873D] transition leading-snug line-clamp-1">
              {displayTitle}
            </h3>

            <div className="flex items-center gap-1 shrink-0">
              <div className="flex items-center gap-0.5 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/80">
                <span className="text-amber-500 text-[11px]">★</span>
                <span className="text-gray-900 text-[11px] font-bold">{branch.rating || '4.5'}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                Ad
              </span>
            </div>
          </div>

          <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-1 truncate">
            <span className="text-gray-700 font-medium truncate">
              {branch.restaurant?.cuisine_types || 'Thai • Seafood'}
            </span>
            <span>•</span>
            <span className="text-gray-600 truncate">
              📍 {branch.city?.name || branch.address}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] mt-1.5 truncate">
            {isOpen === null ? (
              <span className="text-gray-400 font-medium">Checking hours...</span>
            ) : isOpen ? (
              <>
                <span className="flex items-center gap-1 text-emerald-600 font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Open
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500 truncate">Closes {formattedClose || '11:00 PM'}</span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1 text-red-600 font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  Closed
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500 truncate">Opens {formattedOpen || '08:00 AM'}</span>
              </>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[#1B873D] bg-green-50 border border-green-200/60 px-2 py-0.5 rounded-lg text-[11px] font-extrabold truncate">
            <span>🏷️</span> {branch.promo_text || '20% Off'}
          </div>

          <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-600 shrink-0">
            <span className="bg-slate-100 px-1.5 py-0.5 rounded-md">🛍️ Pickup</span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded-md">📅 Book</span>
          </div>
        </div>
      </div>
    </Link>
  );
}