/**
 * Finance Layout — owner + admin only
 *
 * Catalog managers (and any other non-owner/admin role) are redirected to
 * /produits. Finance access requires elevated privileges.
 * @see BO-RBAC-CATALOG-MGR-001
 */
import { gateAdminOrOwner } from '@/lib/auth/get-current-bo-role';

export const dynamic = 'force-dynamic';

export default async function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await gateAdminOrOwner();
  return <>{children}</>;
}
