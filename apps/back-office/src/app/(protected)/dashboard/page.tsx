/**
 * Minimal Dashboard Page - Debugging Vercel 404
 *
 * This is a minimal version to test if the problem is:
 * - Route registration issue
 * - Import resolution issue
 * - Component complexity issue
 */

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-black mb-4">
          ✅ Dashboard Loaded!
        </h1>
        <p className="text-slate-600">
          If you see this, the route registration works.
        </p>
        <p className="text-slate-500 text-sm mt-2">
          Minimal version - no imports, no dependencies
        </p>
      </div>
    </div>
  );
}
