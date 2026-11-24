'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { registerUser, loginUser, googleAuthApi } from '@/services/api';

export default function AuthModals() {
  const { 
    showLoginModal, setShowLoginModal, 
    showRegisterModal, setShowRegisterModal, 
    login 
  } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!showLoginModal && !showRegisterModal) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await loginUser({ email, password });
    setLoading(false);

    if (res.status) {
      localStorage.setItem('hungrymenia_token', res.token);
      login(res.user);
      setShowLoginModal(false);
      setEmail(''); setPassword('');
    } else {
      setError(res.message || 'Invalid email or password');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await registerUser({ name, email, password });
    setLoading(false);

    if (res.status) {
      localStorage.setItem('hungrymenia_token', res.token);
      login(res.user);
      setShowRegisterModal(false);
      setName(''); setEmail(''); setPassword('');
    } else {
      setError(res.message || 'Registration failed');
    }
  };

  // Simulated Google / Gmail Sign-in Handler (Can be replaced with Firebase or Google Auth SDK)
  const handleGoogleAuth = async () => {
    // For demonstration, simulating google profile response
    const googleData = {
      name: 'Google User',
      email: `googleuser_${Date.now()}@gmail.com`
    };

    const res = await googleAuthApi(googleData);
    if (res.status) {
      localStorage.setItem('hungrymenia_token', res.token);
      login(res.user);
      setShowLoginModal(false);
      setShowRegisterModal(false);
    } else {
      setError('Google Authentication failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      {/* Login Popup */}
      {showLoginModal && (
        <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-left">
          <button 
            onClick={() => setShowLoginModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold"
          >
            ✕
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h2>
          <p className="text-xs text-gray-500 mb-6">Log in to manage bookings and view notifications.</p>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-xs font-medium">{error}</div>}

          {/* Gmail / Google Sign In Button */}
          <button 
            onClick={handleGoogleAuth}
            className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 mb-4 transition shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Gmail
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 text-xs text-gray-400 uppercase font-medium">Or Email</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 text-sm text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B873D] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 text-sm text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B873D] outline-none" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#1B873D] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#146C30] transition shadow-md">
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-4">
            Don't have an account?{' '}
            <button onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); setError(''); }} className="text-[#1B873D] font-bold hover:underline">
              Register here
            </button>
          </p>
        </div>
      )}

      {/* Register Popup */}
      {showRegisterModal && (
        <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-left">
          <button 
            onClick={() => setShowRegisterModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold"
          >
            ✕
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Create User Account</h2>
          <p className="text-xs text-gray-500 mb-6">Join HungryMania to book tables & order online.</p>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-xs font-medium">{error}</div>}

          {/* Gmail / Google Register Button */}
          <button 
            onClick={handleGoogleAuth}
            className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 mb-4 transition shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Gmail
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 text-xs text-gray-400 uppercase font-medium">Or Email</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 text-sm text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B873D] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 text-sm text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B873D] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 text-sm text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B873D] outline-none" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#1B873D] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#146C30] transition shadow-md">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-4">
            Already have an account?{' '}
            <button onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); setError(''); }} className="text-[#1B873D] font-bold hover:underline">
              Log in
            </button>
          </p>
        </div>
      )}
    </div>
  );
}