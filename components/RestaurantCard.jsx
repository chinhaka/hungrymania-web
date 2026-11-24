'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import BranchImageSlider from './BranchImageSlider';
import FavouriteButton from './FavouriteButton';
import { useFavourites } from '@/context/FavouritesContext';
import { getBranchPromoSummary } from '@/utils/discountHelper';

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

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

function parseOpeningHours(openingHours) {
  if (!openingHours) return null;
  if (typeof openingHours === 'string') {
    try {
      return JSON.parse(openingHours);
    } catch (_) {
      return null;
    }
  }
  return typeof openingHours === 'object' ? openingHours : null;
}

function getTodayScheduleInfo(branch, now = new Date()) {
  const parsedHours = parseOpeningHours(branch.opening_hours);
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const dayKey = DAY_KEYS[now.getDay()];

  if (parsedHours && parsedHours[dayKey]) {
    const dayEntry = parsedHours[dayKey];

    if (dayEntry.closed) {
      return {
        isOpen: false,
        hoursText: 'Closed today',
      };
    }

    const slots = Array.isArray(dayEntry.slots) && dayEntry.slots.length > 0 ? dayEntry.slots : [];
    if (slots.length > 0) {
      const formattedSlots = slots
        .filter((s) => s?.open && s?.close)
        .map((s) => `${formatDisplayTime(s.open)} - ${formatDisplayTime(s.close)}`);

      const isWithinAnySlot = slots.some((slot) => {
        const openMins = parseTimeToMinutes(slot.open);
        const closeMins = parseTimeToMinutes(slot.close);
        if (openMins === null || closeMins === null) return false;
        if (closeMins > openMins) {
          return currentMins >= openMins && currentMins < closeMins;
        }
        if (closeMins < openMins) {
          return currentMins >= openMins || currentMins < closeMins;
        }
        return true;
      });

      return {
        isOpen: isWithinAnySlot,
        hoursText: formattedSlots.join(', ') || 'Hours available',
      };
    }
  }

  const openMins = parseTimeToMinutes(branch.open_time);
  const closeMins = parseTimeToMinutes(branch.close_time);
  const formattedOpen = formatDisplayTime(branch.open_time);
  const formattedClose = formatDisplayTime(branch.close_time);
  const hoursText =
    formattedOpen && formattedClose ? `${formattedOpen} - ${formattedClose}` : 'Hours available';

  if (openMins === null || closeMins === null) {
    return { isOpen: true, hoursText };
  }

  let openNow = false;
  if (closeMins > openMins) {
    openNow = currentMins >= openMins && currentMins < closeMins;
  } else if (closeMins < openMins) {
    openNow = currentMins >= openMins || currentMins < closeMins;
  } else {
    openNow = true;
  }

  return { isOpen: openNow, hoursText };
}

export default function RestaurantCard({ branch }) {
  const [statusInfo, setStatusInfo] = useState(null);
  const { isFavourite, toggleFavourite } = useFavourites();

  const restaurantName = branch.restaurant?.name?.trim() || branch.name?.trim() || 'Restaurant';
  const locationLabel = branch.city?.name || branch.address || '';

  const evaluateStatus = useCallback(() => {
    setStatusInfo(getTodayScheduleInfo(branch, new Date()));
  }, [branch]);

  useEffect(() => {
    evaluateStatus();
    const interval = setInterval(evaluateStatus, 60000);
    return () => clearInterval(interval);
  }, [evaluateStatus]);

  const promoLabel = getBranchPromoSummary(branch);
  const supportsBooking = branch.supports_booking !== undefined ? Boolean(branch.supports_booking) : true;
  const supportsPickup = branch.supports_pickup !== undefined ? Boolean(branch.supports_pickup) : true;

  const hasReviewsCount =
    branch.reviews_count !== undefined &&
    branch.reviews_count !== null &&
    Number(branch.reviews_count) > 0;

  return (
    <Link
      href={`/restaurants/${branch.id}`}
      className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col group cursor-pointer"
    >
      {/* Compact Image Slider + Favourite Toggle */}
      <div className="h-40 w-full shrink-0 relative">
        <BranchImageSlider
          images={[
            branch.image_1,
            branch.image_2,
            branch.image_3,
            branch.image_4,
            branch.image_5,
          ]}
          branchName={restaurantName}
        />

        <FavouriteButton
          isFavourite={isFavourite(branch.id)}
          onToggle={(e) => toggleFavourite(branch.id, e)}
          className="absolute top-2.5 left-2.5 z-20"
        />
      </div>

      {/* Compact Card Details */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div className="space-y-1.5">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-sm font-extrabold text-gray-900 group-hover:text-[#1B873D] transition leading-snug line-clamp-1">
              {restaurantName}
            </h3>
            <div className="flex items-center gap-0.5 shrink-0 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/80">
              <span className="text-amber-500 text-[11px]">★</span>
              <span className="text-gray-900 text-[11px] font-bold">{branch.rating || '4.5'}</span>
              <span className="text-gray-400 text-[10px]">
                {hasReviewsCount ? `(${branch.reviews_count})` : '(-)'}
              </span>
            </div>
          </div>

          {locationLabel && (
            <div className="text-[11px] text-gray-600 truncate">
              📍 {locationLabel}
            </div>
          )}

          {(supportsBooking || supportsPickup) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {supportsBooking && (
                <span className="text-[10px] font-bold bg-slate-100 text-gray-700 px-2 py-0.5 rounded-md">
                  📅 Bookings
                </span>
              )}
              {supportsPickup && (
                <span className="text-[10px] font-bold bg-slate-100 text-gray-700 px-2 py-0.5 rounded-md">
                  🛍️ Pickup
                </span>
              )}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 min-w-0">
            {statusInfo === null ? (
              <span className="text-gray-400 font-medium">Checking hours...</span>
            ) : statusInfo.isOpen ? (
              <>
                <span className="flex items-center gap-1 text-emerald-600 font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Open
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-600 font-medium truncate">{statusInfo.hoursText}</span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1 text-red-600 font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  Closed
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-600 font-medium truncate">{statusInfo.hoursText}</span>
              </>
            )}
          </div>

          {promoLabel && (
            <span className="text-[#1B873D] bg-green-50 border border-green-200/60 px-2 py-0.5 rounded-lg font-extrabold shrink-0">
              🏷️ {promoLabel}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}