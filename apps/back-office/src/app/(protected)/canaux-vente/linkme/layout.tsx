/**
 * LinkMe Layout
 *
 * Navigation tabs are now handled by ChannelTabs component
 * in the auth-wrapper layout (removed double sidebar pattern).
 *
 * Owner + admin only — catalog managers redirected to /produits.
 * LinkMe edits affiliate pricing and commissions, finance-grade access.
 * @see BO-RBAC-CATALOG-MGR-001
 */
import { gateAdminOrOwner } from '@/lib/auth/get-current-bo-role';

export const dynamic = 'force-dynamic';

export default async function LinkMeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await gateAdminOrOwner();
  // Simple passthrough - tabs handled by parent layout
  return <>{children}</>;
}
