'use client';

/**
 * [BO-FIN-040] Hook — Résout la maison mère d'une enseigne pour auto-facturation devis.
 *
 * Cas d'usage : une org filiale (Pokawa Avignon) commande sans SIRET. Pour émettre
 * un devis Qonto (qui exige un TIN), on propose automatiquement la maison mère
 * (organisation avec `is_enseigne_parent = true` + SIRET non null dans la même enseigne).
 *
 * Règle métier (confirmée 2026-04-19) : usage DEVIS UNIQUEMENT. Les factures exigent
 * un SIRET strict sur l'org commande elle-même.
 */

import { useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export interface IParentOrgSuggestion {
  id: string;
  legal_name: string;
  trade_name: string | null;
  siret: string | null;
  vat_number: string | null;
  billing_address_line1: string | null;
  billing_postal_code: string | null;
  billing_city: string | null;
  billing_country: string | null;
  address_line1: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
}

interface IUseParentOrgForBillingResult {
  /** La maison mère avec SIRET/VAT, ou null si absente ou déjà l'org commande */
  parentOrg: IParentOrgSuggestion | null;
  isLoading: boolean;
}

/**
 * Cherche l'unique organisation marquée `is_enseigne_parent = true` dans l'enseigne
 * passée en paramètre, à condition qu'elle dispose d'un SIRET ou d'un numéro de TVA.
 *
 * Retourne `null` si :
 * - `enseigneId` absent
 * - aucun parent désigné (Romeo doit cocher `is_enseigne_parent` sur la fiche org)
 * - le parent n'a ni SIRET ni VAT (inutile pour Qonto)
 * - le parent EST l'org commande courante (déjà le cas nominal)
 */
export function useParentOrgForBilling(
  enseigneId: string | null | undefined,
  currentOrgId: string | null | undefined
): IUseParentOrgForBillingResult {
  const [parentOrg, setParentOrg] = useState<IParentOrgSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enseigneId) {
      setParentOrg(null);
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const fetchParent = async (): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from('organisations')
          .select(
            'id, legal_name, trade_name, siret, vat_number, billing_address_line1, billing_postal_code, billing_city, billing_country, address_line1, postal_code, city, country'
          )
          .eq('enseigne_id', enseigneId)
          .eq('is_enseigne_parent', true)
          .is('archived_at', null)
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setParentOrg(null);
          return;
        }
        // Exige SIRET ou VAT côté parent — sinon inutile
        if (!data.siret && !data.vat_number) {
          setParentOrg(null);
          return;
        }
        // Ignore si le parent EST déjà l'org commande
        if (currentOrgId && data.id === currentOrgId) {
          setParentOrg(null);
          return;
        }
        setParentOrg(data as IParentOrgSuggestion);
      } catch (err) {
        console.error(
          '[useParentOrgForBilling] Failed to fetch parent org:',
          err
        );
        setParentOrg(null);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchParent();
  }, [enseigneId, currentOrgId]);

  return { parentOrg, isLoading };
}
