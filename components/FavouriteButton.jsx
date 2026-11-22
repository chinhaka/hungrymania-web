'use client';

export default function FavouriteButton({ isFavourite, onToggle, className = '' }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
      title={isFavourite ? 'Remove from favourites' : 'Save to favourites'}
      className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm backdrop-blur-md transition transform active:scale-90 cursor-pointer ${
        isFavourite
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-white/90 text-gray-700 hover:bg-white hover:text-red-500'
      } ${className}`}
    >
      <span className="text-sm leading-none">{isFavourite ? '♥' : '♡'}</span>
    </button>
  );
}