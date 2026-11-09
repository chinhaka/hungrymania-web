'use client';
import { useState } from 'react';
import { registerRestaurant } from '@/services/api';
import { useRouter } from 'next/navigation';

export default function RegisterRestaurantPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    restaurant_name: '',
    registration_number: '',
    email: '',
    phone: '',
    city_id: 1, // Default city ID for sample
    branch_name: 'Main Branch',
    address: '',
    admin_name: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await registerRestaurant(form);
    setLoading(false);

    if (res.status) {
      alert('Registration successful!');
      router.push('/');
    } else {
      setError(res.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Register Your Restaurant</h1>
        <p className="text-gray-600 text-sm mb-6">Join HungryMania and start managing branches & menus.</p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Restaurant Name</label>
            <input type="text" name="restaurant_name" required onChange={handleChange} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Registration Number</label>
              <input type="text" name="registration_number" required onChange={handleChange} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Phone</label>
              <input type="text" name="phone" required onChange={handleChange} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Branch Name (e.g. Downtown Branch)</label>
            <input type="text" name="branch_name" required onChange={handleChange} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Branch Address</label>
            <input type="text" name="address" required onChange={handleChange} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none" />
          </div>

          <hr className="my-4" />

          <div>
            <label className="block text-sm font-medium text-gray-700">Admin Full Name</label>
            <input type="text" name="admin_name" required onChange={handleChange} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Admin Email</label>
            <input type="email" name="email" required onChange={handleChange} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" name="password" required onChange={handleChange} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none" />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            {loading ? 'Submitting...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}