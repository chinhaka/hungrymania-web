'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchBranches, fetchDistrictsAndCities } from '@/services/api';
import CitySelect from '@/components/CitySelect';

interface BranchImageSliderProps {
  images: (string | null)[];
  branchName: string;
}

const baseImageUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'http://localhost/hungrymenia-api/public/storage/';

function BranchImageSlider({ images, branchName }: BranchImageSliderProps) {
  const validImages = images.filter(Boolean) as string[];
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  if (validImages.length === 0) {
    return (
      <div className="h-52 bg-gray-100 relative">
        <img 
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4" 
          alt={branchName} 
          className="w-full h-full object-cover" 
        />
      </div>
    );
  }

  const nextImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const prevImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  return (
    <div className="h-52 bg-gray-100 relative overflow-hidden group">
      <img 
        src={`${baseImageUrl}${validImages[currentIndex]}`} 
        alt={`${branchName} photo ${currentIndex + 1}`}
        className="w-full h-full object-cover transition duration-300"
      />
      
      {validImages.length > 1 && (
        <>
          <button 
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition text-xs"
          >
            &#10094;
          </button>
          <button 
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition text-xs"
          >
            &#10095;
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {validImages.map((_: string, idx: number) => (
              <span 
                key={idx} 
                className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}

      <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-[11px] font-bold px-3 py-1 rounded-full text-[#1B873D] shadow-xs">
        Open
      </span>
    </div>
  );
}

export default function Home() {
  const [branches, setBranches] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadLocations() {
      const data = await fetchDistrictsAndCities();
      setDistricts(data);
    }
    loadLocations();
  }, []);

  // Reset page to 1 whenever search query or city filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCity]);

  // Fetch branches whenever search, selectedCity, or currentPage changes
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const paginatedData = await fetchBranches(search, selectedCity, currentPage);
      setBranches(paginatedData.data || []);
      setLastPage(paginatedData.last_page || 1);
      setLoading(false);
    }
    loadData();
  }, [search, selectedCity, currentPage]);

  const sponsoredBranches = branches.slice(0, 2);
  const quickCities = districts.flatMap(d => d.cities || []).slice(0, 5);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#146C30] via-[#1B873D] to-[#0f5424] text-white py-16 px-6 text-center relative overflow-visible">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative max-w-4xl mx-auto">
          <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 inline-block">
            Explore & Reserve Tables Instantly
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Discover the Best Restaurants & Menus
          </h1>
          <p className="text-green-100 mb-8 text-base md:text-lg max-w-xl mx-auto">
            Search top-rated dining spots, browse live menus, and book your next experience.
          </p>
          
          {/* Smart Search Bar & Select2 City Breakdown Filter */}
          <div className="bg-white p-3 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-2 max-w-3xl mx-auto">
            <CitySelect selectedCity={selectedCity} setSelectedCity={setSelectedCity} />

            <div className="w-full md:w-auto flex-[2] flex items-center px-3 py-2 border-t md:border-t-0 md:border-l border-gray-200">
              <span className="text-gray-400 mr-2">🔍</span>
              <input 
                type="text" 
                placeholder="Search restaurant name, category, or dish..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-gray-900 font-medium text-sm focus:outline-none placeholder-gray-400"
              />
            </div>

            <button className="w-full md:w-auto bg-amber-500 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-amber-600 shadow-md transition">
              Search
            </button>
          </div>

          {/* Quick Location Chips */}
          <div className="mt-6 flex flex-wrap justify-center items-center gap-2">
            <span className="text-xs text-green-200 font-medium">Quick Filter:</span>
            {quickCities.map((city) => (
              <button
                key={city.id}
                onClick={() => setSelectedCity(selectedCity === String(city.id) ? '' : String(city.id))}
                className={`text-xs px-3 py-1 rounded-full font-medium transition ${
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

      {/* Paid Ads Section */}
      {sponsoredBranches.length > 0 && currentPage === 1 && (
        <div className="max-w-7xl mx-auto px-6 pt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-amber-500 text-lg">⭐</span>
              <h2 className="text-xl font-bold text-gray-900">Featured & Sponsored Ads</h2>
            </div>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-md">Promoted</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sponsoredBranches.map((branch) => (
              <div key={`ad-${branch.id}`} className="bg-gradient-to-r from-amber-500/10 via-white to-white border border-amber-200/60 rounded-2xl shadow-sm p-4 flex gap-4 items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
                  Ad
                </div>
                <div className="w-28 h-28 rounded-xl overflow-hidden shrink-0">
                  <img 
                    src={branch.image_1 ? `${baseImageUrl}${branch.image_1}` : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'} 
                    alt={branch.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">{branch.restaurant?.name}</span>
                  <h3 className="text-lg font-bold text-gray-900">{branch.name}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">📍 {branch.address}</p>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs text-[#1B873D] font-semibold bg-green-50 px-2 py-0.5 rounded-md">Open Now</span>
                    <button className="text-xs bg-[#1B873D] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#146C30] transition">
                      Book Table &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Restaurant Branches Listing Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">All Restaurant Branches</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-72 animate-pulse shadow-xs p-4"></div>
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 text-base">No restaurant branches found matching your search.</p>
            <button 
              onClick={() => { setSearch(''); setSelectedCity(''); }}
              className="mt-4 text-sm text-[#1B873D] font-semibold underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {branches.map((branch) => (
                <div key={branch.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group">
                  <BranchImageSlider 
                    images={[branch.image_1, branch.image_2, branch.image_3]} 
                    branchName={branch.name} 
                  />
                  
                  <div className="p-5">
                    <span className="text-xs uppercase tracking-wider text-amber-600 font-bold">{branch.restaurant?.name}</span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">{branch.name}</h3>
                    <p className="text-gray-500 text-xs mt-1">📍 {branch.address}</p>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-xs text-gray-400">🕒 {branch.open_time} - {branch.close_time}</span>
                      {/* <button className="text-[#1B873D] font-bold text-xs hover:underline flex items-center gap-1">
                        View Menu &rarr;
                      </button> */}

                      {/* Link to the dynamic inner branch page */}
                    <Link 
                      href={`/branches/${branch.id}`} 
                      className="text-[#1B873D] font-bold text-xs hover:underline flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-xl transition"
                    >
                      View More &rarr;
                    </Link>

                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {lastPage > 1 && (
              <div className="flex justify-center items-center gap-3 mt-12">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
                >
                  &larr; Previous
                </button>

                <span className="text-sm font-semibold text-gray-600">
                  Page {currentPage} of {lastPage}
                </span>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, lastPage))}
                  disabled={currentPage === lastPage}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
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