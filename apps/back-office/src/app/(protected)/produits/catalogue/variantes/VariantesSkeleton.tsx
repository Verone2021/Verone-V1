export function VariantesSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-gray-200 animate-pulse"
        >
          <div className="p-4 border-b border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="p-4">
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </>
  );
}
