/**
 * Constantes LinkMe - SSOT (Single Source of Truth)
 *
 * Ce fichier contient toutes les constantes utilisées dans LinkMe.
 * NE JAMAIS dupliquer ces valeurs ailleurs dans le code !
 *
 * @module linkme/constants
 * @since 2026-01-21
 */

export const LINKME_CONSTANTS = {
  /**
   * Commission plateforme LinkMe prélevée sur le prix de vente (%)
   * Cette commission est ajoutée au prix de base pour obtenir le prix LinkMe
   */
  PLATFORM_COMMISSION_RATE: 5,

  /**
   * Marge minimum autorisée pour les affiliés (%)
   * En dessous de ce seuil, l'affilié ne peut pas configurer sa marge
   */
  MIN_MARGIN: 1,

  /**
   * Marge maximum recommandée par défaut (%)
   * Peut être surchargée par channel_pricing pour chaque produit
   */
  MAX_MARGIN: 50,

  /**
   * Buffer de sécurité par rapport au prix public (%)
   * Le prix de vente affilié doit rester en dessous de: prix_public × (1 - BUFFER_RATE/100)
   */
  BUFFER_RATE: 5,

  /**
   * Taux de TVA par défaut (France)
   */
  DEFAULT_TAX_RATE: 0.2,

  /**
   * Seuils des feux tricolores pour la visualisation des marges
   *
   * - VERT: 0% → suggested_margin (compétitif, favorise les ventes)
   * - ORANGE: suggested_margin → suggested_margin × 2 (équilibre marge/compétitivité)
   * - ROUGE: > suggested_margin × 2 (proche du prix public)
   */
  TRAFFIC_LIGHTS: {
    /** Multiplicateur pour la fin de zone verte (1 = marge suggérée) */
    GREEN_END_MULTIPLIER: 1,
    /** Multiplicateur pour la fin de zone orange (2 = double de la marge suggérée) */
    ORANGE_END_MULTIPLIER: 2,
    /** Multiplicateur pour le début de zone rouge (identique à ORANGE_END) */
    RED_START_MULTIPLIER: 2,
  },

  /**
   * Commission par défaut pour les produits affiliés (créés par les affiliés)
   * Vérone prélève cette commission sur le prix de vente
   */
  DEFAULT_AFFILIATE_PRODUCT_COMMISSION: 15,
} as const;

/**
 * Type utilitaire pour les valeurs des constantes
 */
export type LinkMeConstants = typeof LINKME_CONSTANTS;

/**
 * Alias pratiques pour les constantes les plus utilisées
 */
export const {
  PLATFORM_COMMISSION_RATE,
  MIN_MARGIN,
  MAX_MARGIN,
  BUFFER_RATE,
  DEFAULT_TAX_RATE,
  TRAFFIC_LIGHTS,
  DEFAULT_AFFILIATE_PRODUCT_COMMISSION,
} = LINKME_CONSTANTS;
