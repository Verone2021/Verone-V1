import type { LinkMeRole } from '../../../../contexts/AuthContext';

// Seuls les enseigne_admin peuvent editer
export const CAN_EDIT_ROLES: LinkMeRole[] = ['enseigne_admin'];

export interface FormData {
  name: string;
  description: string;
  affiliate_payout_ht: string;
  store_at_verone: boolean;
  length_cm: string;
  width_cm: string;
  height_cm: string;
}
