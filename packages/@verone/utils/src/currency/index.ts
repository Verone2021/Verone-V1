/**
 * Currency — utilitaires de conversion monétaire pour les prix d'achat
 *
 * Les prix de VENTE, la marge et le CA restent TOUJOURS en euros.
 * Seuls les prix d'ACHAT (cost_price, cost_price_override, frais fournisseur)
 * peuvent être libellés en dollars.
 *
 * Le taux est FIGÉ sur la ligne au moment de la saisie : une consultation
 * ancienne ne change plus de valeur quand le dollar évolue.
 *
 * Taux initial : 1 USD = 0,87 EUR (valeur saisie par Roméo le 17/09/2026).
 * La récupération automatique du taux est un chantier ultérieur.
 *
 * Sprint BO-CONSULT-CURRENCY-001 — 2026-09-17
 */

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Monnaies d'achat supportées. Les prix de vente restent toujours en EUR. */
export const SUPPORTED_PURCHASE_CURRENCIES = ['EUR', 'USD'] as const;

/** Type union des monnaies d'achat. */
export type PurchaseCurrency = (typeof SUPPORTED_PURCHASE_CURRENCIES)[number];

/**
 * Taux de change dollar → euro par défaut.
 * Valeur saisie par Roméo le 17/09/2026 : 1 USD = 0,87 EUR.
 * La récupération automatique du taux est un chantier ultérieur.
 */
export const USD_TO_EUR_DEFAULT = 0.87;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convertit un montant dans une monnaie donnée en euros.
 *
 * - Si la monnaie est EUR (ou absente), retourne le montant inchangé.
 * - Sinon applique le taux et arrondit au centime.
 *
 * L'arrondi utilise `Math.round(x * 100) / 100` — méthode cohérente avec
 * les affichages `.toFixed(2)` du reste du module consultations.
 *
 * @param amount   Montant dans la monnaie source.
 * @param currency Code monnaie source ('EUR' | 'USD').
 * @param rate     Taux de conversion vers EUR (ex: 0.87 pour USD). Doit être > 0.
 */
export function convertToEur(
  amount: number,
  currency: string,
  rate: number
): number {
  if (currency === 'EUR') return amount;
  if (!Number.isFinite(rate) || rate <= 0) return amount;
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Taux par défaut pour une monnaie.
 * - EUR → 1 (identité)
 * - USD → USD_TO_EUR_DEFAULT
 * - Toute autre monnaie → 1 (safe fallback, ne convertit pas)
 */
export function defaultRateFor(currency: string): number {
  if (currency === 'USD') return USD_TO_EUR_DEFAULT;
  return 1;
}
