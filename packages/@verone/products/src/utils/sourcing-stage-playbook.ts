/**
 * Ce qu'on fait à chaque étape du sourcing — [BO-SOURCING-ETAPES-003]
 *
 * Les 4 étapes existaient depuis le 13/09 mais ne servaient qu'à changer un
 * statut : même écran, mêmes sections, quelle que soit l'étape. Ce fichier leur
 * donne un contenu — but, sections mises en avant, actions proposées, champs à
 * remplir — et un compteur qui dit où on en est.
 *
 * **Rien ici ne bloque.** Les seules portes qui refusent une action sont celles
 * de `sourcing-completeness.ts` (fournisseur + prix d'achat, puis catalogue).
 * Les champs listés ici sont des conseils, pas des conditions.
 *
 * Pur : aucune dépendance React, Supabase ou navigateur.
 */

import type { SourcingStage } from './sourcing-stage';

/** Sections de la fiche qu'une étape met en avant. */
export type SourcingPanelSection =
  | 'links'
  | 'photos'
  | 'offers'
  | 'prices'
  | 'journal'
  | 'evaluation'
  | 'sample';

/** Action proposée par le panneau d'étape. */
export type SourcingStageActionKey =
  | 'add_link'
  | 'add_offer'
  | 'rfq_template'
  | 'mark_contacted'
  | 'plan_follow_up'
  | 'add_note'
  | 'order_sample'
  | 'evaluate_sample'
  | 'add_price'
  | 'set_target_price';

export interface SourcingStageAction {
  key: SourcingStageActionKey;
  label: string;
  /** Aide d'une ligne, affichée sous le bouton sur grand écran. */
  hint: string;
}

export interface SourcingStagePlaybook {
  stage: SourcingStage;
  title: string;
  /** Ce qu'on cherche à obtenir à cette étape, en une phrase. */
  goal: string;
  /** Ce qui permet de passer à la suite. */
  exit: string;
  sections: ReadonlyArray<SourcingPanelSection>;
  actions: ReadonlyArray<SourcingStageAction>;
}

export const SOURCING_STAGE_PLAYBOOK: Readonly<
  Record<SourcingStage, SourcingStagePlaybook>
> = {
  supplier_search: {
    stage: 'supplier_search',
    title: 'Recherche',
    goal: 'Trouver plusieurs fournisseurs capables de fabriquer ou de livrer ce produit.',
    exit: 'On passe à Contact dès qu’un fournisseur au moins est identifié.',
    sections: ['links', 'photos', 'offers'],
    actions: [
      {
        key: 'add_link',
        label: 'Ajouter un lien',
        hint: 'La page du produit chez le fournisseur, gardée comme référence.',
      },
      {
        key: 'add_offer',
        label: 'Ajouter un fournisseur',
        hint: 'Constituez la liste des fournisseurs à consulter.',
      },
      {
        key: 'set_target_price',
        label: 'Fixer le prix cible',
        hint: 'Le prix d’achat visé : il sert de repère à toutes les offres.',
      },
    ],
  },
  initial_contact: {
    stage: 'initial_contact',
    title: 'Contact',
    goal: 'Envoyer la demande de prix à chaque fournisseur et suivre les réponses.',
    exit: 'On passe à Évaluation quand au moins un devis est arrivé.',
    sections: ['offers', 'journal'],
    actions: [
      {
        key: 'rfq_template',
        label: 'Demande de prix',
        hint: 'Un message pré-rempli à copier vers le fournisseur.',
      },
      {
        key: 'mark_contacted',
        label: 'Marquer contactés',
        hint: 'Passez en « contacté » les fournisseurs à qui vous avez écrit.',
      },
      {
        key: 'plan_follow_up',
        label: 'Planifier une relance',
        hint: 'Une date de relance, pour ne pas laisser un devis dormir.',
      },
    ],
  },
  evaluation: {
    stage: 'evaluation',
    title: 'Évaluation',
    goal: 'Comparer les offres au coût rendu et juger la qualité sur échantillon.',
    exit: 'On passe à Négociation une fois l’offre la plus crédible identifiée.',
    sections: ['offers', 'sample', 'evaluation', 'photos'],
    actions: [
      {
        key: 'order_sample',
        label: 'Commander l’échantillon',
        hint: 'Juger sur pièce avant de s’engager.',
      },
      {
        key: 'evaluate_sample',
        label: 'Évaluer l’échantillon',
        hint: 'Notez fabrication, finitions, conformité, emballage.',
      },
      {
        key: 'add_note',
        label: 'Annoter',
        hint: 'Gardez trace de ce que vous avez constaté.',
      },
    ],
  },
  negotiation: {
    stage: 'negotiation',
    title: 'Négociation',
    goal: 'Obtenir le meilleur prix rendu, puis retenir une offre.',
    exit: 'On valide au catalogue une fois le prix arrêté et la fiche complète.',
    sections: ['prices', 'offers', 'journal'],
    actions: [
      {
        key: 'add_price',
        label: 'Noter un prix',
        hint: 'Chaque proposition, de leur côté comme du vôtre.',
      },
      {
        key: 'rfq_template',
        label: 'Contre-proposition',
        hint: 'Un message pré-rempli reprenant votre prix cible.',
      },
      {
        key: 'add_note',
        label: 'Annoter',
        hint: 'Ce qui a été concédé, ce qui reste à obtenir.',
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Compteurs d'étape
// ---------------------------------------------------------------------------

/** Ce que le panneau a besoin de savoir pour chiffrer l'avancement. */
export interface SourcingStageProgressInput {
  linkCount: number;
  photoCount: number;
  /** Offres fournisseurs, par statut. */
  offerStatuses: ReadonlyArray<string>;
  /** Entrées du journal de type « échange ». */
  exchangeCount: number;
  /** Relances non résolues dont la date est dépassée. */
  overdueFollowUps: number;
  priceEntryCount: number;
  hasSample: boolean;
  hasEvaluation: boolean;
}

/** Compteur affiché sous une étape : `null` quand il n'y a rien à dire. */
export function stageCounter(
  stage: SourcingStage,
  progress: SourcingStageProgressInput
): string | null {
  const responded = progress.offerStatuses.filter(
    s => s === 'responded' || s === 'shortlisted' || s === 'selected'
  ).length;
  const contacted = progress.offerStatuses.filter(
    s => s !== 'identified' && s !== 'rejected'
  ).length;

  switch (stage) {
    case 'supplier_search': {
      const parts: string[] = [];
      if (progress.offerStatuses.length > 0) {
        parts.push(
          `${progress.offerStatuses.length} fournisseur${progress.offerStatuses.length > 1 ? 's' : ''}`
        );
      }
      if (progress.linkCount > 0) {
        parts.push(
          `${progress.linkCount} lien${progress.linkCount > 1 ? 's' : ''}`
        );
      }
      return parts.length > 0 ? parts.join(' · ') : null;
    }
    case 'initial_contact': {
      const parts: string[] = [];
      if (contacted > 0)
        parts.push(`${contacted} contacté${contacted > 1 ? 's' : ''}`);
      if (progress.exchangeCount > 0) {
        parts.push(
          `${progress.exchangeCount} échange${progress.exchangeCount > 1 ? 's' : ''}`
        );
      }
      if (progress.overdueFollowUps > 0) {
        parts.push(
          `${progress.overdueFollowUps} relance${progress.overdueFollowUps > 1 ? 's' : ''} en retard`
        );
      }
      return parts.length > 0 ? parts.join(' · ') : null;
    }
    case 'evaluation': {
      const parts: string[] = [];
      if (responded > 0) parts.push(`${responded} devis`);
      if (progress.hasSample) parts.push('échantillon');
      if (progress.hasEvaluation) parts.push('noté');
      return parts.length > 0 ? parts.join(' · ') : null;
    }
    case 'negotiation': {
      return progress.priceEntryCount > 0
        ? `${progress.priceEntryCount} prix noté${progress.priceEntryCount > 1 ? 's' : ''}`
        : null;
    }
    default:
      return null;
  }
}

/** Relance non résolue dont la date est passée. */
export function isOverdueFollowUp(
  entry: { follow_up_date: string | null; is_resolved: boolean },
  today = new Date()
): boolean {
  if (entry.is_resolved || entry.follow_up_date === null) return false;
  const due = new Date(entry.follow_up_date);
  if (Number.isNaN(due.getTime())) return false;
  // Comparaison à la journée : une relance prévue aujourd'hui n'est pas en retard.
  const midi = new Date(today);
  midi.setHours(0, 0, 0, 0);
  return due.getTime() < midi.getTime();
}
