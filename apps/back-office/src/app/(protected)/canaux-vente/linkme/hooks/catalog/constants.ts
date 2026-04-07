/**
 * Constantes et helpers pour le catalogue LinkMe
 */

import { createClient } from '@verone/utils/supabase/client';

// ID du canal LinkMe dans sales_channels
export const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

/**
 * Helper: créer un client Supabase (à l'intérieur des fonctions, pas au niveau module)
 * Évite les problèmes de contexte d'authentification au chargement du module
 */
export function getSupabaseClient() {
  return createClient();
}
