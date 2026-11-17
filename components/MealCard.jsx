'use client';
import { useState } from 'react';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'http://localhost/hungrymenia-api/public/uploads/';

export default function MealCard({ item }) {
  const validImages = [
    item.image_1,
    item.image_2,
    item.image_3,
    item.image_4,
    item.image_5
  ].filter(Boolean);

  const [currentIndex, setCurrentIndex] = useState(0);

  const getImageUrl = (path) => (path.startsWith('http') ? path : `${IMAGE_BASE_URL}${path}`);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden flex flex-col justify-between hover:shadow-lg transition group">
      <div>
        {/* Image Slider Container */}
        <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
          {validImages.length > 0 ? (
            validImages.map((img, idx) => (
              <img
                key={idx}
                src={getImageUrl(img)}
                alt={`${item.name} photo ${idx + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                  idx === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
              />
            ))
          ) : (
            <img
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
              alt={item.name}
              className="w-full h-full object-cover"
            />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

          {/* Food Type & Category Badges */}
          {item.food_type && (
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-xs z-10">
              {item.food_type.name}
            </span>
          )}
          {item.menu_category && (
            <span className="absolute top-3 right-3 bg-[#1B873D]/90 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-xs z-10">
              {item.menu_category.name}
            </span>
          )}

          {/* Slide Indicators */}
          {validImages.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/30 backdrop-blur-md px-2 py-1 rounded-full z-10">
              {validImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex ? 'w-3.5 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-5">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-base font-extrabold text-gray-900">{item.name}</h3>
            <span className="text-[11px] bg-slate-100 text-gray-600 px-2.5 py-1 rounded-xl font-bold shrink-0 border border-slate-200">
              Serves {item.serving_size || 1}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1.5 line-clamp-2">{item.description}</p>

          <div className="flex flex-wrap gap-1.5 mt-3.5">
            {item.breakfast === 1 && (
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-bold border border-amber-200/60">
                ☀️ Breakfast
              </span>
            )}
            {item.lunch === 1 && (
              <span className="text-[10px] bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg font-bold border border-orange-200/60">
                🍽️ Lunch
              </span>
            )}
            {item.dinner === 1 && (
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-bold border border-indigo-200/60">
                🌙 Dinner
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Pricing & CTA */}
      <div className="p-5 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
        <div>
          {item.discount_price ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-[#1B873D]">${item.discount_price}</span>
              <span className="text-xs text-gray-400 line-through">${item.price}</span>
            </div>
          ) : (
            <span className="text-sm font-extrabold text-gray-900">${item.price}</span>
          )}
          <span className="text-[10px] text-gray-400 block mt-0.5">⏱️ {item.preparation_time || 15} mins prep</span>
        </div>

        <button className="bg-green-50 text-[#1B873D] hover:bg-[#1B873D] hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">
          + Add
        </button>
      </div>
    </div>
  );
}