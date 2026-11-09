const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchBranches(searchQuery = '', cityId = '', page = 1) {
  try {
    const res = await fetch(`${API_URL}/branches?search=${searchQuery}&city_id=${cityId}&page=${page}`, {
      cache: 'no-store'
    });
    const data = await res.json();
    // Return the whole paginated object so we can read last_page and current_page
    return data.branches || { data: [], current_page: 1, last_page: 1 };
  } catch (err) {
    console.error('Failed to fetch branches', err);
    return { data: [], current_page: 1, last_page: 1 };
  }
}

// Fixed to return data.districts matching your API response
export async function fetchDistrictsAndCities() {
  try {
    const res = await fetch(`${API_URL}/cities`, { cache: 'no-store' });
    const data = await res.json();
    console.log('Fetched districts and cities:', data.districts); // Debugging log
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
      cache: 'no-store'
    });
    const data = await res.json();
    return data.branch || null;
  } catch (err) {
    console.error('Failed to fetch branch details', err);
    return null;
  }
}