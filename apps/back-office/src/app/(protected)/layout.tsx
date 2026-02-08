/**
 * Protected Layout — Back-Office
 *
 * Authentication and app isolation are handled by src/middleware.ts.
 * This layout only needs force-dynamic to prevent build-time errors
 * (no session exists at build time).
 *
 * @updated 2026-02-08 - Simplified: middleware handles auth + isolation
 */

// Force dynamic rendering for all protected routes
// Prevents build-time errors when auth check fails (no session at build time)
export const dynamic = 'force-dynamic';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
