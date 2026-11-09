import { Suspense } from 'react';
import BranchClientView from '@/components/BranchClientView';

// Generates static paths at build time for static export
export async function generateStaticParams() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/hungrymenia-api/public/api';
    const res = await fetch(`${apiUrl}/branches`, { cache: 'no-store' });
    const data = await res.json();
    
    // Support both paginated and non-paginated API structures
    const branches = data.branches?.data || data.branches || [];
    
    if (Array.isArray(branches) && branches.length > 0) {
      return branches.map((branch) => ({
        id: String(branch.id),
      }));
    }
  } catch (err) {
    console.warn('API unreachable during static build, using fallback branch IDs.');
  }
  
  // Safe fallback IDs so the build never fails even if the backend is offline
  return [{ id: '1' }, { id: '2' }];
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading branch...</div>}>
      <BranchClientView />
    </Suspense>
  );
}