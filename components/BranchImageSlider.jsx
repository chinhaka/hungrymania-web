'use client';
import { useState, useEffect } from 'react';

const baseImageUrl =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'http://localhost/hungrymenia-api/public/uploads/';

export default function BranchImageSlider({
  images,
  branchName,
  compact = false,
}) {
  const validImages = (images || []).filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (validImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validImages.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [validImages.length]);

  const getImageUrl = (path) =>
    path.startsWith('http') ? path : `${baseImageUrl}${path}`;

  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100 group">
      {validImages.length > 0 ? (
        validImages.map((img, idx) => (
          <img
            key={idx}
            src={getImageUrl(img)}
            alt={`${branchName} photo ${idx + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
              idx === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          />
        ))
      ) : (
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
          alt={branchName}
          className="w-full h-full object-cover"
        />
      )}

      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25 pointer-events-none" />

      {/* Hover Navigation Arrows */}
      {validImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs cursor-pointer z-10"
            aria-label="Previous photo"
          >
            &#10094;
          </button>
          <button
            type="button"
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs cursor-pointer z-10"
            aria-label="Next photo"
          >
            &#10095;
          </button>
        </>
      )}

      {/* Bottom Left: Glass Action Pills (Full Card Mode) */}
      {!compact && (
        <div className="absolute bottom-3.5 left-3.5 flex items-center gap-2 z-10">
          <span className="bg-black/40 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md">
            <span>🛍️</span> Pickup
          </span>
          <span className="bg-black/40 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md">
            <span>📅</span> Book Table
          </span>
        </div>
      )}

      {/* Slide Indicator Dots */}
      {validImages.length > 1 && (
        <div
          className={`absolute ${
            compact ? 'bottom-2.5 left-1/2 -translate-x-1/2' : 'bottom-4 right-3.5'
          } flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-2 py-1 rounded-full z-10`}
        >
          {validImages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentIndex ? 'w-3.5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}