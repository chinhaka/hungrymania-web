'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/hungrymenia-api/public/api';

export function useFavourites() {
  const { user, setShowLoginModal } = useAuth();
  const [favouriteIds, setFavouriteIds] = useState([]);
  const [favouriteBranches, setFavouriteBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFavourites = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hungrymenia_token') : null;
    if (!user || !token) {
      setFavouriteIds([]);
      setFavouriteBranches([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/favourites`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.status) {
        setFavouriteIds(data.favourite_ids || []);
        setFavouriteBranches(data.branches || []);
      }
    } catch (err) {
      console.error('Failed to fetch favourites:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavourites();
  }, [fetchFavourites]);

  const isFavourite = useCallback(
    (branchId) => favouriteIds.some((id) => Number(id) === Number(branchId)),
    [favouriteIds]
  );

  const toggleFavourite = async (branchId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('hungrymenia_token') : null;
    if (!user || !token) {
      if (setShowLoginModal) setShowLoginModal(true);
      return;
    }

    const numId = Number(branchId);
    const currentlyFav = isFavourite(numId);

    // Optimistic UI update
    setFavouriteIds((prev) =>
      currentlyFav ? prev.filter((id) => Number(id) !== numId) : [...prev, numId]
    );
    if (currentlyFav) {
      setFavouriteBranches((prev) => prev.filter((b) => Number(b.id) !== numId));
    }

    try {
      const res = await fetch(`${API_URL}/v1/favourites/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ restaurant_branch_id: numId }),
      });

      const data = await res.json();
      if (!res.ok || !data.status) {
        await fetchFavourites(); // Revert if server failed
      } else if (data.is_favourite) {
        await fetchFavourites(); // Refresh full branch details for /favourites page
      }
    } catch (err) {
      console.error('Failed to toggle favourite:', err);
      await fetchFavourites();
    }
  };

  return {
    favouriteIds,
    favouriteBranches,
    loading,
    isFavourite,
    toggleFavourite,
    refreshFavourites: fetchFavourites,
  };
}