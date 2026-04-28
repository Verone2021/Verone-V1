/**
 * Ventes Layout — owner + admin only
 *
 * Catalog managers redirected to /produits. Sales pages expose commissions,
 * ambassador payouts, and pricing details.
 * @see BO-RBAC-CATALOG-MGR-001
 */
import { gateAdminOrOwner } from '@/lib/auth/get-current-bo-role';

export const dynamic = 'force-dynamic';

export default async function VentesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await gateAdminOrOwner();
  return <>{children}</>;
}
