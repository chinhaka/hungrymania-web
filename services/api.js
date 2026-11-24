const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchBranches(
  searchQuery = '',
  cityId = '',
  page = 1,
  options = {}
) {
  try {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (cityId) params.append('city_id', cityId);
    if (page) params.append('page', String(page));
    if (options.section) params.append('section', options.section);
    if (options.supportsBooking) params.append('supports_booking', '1');
    if (options.supportsPickup) params.append('supports_pickup', '1');
    if (options.sort && options.sort !== 'recommended') params.append('sort', options.sort);

    const res = await fetch(`${API_URL}/branches?${params.toString()}`, {
      cache: 'no-store',
    });
    const data = await res.json();

    return {
      ...(data.branches || { data: [], current_page: 1, last_page: 1 }),
      featured_ads: data.featured_ads || [],
    };
  } catch (err) {
    console.error('Failed to fetch restaurants', err);
    return { data: [], current_page: 1, last_page: 1, featured_ads: [] };
  }
}

export async function fetchDistrictsAndCities() {
  try {
    const res = await fetch(`${API_URL}/cities`, { cache: 'no-store' });
    const data = await res.json();
    return data.districts || [];
  } catch (err) {
    console.error('Failed to fetch districts and cities', err);
    return [];
  }
}

export async function registerRestaurant(formData) {
  try {
    const res = await fetch(`${API_URL}/restaurants/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    return await res.json();
  } catch (err) {
    console.error('Restaurant registration failed', err);
    return { status: false, message: 'Network or server error' };
  }
}

export async function registerUser(formData) {
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    return await res.json();
  } catch (err) {
    return { status: false, message: 'Network or server error' };
  }
}

export async function loginUser(credentials) {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return await res.json();
  } catch (err) {
    return { status: false, message: 'Network or server error' };
  }
}

export async function googleAuthApi(googleData) {
  try {
    const res = await fetch(`${API_URL}/google-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleData),
    });
    return await res.json();
  } catch (err) {
    return { status: false, message: 'Network or server error' };
  }
}

export async function fetchBranchDetails(branchId) {
  try {
    const res = await fetch(`${API_URL}/branches/${branchId}`, {
      cache: 'no-store',
    });
    const data = await res.json();
    return data.branch || null;
  } catch (err) {
    console.error('Failed to fetch restaurant details', err);
    return null;
  }
}