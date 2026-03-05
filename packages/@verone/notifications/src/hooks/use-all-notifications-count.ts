'use client';

import { useDatabaseNotifications } from './use-database-notifications';
import { useFormSubmissionsCount } from './use-form-submissions-count';
import { useLinkmeMissingInfoCount } from './use-linkme-missing-info-count';

export interface AllNotificationsCount {
  totalCount: number;
  formSubmissions: number;
  linkmeInfoRequests: number;
  systemNotifications: number;
  loading: boolean;
}

/**
 * Hook agregateur combinant les 3 sources de notifications.
 * Retourne un compteur total et les compteurs individuels.
 */
export function useAllNotificationsCount(): AllNotificationsCount {
  const { count: formSubmissions, loading: fsLoading } =
    useFormSubmissionsCount();
  const { count: linkmeInfoRequests, loading: lmLoading } =
    useLinkmeMissingInfoCount();
  const { unreadCount: systemNotifications, loading: sysLoading } =
    useDatabaseNotifications();

  return {
    totalCount: formSubmissions + linkmeInfoRequests + systemNotifications,
    formSubmissions,
    linkmeInfoRequests,
    systemNotifications,
    loading: fsLoading || lmLoading || sysLoading,
  };
}
