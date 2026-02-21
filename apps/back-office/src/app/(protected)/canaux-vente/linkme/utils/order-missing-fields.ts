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
  | 'responsable'
  | 'billing'
  | 'delivery'
  | 'organisation'
  | 'custom';

export type MissingFieldInputType = 'text' | 'email' | 'tel' | 'date';

export interface MissingField {
  key: string;
  label: string;
  category: MissingFieldCategory;
  /** Input type for dynamic form rendering */
  inputType: MissingFieldInputType;
}

export interface MissingFieldsResult {
  /** Tous les champs manquants */
  fields: MissingField[];
  /** Champs manquants groupés par catégorie */
  byCategory: Record<MissingFieldCategory, MissingField[]>;
  /** Nombre total de sous-champs manquants (pour détail technique) */
  total: number;
  /** Nombre de catégories avec au moins 1 champ manquant (pour badge UX) */
  totalCategories: number;
  /** true si aucun champ manquant */
  isComplete: boolean;
}

// ============================================
// LABELS & MESSAGE COMBINÉ
// ============================================

/** Labels UI pour chaque catégorie (hors 'custom') */
export const CATEGORY_LABELS: Record<MissingFieldCategory, string> = {
  responsable: 'Contact responsable',
  billing: 'Contact facturation',
  delivery: 'Contact & adresse livraison',
  organisation: 'Informations entreprise',
  custom: 'Message personnalisé',
};

/**
 * Génère un message combiné à partir des catégories sélectionnées.
 * Chaque catégorie produit une section listant ses champs manquants.
 */
export function generateCombinedMessage(
  missingFields: MissingFieldsResult,
  selectedCategories: Set<MissingFieldCategory>
): string {
  const sections: string[] = [];

  const categoryOrder: MissingFieldCategory[] = [
    'responsable',
    'billing',
    'delivery',
    'organisation',
  ];

  for (const cat of categoryOrder) {
    if (!selectedCategories.has(cat)) continue;
    const fields = missingFields.byCategory[cat];
    if (fields.length === 0) continue;

    const fieldsList = fields.map(f => `  - ${f.label}`).join('\n');
    sections.push(`${CATEGORY_LABELS[cat]} :\n${fieldsList}`);
  }

  if (sections.length === 0) return '';

  return `Bonjour,

Pour traiter votre commande, nous avons besoin des informations suivantes :

${sections.join('\n\n')}

Merci de nous transmettre ces informations dans les meilleurs délais.`;
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
    id: 'responsable_info',
    category: 'responsable',
    label: 'Informations responsable',
    description: 'Demander les informations du contact responsable',
    getMessage: fields => {
      const fieldsList = fields
        .filter(f => f.category === 'responsable')
        .map(f => `  - ${f.label}`)
        .join('\n');
      return `Bonjour,

Pour traiter votre commande, nous avons besoin des informations suivantes concernant le responsable :

${fieldsList || '  - Nom, email et téléphone du responsable'}

Merci de nous transmettre ces informations dans les meilleurs délais.`;
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
    id: 'organisation_info',
    category: 'organisation',
    label: 'Informations entreprise',
    description: "Demander les informations légales de l'entreprise",
    getMessage: fields => {
      const fieldsList = fields
        .filter(f => f.category === 'organisation')
        .map(f => `  - ${f.label}`)
        .join('\n');
      return `Bonjour,

Pour finaliser le dossier de votre commande, nous avons besoin des informations suivantes concernant votre entreprise :

${fieldsList || '  - SIRET'}

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

export interface GetOrderMissingFieldsOptions {
  details: LinkMeOrderDetails | null;
  /** SIRET from the linked organisation (pass null/undefined if unknown) */
  organisationSiret?: string | null;
  /** Type de restaurant (propre/succursale/franchise) - owner fields requis uniquement pour franchises */
  ownerType?: string | null;
}

/**
 * Analyse les détails LinkMe d'une commande et retourne les champs manquants.
 *
 * @param options - Détails LinkMe + contexte organisation
 * @returns Résultat structuré avec champs manquants par catégorie
 */
export function getOrderMissingFields(
  options: GetOrderMissingFieldsOptions
): MissingFieldsResult {
  const { details, organisationSiret, ownerType } = options;
  const fields: MissingField[] = [];

  if (!details) {
    fields.push(
      {
        key: 'requester_name',
        label: 'Nom du demandeur',
        category: 'responsable',
        inputType: 'text',
      },
      {
        key: 'requester_email',
        label: 'Email du demandeur',
        category: 'responsable',
        inputType: 'email',
      },
      {
        key: 'billing_email',
        label: 'Email facturation',
        category: 'billing',
        inputType: 'email',
      }
    );
    return buildResult(fields);
  }

  // --- Responsable / Demandeur ---
  if (!details.requester_name) {
    fields.push({
      key: 'requester_name',
      label: 'Nom du demandeur',
      category: 'responsable',
      inputType: 'text',
    });
  }
  if (!details.requester_email) {
    fields.push({
      key: 'requester_email',
      label: 'Email du demandeur',
      category: 'responsable',
      inputType: 'email',
    });
  }
  if (!details.requester_phone) {
    fields.push({
      key: 'requester_phone',
      label: 'Téléphone du demandeur',
      category: 'responsable',
      inputType: 'tel',
    });
  }

  // --- Propriétaire (seulement pour franchises avec contact différent du demandeur) ---
  // Succursales/propres : l'enseigne EST le propriétaire → pas de contact owner séparé
  // null = non renseigné → on ne génère PAS de faux manquants
  if (
    details.owner_contact_same_as_requester === false &&
    ownerType === 'franchise'
  ) {
    if (!details.owner_name) {
      fields.push({
        key: 'owner_name',
        label: 'Nom du propriétaire',
        category: 'responsable',
        inputType: 'text',
      });
    }
    if (!details.owner_email) {
      fields.push({
        key: 'owner_email',
        label: 'Email du propriétaire',
        category: 'responsable',
        inputType: 'email',
      });
    }
    if (!details.owner_phone) {
      fields.push({
        key: 'owner_phone',
        label: 'Téléphone du propriétaire',
        category: 'responsable',
        inputType: 'tel',
      });
    }
    if (!details.owner_company_legal_name) {
      fields.push({
        key: 'owner_company_legal_name',
        label: 'Raison sociale du propriétaire',
        category: 'responsable',
        inputType: 'text',
      });
    }
  }

  // --- Facturation ---
  if (!details.billing_name) {
    fields.push({
      key: 'billing_name',
      label: 'Nom contact facturation',
      category: 'billing',
      inputType: 'text',
    });
  }
  if (!details.billing_email) {
    fields.push({
      key: 'billing_email',
      label: 'Email facturation',
      category: 'billing',
      inputType: 'email',
    });
  }
  if (!details.billing_phone) {
    fields.push({
      key: 'billing_phone',
      label: 'Téléphone facturation',
      category: 'billing',
      inputType: 'tel',
    });
  }

  // --- Livraison ---
  if (!details.delivery_contact_name) {
    fields.push({
      key: 'delivery_contact_name',
      label: 'Nom contact livraison',
      category: 'delivery',
      inputType: 'text',
    });
  }
  if (!details.delivery_contact_email) {
    fields.push({
      key: 'delivery_contact_email',
      label: 'Email contact livraison',
      category: 'delivery',
      inputType: 'email',
    });
  }
  if (!details.delivery_contact_phone) {
    fields.push({
      key: 'delivery_contact_phone',
      label: 'Téléphone contact livraison',
      category: 'delivery',
      inputType: 'tel',
    });
  }
  if (!details.delivery_address) {
    fields.push({
      key: 'delivery_address',
      label: 'Adresse de livraison',
      category: 'delivery',
      inputType: 'text',
    });
  }
  if (!details.delivery_postal_code) {
    fields.push({
      key: 'delivery_postal_code',
      label: 'Code postal livraison',
      category: 'delivery',
      inputType: 'text',
    });
  }
  if (!details.delivery_city) {
    fields.push({
      key: 'delivery_city',
      label: 'Ville livraison',
      category: 'delivery',
      inputType: 'text',
    });
  }
  // desired_delivery_date : champ optionnel dans Bubble (date "souhaitée"), pas obligatoire

  // Mall email (only if is_mall_delivery)
  if (details.is_mall_delivery && !details.mall_email) {
    fields.push({
      key: 'mall_email',
      label: 'Email centre commercial',
      category: 'delivery',
      inputType: 'email',
    });
  }

  // --- Organisation ---
  if (!organisationSiret) {
    fields.push({
      key: 'organisation_siret',
      label: 'SIRET',
      category: 'organisation',
      inputType: 'text',
    });
  }

  return buildResult(fields);
}

/**
 * Construit le résultat structuré à partir de la liste brute
 */
function buildResult(fields: MissingField[]): MissingFieldsResult {
  const byCategory: Record<MissingFieldCategory, MissingField[]> = {
    responsable: [],
    billing: [],
    delivery: [],
    organisation: [],
    custom: [],
  };

  for (const field of fields) {
    byCategory[field.category].push(field);
  }

  const totalCategories = Object.values(byCategory).filter(
    arr => arr.length > 0
  ).length;

  return {
    fields,
    byCategory,
    total: fields.length,
    totalCategories,
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
