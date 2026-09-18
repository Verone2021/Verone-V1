/**
 * Saisies de formulaire tolérantes — adresses web et nombres décimaux.
 *
 * Origine : le 17/09/2026, la création d'un produit de sourcing ne
 * s'enregistrait plus. Deux causes, toutes deux au niveau du navigateur :
 *
 * - un champ `type="url"` refuse « zentrada.com/article/123 » (pas de schéma)
 *   et **bloque l'envoi du formulaire** sans qu'aucun message n'apparaisse
 *   dans la page ;
 * - un champ `type="number"` considère « 12,50 » comme invalide : `value` vaut
 *   alors la chaîne vide, le prix saisi est purement et simplement perdu.
 *
 * Un utilisateur français tape une virgule et colle une adresse sans
 * « https:// ». C'est au logiciel de s'adapter, pas l'inverse.
 *
 * Sprint BO-SOURCING-FORM-006.
 */

/**
 * Complète une adresse web saisie sans schéma.
 *
 * - « » → chaîne vide (champ laissé vide, ce n'est pas une erreur)
 * - « https://x.fr » → inchangé
 * - « x.fr/produit » → « https://x.fr/produit »
 *
 * Ne valide rien : c'est `isValidUrl` qui juge.
 */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Vrai si l'adresse est exploitable une fois complétée, et qu'elle désigne
 * bien une page web (http/https — pas `javascript:` ni `file:`).
 */
export function isValidUrl(raw: string): boolean {
  const candidate = normalizeUrl(raw);
  if (!candidate) return false;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    // Un nom d'hôte sans point ("abc") n'est pas une adresse publique.
    return parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

/**
 * Lit un nombre décimal saisi à la française ou à l'anglaise.
 *
 * - « 12,50 » → 12.5
 * - « 12.50 » → 12.5
 * - une valeur separee par des espaces (y compris insecables) -> 1234.5
 * - « », « abc », « 12,, » → null
 */
export function parseDecimalInput(raw: string): number | null {
  const cleaned = raw
    .replace(/[\s\u00a0\u202f]/g, '')
    .replace(',', '.')
    .trim();
  if (!cleaned) return null;
  if (!/^-?\d*\.?\d*$/.test(cleaned)) return null;
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}
