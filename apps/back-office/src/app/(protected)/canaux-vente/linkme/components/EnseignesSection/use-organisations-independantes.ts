'use client';

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type { OrganisationIndependante, LinkMeUserWithOrg } from './types';

export function useOrganisationsIndependantes() {
  const [organisationsIndependantes, setOrganisationsIndependantes] = useState<
    OrganisationIndependante[]
  >([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Charger les organisations indépendantes qui ont AU MOINS UN utilisateur LinkMe
  // Filtre via v_linkme_users (demande utilisateur : "Je veux voir QUE les orgs avec utilisateur LinkMe")
  useEffect(() => {
    async function fetchOrganisationsIndependantes() {
      setLoadingOrgs(true);
      const supabase = createClient();

      try {
        // 1. Récupérer les organisation_id des utilisateurs LinkMe (rôle org_independante)
        const { data: usersWithOrg, error: usersError } = await supabase
          .from('v_linkme_users')
          .select('organisation_id')
          .not('organisation_id', 'is', null)
          .is('enseigne_id', null)
          .returns<LinkMeUserWithOrg[]>();

        if (usersError) throw usersError;

        // 2. Extraire les IDs uniques
        const orgIds = [
          ...new Set(
            usersWithOrg
              ?.map((u: LinkMeUserWithOrg) => u.organisation_id)
              .filter(Boolean)
          ),
        ] as string[];

        if (orgIds.length === 0) {
          setOrganisationsIndependantes([]);
          return;
        }

        // 3. Récupérer les détails des organisations
        const { data: orgs, error: orgsError } = await supabase
          .from('organisations')
          .select(
            'id, legal_name, trade_name, logo_url, city, address_line1, postal_code'
          )
          .in('id', orgIds)
          .order('legal_name')
          .returns<Omit<OrganisationIndependante, 'is_linkme_active'>[]>();

        if (orgsError) throw orgsError;

        // Mapper les résultats
        const organisationsMapped: OrganisationIndependante[] = (
          orgs ?? []
        ).map((org: Omit<OrganisationIndependante, 'is_linkme_active'>) => ({
          id: org.id,
          legal_name: org.legal_name,
          trade_name: org.trade_name,
          logo_url: org.logo_url,
          city: org.city,
          address_line1: org.address_line1,
          postal_code: org.postal_code,
          is_linkme_active: true, // Les orgs avec utilisateurs sont actives par défaut
        }));

        setOrganisationsIndependantes(organisationsMapped);
      } catch (error) {
        console.error('Error fetching organisations indépendantes:', error);
      } finally {
        setLoadingOrgs(false);
      }
    }

    // Charger immédiatement au montage (pas de lazy-loading)
    // pour que le compteur de l'onglet affiche la bonne valeur
    void fetchOrganisationsIndependantes().catch(error => {
      console.error(
        '[EnseignesSection] fetchOrganisationsIndependantes failed:',
        error
      );
    });
  }, []);

  return { organisationsIndependantes, loadingOrgs };
}
