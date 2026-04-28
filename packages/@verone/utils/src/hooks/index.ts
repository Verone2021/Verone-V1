/**
 * @verone/utils/hooks
 * Shared React hooks for the monorepo
 */

export {
  useCurrentUser,
  useCurrentUserId,
  useLogout,
  useInvalidateAuth,
  prefetchCurrentUser,
  authKeys,
} from './use-current-user';

export { useCurrentBoRole, boRoleKeys } from './use-current-bo-role';
export type { BoRole } from './use-current-bo-role';
