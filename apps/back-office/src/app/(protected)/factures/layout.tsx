/**
 * Factures Layout — owner + admin only
 *
 * Catalog managers redirected to /produits. Invoice access requires
 * finance-grade privileges.
 * @see BO-RBAC-CATALOG-MGR-001
 */
import { gateAdminOrOwner } from '@/lib/auth/get-current-bo-role';

export const dynamic = 'force-dynamic';

export default async function FacturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await gateAdminOrOwner();
  return <>{children}</>;
}
