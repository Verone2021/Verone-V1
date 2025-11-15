/**
 * 🔗 Server Action: Affiliation Compte Client
 *
 * Appelé par admin depuis notification pour affilier compte site-internet
 * à un client/organisation existant dans le back-office.
 *
 * Workflow:
 * 1. Admin reçoit notification "Nouveau compte - Affiliation requise"
 * 2. Admin clique action "Affilier ce compte"
 * 3. Server action appelle fonction database affiliate_customer_account()
 * 4. user_profiles.partner_id mis à jour
 * 5. Notification marquée comme lue
 */

'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@verone/utils/supabase/server';

export interface AffiliateCustomerParams {
  /** ID utilisateur auth.users à affilier */
  userId: string;

  /** ID organisation ou individual_customer existant */
  partnerId: string;
}

export interface AffiliateCustomerResult {
  success: boolean;
  error?: string;
}

/**
 * Affilier compte site-internet à client/organisation existant
 *
 * @param params - userId et partnerId
 * @returns Promise<AffiliateCustomerResult>
 */
export async function affiliateCustomerAccount(
  params: AffiliateCustomerParams
): Promise<AffiliateCustomerResult> {
  try {
    const supabase = await createClient();

    // Vérifier authentification admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Non authentifié',
      };
    }

    // Vérifier rôle admin/owner
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Profil utilisateur introuvable',
      };
    }

    if (!['owner', 'admin'].includes(profile.role)) {
      return {
        success: false,
        error: 'Action réservée aux administrateurs',
      };
    }

    // Appeler fonction database pour affiliation
    const { error: rpcError } = await supabase.rpc(
      'affiliate_customer_account' as any,
      {
        p_user_id: params.userId,
        p_partner_id: params.partnerId,
      }
    );

    if (rpcError) {
      console.error('Erreur affiliation:', rpcError);
      return {
        success: false,
        error: `Erreur lors de l'affiliation: ${rpcError.message}`,
      };
    }

    // Invalider cache notifications
    revalidatePath('/notifications');
    revalidatePath('/contacts-organisations/customers');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Erreur server action affiliation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
