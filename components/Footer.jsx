'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [currentYear, setCurrentYear] = useState('');

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <img src="/images/hungrymania-logo.webp" alt="HungryMania Logo" className="h-9 w-auto brightness-200 mb-4" />
          <p className="text-xs text-gray-400 leading-relaxed">
            Discover, reserve tables, and order food seamlessly from your favorite restaurant branches.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3">For Customers</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/" className="hover:text-amber-400">Search Restaurants</Link></li>
            <li><Link href="/reservations" className="hover:text-amber-400">My Reservations</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3">For Restaurant Owners</h4>
          <p className="text-xs text-gray-400 mb-3">Want to register your restaurant and manage branches?</p>
          <Link href="/register/restaurant" className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition">
            Register Restaurant Here
          </Link>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3">Contact</h4>
          <p className="text-xs text-gray-400">Support: support@hungrymania.com</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
        © {currentYear} HungryMania. All rights reserved.
      </div>
    </footer>
  );
}