/**
 * Étape affichée d'un produit sourcing (BO-SOURCING-P4-001).
 *
 * L'écran montre 4 étapes. Les anciens statuts (échantillon demandé, reçu,
 * commande passée…) sont regroupés sur « Négociation » : l'état de l'échantillon
 * se lit désormais dans la commande échantillon (derive-sample-state.ts).
 * Pause, refus et validation sont des états hors parcours, affichés en pastille.
 *
 * Miroir de apply_product_lifecycle_action (migrations 20260913190000 et
 * 20260913220000) : mêmes listes d'étapes et de statuts « en cours ».
 * Pure : testée par __tests__/sourcing-stage.test.ts.
 */

export const SOURCING_STAGES = [
  'supplier_search',
  'initial_contact',
  'evaluation',
  'negotiation',
] as const;

export type SourcingStage = (typeof SOURCING_STAGES)[number];

export const SOURCING_STAGE_LABELS: Record<SourcingStage, string> = {
  supplier_search: 'Recherche',
  initial_contact: 'Contact',
  evaluation: 'Évaluation',
  negotiation: 'Négociation',
};

export type SourcingStateGroup =
  | 'in_progress'
  | 'on_hold'
  | 'refused'
  | 'validated';

export const SOURCING_STATE_LABELS: Record<
  Exclude<SourcingStateGroup, 'in_progress'>,
  string
> = {
  on_hold: 'En pause',
  refused: 'Refusé',
  validated: 'Validé',
};

/** Statuts acceptés comme « en cours » par la base jusqu'à la contraction P6. */
export const SOURCING_IN_PROGRESS_STATUSES: readonly string[] = [
  'need_identified',
  ...SOURCING_STAGES,
  'sample_requested',
  'sample_received',
  'sample_approved',
  'order_placed',
  'received',
];

const LEGACY_NEGOTIATION_STATUSES = new Set([
  'sample_requested',
  'sample_received',
  'sample_approved',
  'order_placed',
  'received',
]);

export interface SourcingStageInfo {
  /** Étape mise en avant ; null hors parcours (pause, refus, validation). */
  stage: SourcingStage | null;
  group: SourcingStateGroup;
}

export function isSourcingStage(value: string): value is SourcingStage {
  return (SOURCING_STAGES as readonly string[]).includes(value);
}

export function stageOfStatus(
  status: string | null | undefined
): SourcingStageInfo {
  if (status && isSourcingStage(status)) {
    return { stage: status, group: 'in_progress' };
  }
  switch (status) {
    case 'on_hold':
      return { stage: null, group: 'on_hold' };
    case 'refused':
    case 'cancelled':
    case 'archived':
      return { stage: null, group: 'refused' };
    case 'validated':
      return { stage: null, group: 'validated' };
    default:
      if (status && LEGACY_NEGOTIATION_STATUSES.has(status)) {
        return { stage: 'negotiation', group: 'in_progress' };
      }
      // need_identified, vide ou inconnu : début du parcours
      return { stage: 'supplier_search', group: 'in_progress' };
  }
}

export type SourcingLifecycleAction =
  | 'set_stage'
  | 'pause'
  | 'resume'
  | 'refuse'
  | 'reopen'
  | 'validate'
  | 'withdraw'
  | 'restore';

/**
 * Actions que la base acceptera pour ce produit (mêmes règles que
 * apply_product_lifecycle_action) : sert à n'afficher que des boutons utiles.
 */
export function availableLifecycleActions(
  status: string | null | undefined,
  isWithdrawn: boolean
): SourcingLifecycleAction[] {
  if (isWithdrawn) return ['restore'];
  if (status && SOURCING_IN_PROGRESS_STATUSES.includes(status)) {
    return ['set_stage', 'pause', 'refuse', 'validate', 'withdraw'];
  }
  switch (status) {
    case 'on_hold':
      return ['resume', 'refuse', 'withdraw'];
    case 'refused':
    case 'cancelled':
      return ['reopen', 'withdraw'];
    default:
      return ['withdraw'];
  }
}

// ------------------------------------------------------------------------
// Liste sourcing (BO-SOURCING-P5-001) : segments et requête correspondante
// ------------------------------------------------------------------------

export type SourcingListSegment =
  | 'in_progress'
  | 'on_hold'
  | 'refused'
  | 'withdrawn'
  | 'validated';

export const SOURCING_LIST_SEGMENTS: readonly SourcingListSegment[] = [
  'in_progress',
  'on_hold',
  'refused',
  'withdrawn',
  'validated',
];

export const SOURCING_SEGMENT_LABELS: Record<SourcingListSegment, string> = {
  in_progress: 'En cours',
  on_hold: 'En pause',
  refused: 'Refusés',
  withdrawn: 'Retirés',
  validated: 'Validés',
};

export interface SourcingSegmentProduct {
  sourcing_status?: string | null;
  archived_at?: string | null;
  creation_mode?: string | null;
}

/**
 * Segment de la liste sourcing d'un produit ; null s'il n'y figure pas.
 * Un produit validé a rejoint le catalogue (creation_mode complete) : il reste
 * visible dans « Validés » tant qu'il n'est pas retiré (le retrait d'un produit
 * du catalogue relève du catalogue, P8).
 */
export function segmentOfProduct(
  product: SourcingSegmentProduct
): SourcingListSegment | null {
  const isSourcing = product.creation_mode === 'sourcing';
  // Retiré pendant le sourcing : « Retirés », quel que soit son statut
  if (isSourcing && product.archived_at) return 'withdrawn';
  const { group } = stageOfStatus(product.sourcing_status);
  if (group === 'validated') {
    return product.archived_at ? null : 'validated';
  }
  if (!isSourcing) return null;
  return group;
}

/** Statuts de la base regroupés sur une étape affichée. */
export function statusesOfStage(stage: SourcingStage): string[] {
  return SOURCING_IN_PROGRESS_STATUSES.filter(
    status => stageOfStatus(status).stage === stage
  );
}

export interface SourcingSegmentQuery {
  /** creation_mode imposé ; null pour les validés, passés au catalogue */
  creationMode: 'sourcing' | null;
  /** true : archived_at non nul ; false : archived_at nul */
  withdrawn: boolean;
  /** Statuts acceptés ; null = tous */
  statuses: readonly string[] | null;
  /** Statut vide accepté (affiché au début du parcours) */
  includeNullStatus: boolean;
}

/**
 * Filtres à envoyer à la base pour un segment (et une étape en cours) :
 * même partition que segmentOfProduct, vérifiée par les tests.
 */
export function segmentQuery(
  segment: SourcingListSegment,
  stage?: SourcingStage
): SourcingSegmentQuery {
  switch (segment) {
    case 'in_progress':
      return {
        creationMode: 'sourcing',
        withdrawn: false,
        statuses: stage
          ? statusesOfStage(stage)
          : SOURCING_IN_PROGRESS_STATUSES,
        includeNullStatus: !stage || stage === 'supplier_search',
      };
    case 'on_hold':
      return {
        creationMode: 'sourcing',
        withdrawn: false,
        statuses: ['on_hold'],
        includeNullStatus: false,
      };
    case 'refused':
      return {
        creationMode: 'sourcing',
        withdrawn: false,
        statuses: ['refused', 'cancelled', 'archived'],
        includeNullStatus: false,
      };
    case 'withdrawn':
      return {
        creationMode: 'sourcing',
        withdrawn: true,
        statuses: null,
        includeNullStatus: true,
      };
    case 'validated':
      return {
        creationMode: null,
        withdrawn: false,
        statuses: ['validated'],
        includeNullStatus: false,
      };
  }
}
