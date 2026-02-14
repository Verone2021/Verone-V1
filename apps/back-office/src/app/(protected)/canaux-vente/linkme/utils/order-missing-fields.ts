/**
 * Utilitaire : Analyse des champs manquants d'une commande LinkMe
 * ================================================================
 * Détecte les champs manquants dans sales_order_linkme_details
 * et génère des messages structurés pour demander des compléments.
 *
 * @module order-missing-fields
 * @since 2026-02-14
 */

import type { LinkMeOrderDetails } from '../hooks/use-linkme-order-actions';

// ============================================
// TYPES
// ============================================

export type MissingFieldCategory =
  | 'requester'
  | 'owner'
  | 'kbis'
  | 'billing'
  | 'delivery'
  | 'custom';

export interface MissingField {
  key: string;
  label: string;
  category: MissingFieldCategory;
}

export interface MissingFieldsResult {
  /** Tous les champs manquants */
  fields: MissingField[];
  /** Champs manquants groupés par catégorie */
  byCategory: Record<MissingFieldCategory, MissingField[]>;
  /** Nombre total de champs manquants */
  total: number;
  /** true si aucun champ manquant */
  isComplete: boolean;
}

// ============================================
// TEMPLATES DE DEMANDE DE COMPLÉMENTS
// ============================================

export interface RequestInfoTemplate {
  id: string;
  category: MissingFieldCategory;
  label: string;
  description: string;
  /** Génère le message avec les champs manquants détectés */
  getMessage: (missingFields: MissingField[]) => string;
}

export const REQUEST_INFO_TEMPLATES: RequestInfoTemplate[] = [
  {
    id: 'owner_info',
    category: 'owner',
    label: 'Informations propriétaire',
    description: 'Demander les informations du propriétaire/responsable',
    getMessage: fields => {
      const fieldsList = fields
        .filter(f => f.category === 'owner')
        .map(f => `  - ${f.label}`)
        .join('\n');
      return `Bonjour,

Pour traiter votre commande, nous avons besoin des informations suivantes concernant le propriétaire/responsable du restaurant :

${fieldsList || '  - Nom, email et téléphone du propriétaire'}

Merci de nous transmettre ces informations dans les meilleurs délais.`;
    },
  },
  {
    id: 'kbis',
    category: 'kbis',
    label: 'Document KBis requis',
    description: 'Demander le KBis pour une franchise',
    getMessage: () => {
      return `Bonjour,

Votre commande concerne un restaurant franchisé. Pour pouvoir la traiter, nous avons besoin d'une copie du KBis de la société exploitante.

Merci de nous envoyer ce document (scan ou photo lisible) en réponse à cet email.`;
    },
  },
  {
    id: 'billing_info',
    category: 'billing',
    label: 'Informations facturation',
    description: 'Demander les informations de facturation',
    getMessage: fields => {
      const fieldsList = fields
        .filter(f => f.category === 'billing')
        .map(f => `  - ${f.label}`)
        .join('\n');
      return `Bonjour,

Pour établir la facture de votre commande, nous avons besoin des informations suivantes :

${fieldsList || '  - Contact et coordonnées de facturation'}

Merci de nous transmettre ces informations dans les meilleurs délais.`;
    },
  },
  {
    id: 'delivery_info',
    category: 'delivery',
    label: 'Informations livraison',
    description: 'Demander les informations de livraison',
    getMessage: fields => {
      const fieldsList = fields
        .filter(f => f.category === 'delivery')
        .map(f => `  - ${f.label}`)
        .join('\n');
      return `Bonjour,

Pour organiser la livraison de votre commande, nous avons besoin des informations suivantes :

${fieldsList || '  - Adresse de livraison et contact sur place'}

Merci de nous transmettre ces informations dans les meilleurs délais.`;
    },
  },
  {
    id: 'custom',
    category: 'custom',
    label: 'Message personnalisé',
    description: 'Rédiger un message libre',
    getMessage: () => '',
  },
];

// ============================================
// RAISONS DE REFUS PRÉDÉFINIES
// ============================================

export interface RejectReasonTemplate {
  id: string;
  label: string;
  message: string;
}

export const REJECT_REASON_TEMPLATES: RejectReasonTemplate[] = [
  {
    id: 'incomplete_info',
    label: 'Informations incomplètes',
    message:
      "Votre commande ne peut pas être validée car les informations fournies sont incomplètes. Nous vous avons précédemment demandé des compléments qui n'ont pas été transmis dans le délai imparti.",
  },
  {
    id: 'invalid_franchise',
    label: 'Franchise non éligible',
    message:
      "Votre commande ne peut pas être validée car la franchise concernée ne remplit pas les conditions d'éligibilité requises pour ce programme.",
  },
  {
    id: 'product_unavailable',
    label: 'Produits indisponibles',
    message:
      'Un ou plusieurs produits de votre commande ne sont plus disponibles. Nous vous invitons à passer une nouvelle commande avec les produits actuellement en catalogue.',
  },
  {
    id: 'duplicate_order',
    label: 'Commande en doublon',
    message:
      "Votre commande fait doublon avec une commande déjà en cours de traitement. Si vous pensez qu'il s'agit d'une erreur, veuillez nous contacter.",
  },
  {
    id: 'custom',
    label: 'Raison personnalisée',
    message: '',
  },
];

// ============================================
// ANALYSE DES CHAMPS MANQUANTS
// ============================================

/**
 * Analyse les détails LinkMe d'une commande et retourne les champs manquants.
 *
 * @param details - Les détails LinkMe (peut être null si pas encore créés)
 * @returns Résultat structuré avec champs manquants par catégorie
 */
export function getOrderMissingFields(
  details: LinkMeOrderDetails | null
): MissingFieldsResult {
  const fields: MissingField[] = [];

  if (!details) {
    // Si pas de détails du tout, tout est manquant
    fields.push(
      {
        key: 'requester_name',
        label: 'Nom du demandeur',
        category: 'requester',
      },
      {
        key: 'requester_email',
        label: 'Email du demandeur',
        category: 'requester',
      },
      { key: 'owner_email', label: 'Email du propriétaire', category: 'owner' },
      {
        key: 'billing_email',
        label: 'Email de facturation',
        category: 'billing',
      }
    );
    return buildResult(fields);
  }

  // --- Demandeur (Étape 1) ---
  if (!details.requester_name) {
    fields.push({
      key: 'requester_name',
      label: 'Nom du demandeur',
      category: 'requester',
    });
  }
  if (!details.requester_email) {
    fields.push({
      key: 'requester_email',
      label: 'Email du demandeur',
      category: 'requester',
    });
  }
  if (!details.requester_phone) {
    fields.push({
      key: 'requester_phone',
      label: 'Téléphone du demandeur',
      category: 'requester',
    });
  }

  // --- Propriétaire (Étape 2) ---
  if (!details.owner_contact_same_as_requester) {
    // Si pas "identique au demandeur", les champs owner sont requis
    if (!details.owner_name) {
      fields.push({
        key: 'owner_name',
        label: 'Nom du propriétaire',
        category: 'owner',
      });
    }
    if (!details.owner_email) {
      fields.push({
        key: 'owner_email',
        label: 'Email du propriétaire',
        category: 'owner',
      });
    }
    if (!details.owner_phone) {
      fields.push({
        key: 'owner_phone',
        label: 'Téléphone du propriétaire',
        category: 'owner',
      });
    }
  }

  // --- KBis (franchise uniquement) ---
  if (details.owner_type === 'franchise') {
    if (!details.owner_kbis_url) {
      fields.push({
        key: 'owner_kbis_url',
        label: 'Document KBis',
        category: 'kbis',
      });
    }
    if (!details.owner_company_legal_name) {
      fields.push({
        key: 'owner_company_legal_name',
        label: 'Raison sociale',
        category: 'kbis',
      });
    }
    if (!details.owner_company_trade_name) {
      fields.push({
        key: 'owner_company_trade_name',
        label: 'Nom commercial',
        category: 'kbis',
      });
    }
  }

  // --- Facturation (Étape 3) ---
  if (!details.billing_name) {
    fields.push({
      key: 'billing_name',
      label: 'Nom contact facturation',
      category: 'billing',
    });
  }
  if (!details.billing_email) {
    fields.push({
      key: 'billing_email',
      label: 'Email facturation',
      category: 'billing',
    });
  }

  // --- Livraison ---
  if (!details.desired_delivery_date) {
    fields.push({
      key: 'desired_delivery_date',
      label: 'Date de livraison souhaitée',
      category: 'delivery',
    });
  }

  return buildResult(fields);
}

/**
 * Construit le résultat structuré à partir de la liste brute
 */
function buildResult(fields: MissingField[]): MissingFieldsResult {
  const byCategory: Record<MissingFieldCategory, MissingField[]> = {
    requester: [],
    owner: [],
    kbis: [],
    billing: [],
    delivery: [],
    custom: [],
  };

  for (const field of fields) {
    byCategory[field.category].push(field);
  }

  return {
    fields,
    byCategory,
    total: fields.length,
    isComplete: fields.length === 0,
  };
}

/**
 * Retourne les templates pertinents pour une commande donnée
 * (filtre les catégories qui ont des champs manquants + custom)
 */
export function getRelevantTemplates(
  missingFields: MissingFieldsResult
): RequestInfoTemplate[] {
  const relevantCategories = new Set<MissingFieldCategory>();

  for (const field of missingFields.fields) {
    relevantCategories.add(field.category);
  }

  // Toujours inclure "custom"
  relevantCategories.add('custom');

  return REQUEST_INFO_TEMPLATES.filter(t => relevantCategories.has(t.category));
}
