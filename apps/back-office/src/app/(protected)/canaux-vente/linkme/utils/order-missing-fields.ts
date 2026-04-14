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
import type { RequestInfoTemplate } from './order-request-templates';
import { REQUEST_INFO_TEMPLATES } from './order-request-templates';

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

export type {
  RequestInfoTemplate,
  RejectReasonTemplate,
} from './order-request-templates';
export {
  REQUEST_INFO_TEMPLATES,
  REJECT_REASON_TEMPLATES,
} from './order-request-templates';

export interface GetOrderMissingFieldsOptions {
  details: LinkMeOrderDetails | null;
  /** SIRET from the linked organisation (pass null/undefined if unknown) */
  organisationSiret?: string | null;
  /** Country code of the organisation (ISO 3166-1 alpha-2, e.g. 'FR', 'BE') */
  organisationCountry?: string | null;
  /** VAT number (n° TVA intracommunautaire) from the linked organisation */
  organisationVatNumber?: string | null;
  /** Type de restaurant (propre/succursale/franchise) */
  ownerType?: string | null;
  /** Legal name (raison sociale) of the organisation */
  organisationLegalName?: string | null;
  /** Billing address line 1 of the organisation */
  organisationBillingAddress?: string | null;
  /** Billing postal code of the organisation */
  organisationBillingPostalCode?: string | null;
  /** Billing city of the organisation */
  organisationBillingCity?: string | null;
  /** Field keys explicitly ignored by back-office staff for this order */
  ignoredFields?: string[];
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
  const {
    details,
    organisationSiret,
    organisationCountry,
    organisationVatNumber,
    organisationLegalName,
    organisationBillingAddress,
    organisationBillingPostalCode,
    organisationBillingCity,
    ignoredFields,
  } = options;
  const ignored = new Set(ignoredFields ?? []);
  const fields: MissingField[] = [];

  if (!details) {
    const allFields: MissingField[] = [
      {
        key: 'requester_name',
        label: 'Nom du responsable',
        category: 'responsable',
        inputType: 'text',
      },
      {
        key: 'requester_email',
        label: 'Email du responsable',
        category: 'responsable',
        inputType: 'email',
      },
      {
        key: 'billing_email',
        label: 'Email facturation',
        category: 'billing',
        inputType: 'email',
      },
    ];
    return buildResult(allFields.filter(f => !ignored.has(f.key)));
  }

  // --- Contact responsable (bloc unique, sans distinction demandeur/proprietaire) ---
  if (!details.requester_name) {
    fields.push({
      key: 'requester_name',
      label: 'Nom du responsable',
      category: 'responsable',
      inputType: 'text',
    });
  }
  if (!details.requester_email) {
    fields.push({
      key: 'requester_email',
      label: 'Email du responsable',
      category: 'responsable',
      inputType: 'email',
    });
  }
  if (!details.requester_phone) {
    fields.push({
      key: 'requester_phone',
      label: 'Téléphone du responsable',
      category: 'responsable',
      inputType: 'tel',
    });
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

  // Date de livraison souhaitee (critique pour devis transport)
  if (!details.desired_delivery_date) {
    fields.push({
      key: 'desired_delivery_date',
      label: 'Date de livraison souhaitée',
      category: 'delivery',
      inputType: 'date',
    });
  }

  // Mall email (only if is_mall_delivery)
  if (details.is_mall_delivery && !details.mall_email) {
    fields.push({
      key: 'mall_email',
      label: 'Email direction centre commercial',
      category: 'delivery',
      inputType: 'email',
    });
  }

  // --- Organisation ---
  if (!organisationLegalName) {
    fields.push({
      key: 'organisation_legal_name',
      label: 'Raison sociale',
      category: 'organisation',
      inputType: 'text',
    });
  }
  const isFrench =
    !organisationCountry || organisationCountry.toUpperCase() === 'FR';
  if (isFrench && !organisationSiret) {
    fields.push({
      key: 'organisation_siret',
      label: 'SIRET',
      category: 'organisation',
      inputType: 'text',
    });
  }
  if (!isFrench && !organisationVatNumber) {
    fields.push({
      key: 'organisation_vat_number',
      label: 'N° TVA intracommunautaire',
      category: 'organisation',
      inputType: 'text',
    });
  }
  if (!organisationBillingAddress) {
    fields.push({
      key: 'organisation_billing_address',
      label: 'Adresse de facturation',
      category: 'organisation',
      inputType: 'text',
    });
  }
  if (!organisationBillingPostalCode) {
    fields.push({
      key: 'organisation_billing_postal_code',
      label: 'Code postal facturation',
      category: 'organisation',
      inputType: 'text',
    });
  }
  if (!organisationBillingCity) {
    fields.push({
      key: 'organisation_billing_city',
      label: 'Ville facturation',
      category: 'organisation',
      inputType: 'text',
    });
  }

  return buildResult(fields.filter(f => !ignored.has(f.key)));
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
