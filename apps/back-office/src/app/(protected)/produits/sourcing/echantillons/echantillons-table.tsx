'use client';

/**
 * echantillons-table.tsx — barrel re-export
 * All table components are split across:
 *  - echantillons-badges.tsx  (badge helpers)
 *  - echantillons-rows.tsx    (row + tab + dialog components)
 */

export {
  getSampleTypeBadge,
  getStatusBadge,
  getStatusIcon,
} from './echantillons-badges';

export {
  ActiveSampleRow,
  ArchivedSampleRow,
  ActiveSamplesTab,
  ArchivedSamplesTab,
  DeleteConfirmDialog,
} from './echantillons-rows';
