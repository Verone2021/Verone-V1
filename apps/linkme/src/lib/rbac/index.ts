/**
 * RBAC (Role-Based Access Control) - Exports centralisés
 *
 * Point d'entrée unique pour toutes les fonctionnalités RBAC de LinkMe.
 *
 * @module lib/rbac
 * @since 2026-01-30
 */

// Configuration des routes
export {
  ROUTE_PERMISSIONS,
  isRouteAllowed,
  getRedirectUrl,
  RESTRICTED_ROUTES,
  isRestrictedRoute,
  type RoutePermission,
} from '@/config/route-permissions';

// Hook permissions
export {
  usePermissions,
  PERMISSION_MATRIX,
  type PermissionKey,
  type UsePermissionsReturn,
} from '@/hooks/use-permissions';

// Composants guards
export {
  RequireRole,
  RequireNotRole,
  type RequireRoleProps,
} from '@/components/RequireRole';

// Types de rôles (réexport depuis AuthContext pour centralisation)
export type { LinkMeRole, LinkMeUserRole } from '@/contexts/AuthContext';
