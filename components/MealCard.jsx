'use client';
import { useState, useEffect } from 'react';
import {
  calculateDiscountedPrice,
  getBestMenuItemDiscount,
} from '@/utils/discountHelper';

const IMAGE_BASE_URL =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'http://localhost/hungrymenia-api/public/uploads/';

export default function MealCard({ item, branchDiscounts = [] }) {
  const photos = [
    item.image_1,
    item.image_2,
    item.image_3,
    item.image_4,
    item.image_5,
  ].filter(Boolean);

  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (photos.length <= 1) return;
    const interval = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [photos.length]);

  const getImageUrl = (path) => (path.startsWith('http') ? path : `${IMAGE_BASE_URL}${path}`);

  const allDiscounts =
    branchDiscounts.length > 0 ? branchDiscounts : item.branch_discounts || [];
  const activeDiscount = getBestMenuItemDiscount(item, allDiscounts);
  const pricing = calculateDiscountedPrice(item.price, activeDiscount);

  const mealTimes = [
    item.breakfast === 1 || item.breakfast === true ? 'Breakfast' : null,
    item.lunch === 1 || item.lunch === true ? 'Lunch' : null,
    item.dinner === 1 || item.dinner === true ? 'Dinner' : null,
  ].filter(Boolean);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col">
      {/* Dish Image */}
      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
        {photos.length > 0 ? (
          <img
            src={getImageUrl(photos[photoIndex])}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <img
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
            alt={item.name}
            className="w-full h-full object-cover"
          />
        )}

        {/* Active Discount Pill */}
        {pricing.hasDiscount && (
          <span className="absolute top-2.5 left-2.5 bg-[#1B873D] text-white text-[11px] font-extrabold px-2.5 py-1 rounded-xl shadow-md">
            🏷️ {pricing.label}
            {activeDiscount?.scope === 'menu_item' ? ' on Dish' : ''}
          </span>
        )}

        {item.is_featured === 1 || item.is_featured === true ? (
          <span className="absolute top-2.5 right-2.5 bg-amber-400 text-gray-950 text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-xs">
            ⭐ Featured
          </span>
        ) : null}
      </div>

      {/* Dish Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500">
            <span className="font-semibold text-[#1B873D]">
              {item.menu_category?.name || 'Menu Item'}
            </span>
            {item.food_type?.name && (
              <span className="bg-slate-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                {item.food_type.name}
              </span>
            )}
          </div>

          <h3 className="text-sm font-extrabold text-gray-900 leading-snug">{item.name}</h3>

          {item.description && (
            <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
          )}

          <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-1">
            {item.serving_size && <span>🍽️ {item.serving_size} Persons</span>}
            {item.preparation_time && <span>⏱️ {item.preparation_time} mins</span>}
          </div>

          {mealTimes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {mealTimes.map((meal) => (
                <span
                  key={meal}
                  className="text-[10px] font-semibold bg-slate-50 border border-slate-200 text-gray-600 px-2 py-0.5 rounded-md"
                >
                  {meal}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price Row */}
        <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
          {pricing.hasDiscount ? (
            <div className="flex items-baseline gap-2">
              <span className="text-base font-extrabold text-[#1B873D]">
                Rs {pricing.finalPrice}
              </span>
              <span className="text-xs text-gray-400 line-through">
                Rs {pricing.originalPrice}
              </span>
            </div>
          ) : (
            <span className="text-base font-extrabold text-gray-900">
              Rs {pricing.originalPrice}
            </span>
          )}

          {activeDiscount?.promo_code && (
            <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
              Code: {activeDiscount.promo_code}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}