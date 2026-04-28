/**
 * Devis Layout — owner + admin only
 *
 * Catalog managers redirected to /produits. Quote access requires
 * finance-grade privileges (selling prices visible).
 * @see BO-RBAC-CATALOG-MGR-001
 */
import { gateAdminOrOwner } from '@/lib/auth/get-current-bo-role';

export const dynamic = 'force-dynamic';

export default async function DevisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await gateAdminOrOwner();
  return <>{children}</>;
}
