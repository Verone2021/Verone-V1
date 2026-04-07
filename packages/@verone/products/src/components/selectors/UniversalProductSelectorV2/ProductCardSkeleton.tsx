'use client';

// ============================================================================
// COMPOSANT - ProductCardSkeleton
// ============================================================================

export function ProductCardSkeleton() {
  return (
    <div className="flex gap-2 p-3 border border-gray-100 rounded-lg animate-pulse">
      <div className="w-12 h-12 bg-gray-200 rounded-lg" />
      <div className="flex-1 space-y-1">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="w-9 h-9 bg-gray-200 rounded-full" />
    </div>
  );
}
