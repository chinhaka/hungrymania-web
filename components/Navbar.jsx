'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout, setShowLoginModal, setShowRegisterModal } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs px-6 py-3 flex justify-between items-center border-b border-gray-100">
      <Link href="/" className="flex items-center">
        <img src="/images/hungrymania-logo.webp" alt="HungryMania Logo" className="h-10 w-auto object-contain" />
      </Link>
      
      <div className="flex items-center gap-4">
        {mounted && user ? (
          <>
            <Link href="/reservations" className="text-gray-700 hover:text-[#1B873D] font-medium text-sm flex items-center gap-1.5">
              📅 My Bookings
            </Link>

            <button className="relative text-gray-700 hover:text-[#1B873D] p-1.5 rounded-full hover:bg-gray-100 transition">
              🔔
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
              <span className="text-xs font-bold text-gray-800">Hi, {user.name}</span>
              <button onClick={logout} className="text-xs text-red-600 font-semibold hover:underline">
                Logout
              </button>
            </div>
          </>
        ) : mounted ? (
          <>
            <button onClick={() => setShowLoginModal(true)} className="text-gray-600 hover:text-[#1B873D] font-medium px-3 py-2 text-sm transition">
              Sign In
            </button>
            <button onClick={() => setShowRegisterModal(true)} className="bg-[#1B873D] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#146C30] shadow-sm transition">
              Register
            </button>
          </>
        ) : null}
      </div>
    </nav>
  );
}