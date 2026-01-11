// Force dynamic rendering for all mes-produits pages
// This prevents SSG errors with client-only APIs (location, localStorage)
export const dynamic = 'force-dynamic';

export default function MesProduitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
