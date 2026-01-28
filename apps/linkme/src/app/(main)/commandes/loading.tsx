/**
 * Loading state pour la page des commandes
 * Affiche un skeleton screen pendant le chargement
 */

export default function CommandesLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-72 bg-gray-100 rounded" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded" />
      </div>

      {/* KPIs skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 space-y-3">
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-6 w-16 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-200 rounded" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-32 bg-gray-100 rounded" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-100 rounded" />
              <div className="flex-1" />
              <div className="h-6 w-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
