'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'http://localhost/hungrymenia-api/public/uploads/';

export default function RestaurantRegistrationSuccessPage() {
  const router = useRouter();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = sessionStorage.getItem('hungrymenia_registered_restaurant');
      if (storedData) {
        try {
          setSummary(JSON.parse(storedData));
        } catch (e) {
          console.error('Failed to parse registration summary', e);
        }
      } else {
        // If accessed directly without registration data, redirect to home
        router.push('/');
      }
    }
  }, [router]);

  if (!summary) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B873D]"></div>
      </div>
    );
  }

  const { restaurant, branches } = summary;

  // Build image URL helper
  const getImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${IMAGE_BASE_URL}${path}`;
  };

  const handleOpenLogin = () => {
    // If you use a custom event or context state to open your site-wide login modal:
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-login-modal'));
    }
    router.push('/?action=login');
  };

  return (
    <main className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Success Header Banner */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 text-[#1B873D] text-3xl flex items-center justify-center rounded-full mx-auto font-bold shadow-xs">
            ✓
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Registration Complete! 🎉</h1>
          <p className="text-xs text-gray-600 max-w-lg mx-auto">
            Your restaurant <span className="font-bold text-gray-900">{restaurant?.name}</span> has been successfully listed on HungryMenia. Below is a summary of your registered business details.
          </p>

          {/* Action Call to Login */}
          <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-3">
            <button
              onClick={handleOpenLogin}
              className="w-full sm:w-auto bg-[#1B873D] hover:bg-[#146C30] text-white px-8 py-3 rounded-2xl font-extrabold text-xs shadow-md transition cursor-pointer"
            >
              Click Here to Login to Your Dashboard 🚀
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-gray-800 px-6 py-3 rounded-2xl font-bold text-xs transition text-center"
            >
              Return to Home
            </Link>
          </div>
        </div>

        {/* Restaurant Profile Summary Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
            Restaurant Profile
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Logo Preview */}
            {restaurant?.logo ? (
              <img
                src={getImageUrl(restaurant.logo)}
                alt={`${restaurant.name} Logo`}
                className="w-24 h-24 object-cover rounded-2xl border border-gray-200 shadow-xs bg-slate-50"
              />
            ) : (
              <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center text-gray-400 font-bold text-xs">
                No Logo
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs w-full">
              <div>
                <span className="text-gray-400 font-medium">Restaurant Name:</span>
                <p className="font-bold text-gray-900 text-sm">{restaurant?.name}</p>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Registration No:</span>
                <p className="font-bold text-gray-900">{restaurant?.registration_number || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Business Email:</span>
                <p className="font-bold text-gray-900">{restaurant?.email}</p>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Business Phone:</span>
                <p className="font-bold text-gray-900">{restaurant?.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Registered Branches Summary */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider px-2">
            Registered Branches ({branches?.length || 0})
          </h2>

          {branches && branches.map((branch, idx) => {
            // Collect all uploaded branch photos (image_1 to image_5)
            const photos = [
              branch.image_1,
              branch.image_2,
              branch.image_3,
              branch.image_4,
              branch.image_5
            ].filter(Boolean);

            return (
              <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h3 className="text-sm font-extrabold text-gray-900">
                    Branch #{idx + 1}: {branch.name}
                  </h3>
                  <span className="bg-green-50 text-[#1B873D] text-[10px] font-extrabold px-3 py-1 rounded-full border border-green-200">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 font-medium">Address:</span>
                    <p className="font-bold text-gray-900">{branch.address}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Contact Phone:</span>
                    <p className="font-bold text-gray-900">{branch.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Operating Hours:</span>
                    <p className="font-bold text-gray-900">{branch.open_time} - {branch.close_time}</p>
                  </div>
                </div>

                {/* Branch Photos Gallery */}
                {photos.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-bold text-gray-700 block mb-2">Branch Photos:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {photos.map((photo, pIdx) => (
                        <img
                          key={pIdx}
                          src={getImageUrl(photo)}
                          alt={`Branch ${idx + 1} Photo ${pIdx + 1}`}
                          className="h-20 w-full object-cover rounded-xl border border-gray-200 shadow-xs"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </main>
  );
}