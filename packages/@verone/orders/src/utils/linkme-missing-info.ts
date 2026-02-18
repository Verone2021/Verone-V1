/**
 * Utilitaire de détection d'infos manquantes pour commandes LinkMe
 * Utilisé pour :
 * - Afficher un badge/banner sur la page détail (status draft)
 * - Warning à la validation (draft → validated) si infos manquantes
 */

export interface MissingInfoItem {
  /** Clé technique du champ */
  field: string;
  /** Label lisible pour l'UI */
  label: string;
  /** Catégorie du champ manquant */
  category:
    | 'delivery_contact'
    | 'billing_contact'
    | 'delivery_address'
    | 'billing_address';
}

export interface LinkMeOrderMissingInfo {
  /** Liste des champs manquants */
  items: MissingInfoItem[];
  /** Nombre total d'infos manquantes */
  count: number;
  /** Aucune info manquante */
  isComplete: boolean;
}

/**
 * Données de la commande nécessaires pour la détection
 * Compatible avec les données retournées par fetchLinkMeOrderById + linkme_details
 */
export interface LinkMeOrderForMissingCheck {
  /** Données du sous-objet sales_order_linkme_details */
  linkme_details?: {
    delivery_contact_name?: string | null;
    delivery_contact_email?: string | null;
    delivery_contact_phone?: string | null;
    delivery_address?: string | null;
    delivery_postal_code?: string | null;
    delivery_city?: string | null;
    billing_name?: string | null;
    billing_email?: string | null;
    billing_phone?: string | null;
  } | null;
  /** Adresse de facturation (jsonb sur sales_orders) */
  billing_address?: unknown;
  /** Adresse de livraison (jsonb sur sales_orders) */
  shipping_address?: unknown;
}

/**
 * Détecte les infos manquantes sur une commande LinkMe
 */
export function detectMissingInfo(
  order: LinkMeOrderForMissingCheck
): LinkMeOrderMissingInfo {
  const items: MissingInfoItem[] = [];
  const details = order.linkme_details;

  // Contact livraison
  if (!details?.delivery_contact_name) {
    items.push({
      field: 'delivery_contact_name',
      label: 'Nom du contact livraison',
      category: 'delivery_contact',
    });
  }
  if (!details?.delivery_contact_email) {
    items.push({
      field: 'delivery_contact_email',
      label: 'Email du contact livraison',
      category: 'delivery_contact',
    });
  }
  if (!details?.delivery_contact_phone) {
    items.push({
      field: 'delivery_contact_phone',
      label: 'Téléphone du contact livraison',
      category: 'delivery_contact',
    });
  }

  // Adresse livraison
  if (!details?.delivery_address) {
    items.push({
      field: 'delivery_address',
      label: 'Adresse de livraison',
      category: 'delivery_address',
    });
  }
  if (!details?.delivery_postal_code) {
    items.push({
      field: 'delivery_postal_code',
      label: 'Code postal livraison',
      category: 'delivery_address',
    });
  }
  if (!details?.delivery_city) {
    items.push({
      field: 'delivery_city',
      label: 'Ville de livraison',
      category: 'delivery_address',
    });
  }

  // Contact facturation
  if (!details?.billing_name) {
    items.push({
      field: 'billing_name',
      label: 'Nom du contact facturation',
      category: 'billing_contact',
    });
  }
  if (!details?.billing_email) {
    items.push({
      field: 'billing_email',
      label: 'Email du contact facturation',
      category: 'billing_contact',
    });
  }
  if (!details?.billing_phone) {
    items.push({
      field: 'billing_phone',
      label: 'Téléphone du contact facturation',
      category: 'billing_contact',
    });
  }

  // Adresse facturation (jsonb sur sales_orders)
  if (!order.billing_address) {
    items.push({
      field: 'billing_address',
      label: 'Adresse de facturation',
      category: 'billing_address',
    });
  }

  return {
    items,
    count: items.length,
    isComplete: items.length === 0,
  };
}

/**
 * Retourne un résumé par catégorie des infos manquantes
 */
export function getMissingInfoSummary(
  missingInfo: LinkMeOrderMissingInfo
): string[] {
  const categories = new Map<string, string>();

  for (const item of missingInfo.items) {
    if (!categories.has(item.category)) {
      switch (item.category) {
        case 'delivery_contact':
          categories.set(item.category, 'Contact de livraison incomplet');
          break;
        case 'billing_contact':
          categories.set(item.category, 'Contact de facturation incomplet');
          break;
        case 'delivery_address':
          categories.set(item.category, 'Adresse de livraison incomplète');
          break;
        case 'billing_address':
          categories.set(item.category, 'Adresse de facturation manquante');
          break;
      }
    }
  }

  return Array.from(categories.values());
}
