'use client';
import { useState, useEffect, useRef } from 'react';
import { fetchDistrictsAndCities } from '@/services/api';

export default function CitySelect({ selectedCity, setSelectedCity }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchDistrictsAndCities();
      setDistricts(data);
      setLoading(false);
    }
    loadData();

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  let selectedCityName = 'All Locations';
  if (selectedCity) {
    for (const district of districts) {
      const found = district.cities?.find((c) => String(c.id) === String(selectedCity));
      if (found) {
        selectedCityName = `${found.name} (${district.name})`;
        break;
      }
    }
  }

  const filteredDistricts = districts.map((district) => {
    const matchingCities = district.cities?.filter((city) =>
      city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      district.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      ...district,
      cities: matchingCities,
    };
  }).filter((district) => district.cities && district.cities.length > 0);

  return (
    <div className="relative flex-1 min-w-[220px]" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-full flex items-center justify-between px-4 py-3 cursor-pointer select-none text-gray-700 text-sm bg-transparent"
      >
        <div className="flex items-center truncate">
          <span className="text-gray-400 mr-2 text-base">📍</span>
          <span className="truncate font-semibold text-gray-800">{selectedCityName}</span>
        </div>
        <span className="text-xs text-gray-400 ml-2">&#9662;</span>
      </div>

      {/* Dropdown Menu Popup - High z-index and shadow to ensure it floats on top */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[999] overflow-hidden text-left">
          {/* Search Box */}
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <input
              type="text"
              autoFocus
              placeholder="Search district or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B873D]"
            />
          </div>

          {/* District & City Breakdown List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            <div
              onClick={() => {
                setSelectedCity('');
                setIsOpen(false);
                setSearchQuery('');
              }}
              className="px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-[#1B873D] cursor-pointer transition font-medium bg-gray-50/50"
            >
              🌍 All Locations
            </div>

            {loading ? (
              <div className="p-6 text-center text-xs text-gray-400">Loading locations...</div>
            ) : filteredDistricts.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">No locations found</div>
            ) : (
              filteredDistricts.map((district) => (
                <div key={district.id} className="py-1">
                  <div className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50/50">
                    {district.name}
                  </div>

                  {district.cities.map((city) => (
                    <div
                      key={city.id}
                      onClick={() => {
                        setSelectedCity(String(city.id));
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`px-6 py-2.5 text-sm cursor-pointer transition flex justify-between items-center ${
                        String(selectedCity) === String(city.id)
                          ? 'bg-green-50 text-[#1B873D] font-bold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{city.name}</span>
                      <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {city.branches_count || 0} ads
                      </span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}