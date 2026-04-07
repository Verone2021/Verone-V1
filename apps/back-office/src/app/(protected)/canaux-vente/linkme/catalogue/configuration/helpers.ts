/** Taux de TVA par défaut (20% France) */
export const TVA_RATE = 0.2;

/**
 * Convertit un prix TTC en HT
 * Formule : HT = TTC / (1 + TVA) = TTC / 1.20
 */
export const ttcToHt = (ttc: number): number => ttc / (1 + TVA_RATE);

/**
 * Convertit un prix HT en TTC
 * Formule : TTC = HT × (1 + TVA) = HT × 1.20
 */
export const htToTtc = (ht: number): number => ht * (1 + TVA_RATE);
