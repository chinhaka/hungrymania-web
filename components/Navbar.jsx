'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CustomerNotificationsBell } from '@/components/CustomerNotificationsBell';

export default function Navbar() {
  const { user, logout, setShowLoginModal, setShowRegisterModal } = useAuth();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [opsOpen, setOpsOpen] = useState(false);

  const opsRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menus automatically when route changes
  useEffect(() => {
    setMobileOpen(false);
    setOpsOpen(false);
  }, [pathname]);

  // Close Branch Ops dropdown on outside click or Escape
  useEffect(() => {
    function handleOutside(e) {
      if (opsRef.current && !opsRef.current.contains(e.target)) {
        setOpsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setOpsOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const roleId = Number(user?.role_id);
  const isOwner = user && roleId === 50 && Boolean(user?.branch_id);
  const isManager = user && [50, 51].includes(roleId);
  const canViewBranchReservations = user && [50, 51, 52].includes(roleId) && Boolean(user?.branch_id);
  const managementBranchId = user?.branch_id || user?.restaurant_branch_id || 1;

  const branchOpsLinks = [
    ...(canViewBranchReservations
      ? [{ href: '/reservations/manage', label: 'Reservations Queue', icon: '📋' }]
      : []),
    ...(isManager
      ? [
          { href: `/branches/${managementBranchId}/menu/manage`, label: 'Manage Menu', icon: '⚙️' },
          { href: '/discounts/manage', label: 'Discounts & Promos', icon: '🏷️' },
          { href: '/tables/manage', label: 'Tables & Floor Plan', icon: '🪑' },
        ]
      : []),
    ...(isOwner ? [{ href: '/team/manage', label: 'Team & Staff', icon: '👥' }] : []),
  ];

  const isOpsActive = branchOpsLinks.some((item) => pathname?.startsWith(item.href));

  const navLinkClass = (href) =>
    `px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
      pathname === href
        ? 'bg-green-50 text-[#1B873D]'
        : 'text-gray-700 hover:text-[#1B873D] hover:bg-slate-50'
    }`;

  return (
    <header className="bg-white/90 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-6 min-w-0">
          <Link href="/" className="flex items-center shrink-0 group">
            <img
              src="/images/hungrymania-logo.webp"
              alt="HungryMania Logo"
              className="h-9 sm:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </Link>

          {/* Desktop Primary Nav */}
          {mounted && user && (
            <nav className="hidden lg:flex items-center gap-1">
              <Link href="/my-reservations" className={navLinkClass('/my-reservations')}>
                <span>📅</span>
                <span>My Bookings</span>
              </Link>

              <Link href="/favourites" className={navLinkClass('/favourites')}>
                <span>❤️</span>
                <span>Favourites</span>
              </Link>

              {/* Grouped Branch Operations Dropdown */}
              {branchOpsLinks.length > 0 && (
                <div className="relative ml-1" ref={opsRef}>
                  <button
                    type="button"
                    onClick={() => setOpsOpen((prev) => !prev)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      isOpsActive || opsOpen
                        ? 'bg-[#1B873D] text-white border-[#1B873D] shadow-xs'
                        : 'bg-green-50/80 text-[#146C30] border-green-200/80 hover:bg-green-100'
                    }`}
                  >
                    <span>🏪</span>
                    <span>Branch Ops</span>
                    <span className={`text-[10px] transition-transform duration-150 ${opsOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {opsOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50">
                      <div className="px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 border-b border-slate-100">
                        Branch Management
                      </div>
                      {branchOpsLinks.map((item) => {
                        const active = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`px-3.5 py-2.5 text-xs font-bold flex items-center gap-2.5 transition ${
                              active
                                ? 'bg-green-50 text-[#1B873D]'
                                : 'text-gray-700 hover:bg-slate-50 hover:text-[#1B873D]'
                            }`}
                          >
                            <span className="text-sm">{item.icon}</span>
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </nav>
          )}
        </div>

        {/* Right: Actions + User Controls + Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {mounted && user ? (
            <>
              <CustomerNotificationsBell user={user} />

              <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-green-100 text-[#146C30] font-extrabold text-xs flex items-center justify-center uppercase">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-extrabold text-gray-900 max-w-[120px] truncate">
                    {user.name}
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-[11px] text-red-600 font-semibold hover:underline cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
              </div>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileOpen}
                className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-800 flex items-center justify-center text-base font-bold transition cursor-pointer"
              >
                {mobileOpen ? '✕' : '☰'}
              </button>
            </>
          ) : mounted ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="text-gray-700 hover:text-[#1B873D] hover:bg-slate-50 font-semibold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="bg-[#1B873D] hover:bg-[#146C30] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
              >
                Register
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile Collapsible Menu */}
      {mounted && user && mobileOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200/80 px-4 py-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between px-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-green-100 text-[#146C30] font-extrabold text-xs flex items-center justify-center uppercase shrink-0">
                {user.name?.charAt(0) || 'U'}
              </div>
              <span className="text-xs font-extrabold text-gray-900 truncate">Hi, {user.name}</span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0"
            >
              Logout
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/my-reservations"
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                pathname === '/my-reservations'
                  ? 'bg-green-50 text-[#1B873D] border-green-200'
                  : 'bg-slate-50 text-gray-700 border-slate-200/70'
              }`}
            >
              <span>📅</span>
              <span>My Bookings</span>
            </Link>

            <Link
              href="/favourites"
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                pathname === '/favourites'
                  ? 'bg-green-50 text-[#1B873D] border-green-200'
                  : 'bg-slate-50 text-gray-700 border-slate-200/70'
              }`}
            >
              <span>❤️</span>
              <span>Favourites</span>
            </Link>
          </div>

          {branchOpsLinks.length > 0 && (
            <div className="pt-1 space-y-1.5">
              <div className="px-1 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                Branch Operations
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {branchOpsLinks.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
                        active
                          ? 'bg-[#1B873D] text-white border-[#1B873D]'
                          : 'bg-white text-gray-700 border-slate-200 hover:bg-green-50 hover:text-[#1B873D]'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}