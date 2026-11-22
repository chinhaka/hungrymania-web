'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useFavourites } from '@/hooks/useFavourites';
import RestaurantCard from '@/components/RestaurantCard';

export default function FavouritesPage() {
  const { user, setShowLoginModal } = useAuth();
  const { favouriteBranches, loading, toggleFavourite } = useFavourites();

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center text-2xl mx-auto">
            ♥
          </div>
          <h1 className="text-xl font-extrabold text-gray-900">Sign in to view Favourites</h1>
          <p className="text-xs text-gray-500">
            Save your go-to restaurants and branches so you can book a table or browse menus faster.
          </p>
          <button
            type="button"
            onClick={() => setShowLoginModal(true)}
            className="w-full bg-[#1B873D] hover:bg-[#146C30] text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5">
          <div>
            <Link href="/" className="text-xs font-semibold text-[#1B873D] hover:underline">
              &larr; Explore Restaurants
            </Link>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-1 flex items-center gap-2">
              <span>My Favourites</span>
              <span className="text-xs font-bold bg-red-50 text-red-600 border border-red-200/80 px-2.5 py-0.5 rounded-full">
                {favouriteBranches.length}
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Your saved restaurant branches. Click the heart icon anytime to remove one.
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : favouriteBranches.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl py-16 px-6 text-center space-y-3">
            <div className="text-3xl">♡</div>
            <h2 className="text-base font-extrabold text-gray-900">No favourite restaurants yet</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Tap the heart icon on any restaurant card to save it here for quick access.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-block bg-[#1B873D] hover:bg-[#146C30] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition"
              >
                Browse Restaurants
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {favouriteBranches.map((branch) => (
              <div key={branch.id} className="relative">
                <RestaurantCard branch={branch} />
                <button
                  type="button"
                  onClick={(e) => toggleFavourite(branch.id, e)}
                  title="Remove from favourites"
                  className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition active:scale-90 cursor-pointer"
                >
                  <span className="text-sm leading-none">♥</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}