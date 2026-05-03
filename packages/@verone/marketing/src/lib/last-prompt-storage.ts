/**
 * Pont Studio Marketing → DAM via localStorage.
 *
 * Quand l'utilisateur copie un prompt depuis `<PromptPreview>`, on stocke ici
 * le contenu + un timestamp. Quand il ouvre la modale d'upload de la DAM
 * dans la foulée (typiquement après être allé générer dans Nano Banana et
 * être revenu télécharger l'image), la modale propose de pré-remplir
 * `source = ai_generated` et `ai_prompt_used`.
 *
 * Pas de stockage serveur : c'est volontairement local et éphémère. Si Roméo
 * change d'appareil ou ferme l'onglet > 24 h, le prompt est oublié.
 */

const STORAGE_KEY = 'verone.lastNanoBananaPrompt.v1';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 h

export interface StoredPrompt {
  prompt: string;
  brandSlug: string | null;
  presetId: string | null;
  productLabel: string | null;
  copiedAt: number; // ms epoch
}

function isStoredPrompt(value: unknown): value is StoredPrompt {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v['prompt'] === 'string' && typeof v['copiedAt'] === 'number';
}

export function saveLastPrompt(input: Omit<StoredPrompt, 'copiedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: StoredPrompt = { ...input, copiedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage indisponible (mode privé, quota plein…) — silencieux.
  }
}

export function readLastPrompt(): StoredPrompt | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredPrompt(parsed)) return null;
    if (Date.now() - parsed.copiedAt > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearLastPrompt(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silencieux
  }
}

/**
 * Retourne une chaîne lisible "il y a X minutes" / "il y a X heures".
 */
export function formatPromptAge(copiedAt: number): string {
  const diffMs = Date.now() - copiedAt;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  return "il y a plus d'un jour";
}
