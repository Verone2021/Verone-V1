// =====================================================================
// HELPERS — Generic word set + keyword extractor
// =====================================================================

/** Generic legal suffixes to ignore when extracting search keywords */
export const GENERIC_WORDS = new Set([
  'gmbh',
  'sarl',
  'sas',
  'sasu',
  'eurl',
  'sa',
  'inc',
  'ltd',
  'llc',
  'co',
  'kg',
  'ag',
  'bv',
  'nv',
  'plc',
  'corp',
  'europe',
  'france',
  'international',
  'group',
  'holding',
  'the',
  'and',
  'und',
  'les',
  'des',
]);

/**
 * Extract the best search keyword from customer names.
 *
 * Priority:
 *   1. altName if provided (trade name, usually short and discriminant: "PK Prado")
 *   2. name if short enough (< 20 chars → use as-is minus generic words)
 *   3. Longest meaningful word from name (fallback)
 */
export function extractSearchKeyword(
  name: string,
  altName?: string | null
): string {
  // Priority 1: altName (trade name / short commercial name)
  if (altName) {
    const altWords = altName
      .toLowerCase()
      .replace(/[^a-zà-ÿ0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !GENERIC_WORDS.has(w));
    if (altWords.length > 0) {
      // If altName is short, use it entirely (most discriminant)
      if (altWords.join(' ').length <= 20) {
        return altWords.join(' ');
      }
      // Otherwise pick longest word
      return altWords.reduce(
        (best, w) => (w.length > best.length ? w : best),
        altWords[0]
      );
    }
  }

  // Priority 2 & 3: primary name
  const words = name
    .toLowerCase()
    .replace(/[^a-zà-ÿ0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !GENERIC_WORDS.has(w));

  if (words.length === 0) return '';

  // If short enough, return all meaningful words joined
  const joined = words.join(' ');
  if (joined.length <= 20) return joined;

  // Fallback: longest meaningful word
  return words.reduce(
    (best, w) => (w.length > best.length ? w : best),
    words[0]
  );
}
