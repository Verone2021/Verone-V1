/**
 * PCG Themes — Classification thématique style Indy
 *
 * Organise les codes PCG en 6 thèmes lisibles par un non-comptable :
 * Revenus, Rémunérations, Fonctionnement, Déplacements, Frais fixes, Taxes
 *
 * Chaque entrée mappe un code PCG vers :
 * - theme : identifiant du thème
 * - label_fr : nom français lisible (style Indy)
 * - description : explication courte pour tooltip
 */

export type PcgThemeId =
  | 'revenus'
  | 'remunerations'
  | 'fonctionnement'
  | 'deplacements'
  | 'frais_fixes'
  | 'taxes';

export interface PcgTheme {
  id: PcgThemeId;
  label: string;
  color: string; // Tailwind dot color
  bgColor: string; // Tailwind background
  textColor: string; // Tailwind text
}

export const PCG_THEMES: PcgTheme[] = [
  {
    id: 'revenus',
    label: 'Revenus',
    color: 'bg-emerald-400',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
  },
  {
    id: 'remunerations',
    label: 'Rémunérations',
    color: 'bg-rose-400',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
  },
  {
    id: 'fonctionnement',
    label: 'Fonctionnement',
    color: 'bg-amber-400',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
  },
  {
    id: 'deplacements',
    label: 'Déplacements',
    color: 'bg-blue-400',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  {
    id: 'frais_fixes',
    label: 'Frais fixes',
    color: 'bg-purple-400',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
  },
  {
    id: 'taxes',
    label: 'Taxes',
    color: 'bg-slate-400',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
  },
];

export interface PcgThemeEntry {
  code: string;
  theme: PcgThemeId;
  label_fr: string;
  description: string;
}

/**
 * Mapping PCG → Thème style Indy
 * Couvre les codes les plus courants pour une SARL/SAS
 */
export const PCG_THEME_ENTRIES: PcgThemeEntry[] = [
  // ═══════════════════════════════════════════════
  // REVENUS (Classe 7 + comptes spéciaux)
  // ═══════════════════════════════════════════════
  {
    code: '707',
    theme: 'revenus',
    label_fr: 'Encaissement facture',
    description: 'Paiement reçu pour vente de marchandises',
  },
  {
    code: '706',
    theme: 'revenus',
    label_fr: 'Prestation de services',
    description: 'Facturation de services aux clients',
  },
  {
    code: '708',
    theme: 'revenus',
    label_fr: 'Activités annexes',
    description: 'Commissions, ports facturés, revenus secondaires',
  },
  {
    code: '758',
    theme: 'revenus',
    label_fr: 'Autres gains divers',
    description: 'Remboursements, produits de gestion courants',
  },
  {
    code: '768',
    theme: 'revenus',
    label_fr: 'Produits financiers',
    description: 'Intérêts, dividendes, gains de change',
  },
  {
    code: '775',
    theme: 'revenus',
    label_fr: "Vente d'une immobilisation",
    description: "Prix de vente d'un bien professionnel cédé",
  },
  {
    code: '455',
    theme: 'revenus',
    label_fr: "Apport d'associé",
    description: 'Versement sur compte courant associé',
  },
  {
    code: '74',
    theme: 'revenus',
    label_fr: 'Subventions',
    description: "Aides et subventions d'exploitation reçues",
  },

  // ═══════════════════════════════════════════════
  // RÉMUNÉRATIONS (Classe 64 + charges sociales)
  // ═══════════════════════════════════════════════
  {
    code: '641',
    theme: 'remunerations',
    label_fr: 'Salaires',
    description: 'Rémunérations brutes du personnel',
  },
  {
    code: '645',
    theme: 'remunerations',
    label_fr: 'Cotisations sociales',
    description: 'URSSAF, retraite, prévoyance, mutuelle',
  },
  {
    code: '648',
    theme: 'remunerations',
    label_fr: 'Autres charges sociales',
    description: 'Formation, médecine du travail',
  },
  {
    code: '621',
    theme: 'remunerations',
    label_fr: 'Personnel intérimaire',
    description: 'Intérimaires et personnel détaché',
  },

  // ═══════════════════════════════════════════════
  // FONCTIONNEMENT (Achats, fournitures, services)
  // ═══════════════════════════════════════════════
  {
    code: '607',
    theme: 'fonctionnement',
    label_fr: 'Achats de marchandises',
    description: 'Produits achetés pour revente',
  },
  {
    code: '601',
    theme: 'fonctionnement',
    label_fr: 'Matières premières',
    description: 'Matières entrant dans la fabrication',
  },
  {
    code: '604',
    theme: 'fonctionnement',
    label_fr: 'Prestation de service',
    description: 'Services achetés à des prestataires',
  },
  {
    code: '611',
    theme: 'fonctionnement',
    label_fr: 'Sous-traitance',
    description: 'Travaux sous-traités à des tiers',
  },
  {
    code: '6226',
    theme: 'fonctionnement',
    label_fr: 'Honoraires',
    description: 'Comptable, avocat, consultant',
  },
  {
    code: '622',
    theme: 'fonctionnement',
    label_fr: 'Honoraires divers',
    description: 'Rémunérations intermédiaires et honoraires',
  },
  {
    code: '623',
    theme: 'fonctionnement',
    label_fr: 'Marketing et publicité',
    description: 'Communication, publicité, cadeaux clients',
  },
  {
    code: '651',
    theme: 'fonctionnement',
    label_fr: 'Abonnement logiciel',
    description: 'SaaS, licences, redevances',
  },
  {
    code: '6064',
    theme: 'fonctionnement',
    label_fr: 'Fournitures de bureau',
    description: 'Papeterie, consommables',
  },
  {
    code: '658',
    theme: 'fonctionnement',
    label_fr: 'Charges diverses',
    description: 'Autres charges de gestion courante',
  },

  // ═══════════════════════════════════════════════
  // DÉPLACEMENTS (Transport, repas, hébergement)
  // ═══════════════════════════════════════════════
  {
    code: '6251',
    theme: 'deplacements',
    label_fr: 'Frais de déplacement',
    description: 'Train, avion, carburant, péages',
  },
  {
    code: '6256',
    theme: 'deplacements',
    label_fr: 'Hôtel et hébergement',
    description: 'Nuitées en déplacement professionnel',
  },
  {
    code: '6257',
    theme: 'deplacements',
    label_fr: "Restaurant et repas d'affaires",
    description: 'Repas clients et réceptions professionnelles',
  },
  {
    code: '625',
    theme: 'deplacements',
    label_fr: 'Déplacements et réceptions',
    description: 'Voyages, repas et hébergement professionnels',
  },
  {
    code: '624',
    theme: 'deplacements',
    label_fr: 'Transport et livraisons',
    description: 'Frais de port, livraison marchandises',
  },
  {
    code: '612',
    theme: 'deplacements',
    label_fr: 'Crédit-bail véhicule',
    description: 'Leasing véhicule professionnel',
  },

  // ═══════════════════════════════════════════════
  // FRAIS FIXES (Loyer, assurance, énergie, banque)
  // ═══════════════════════════════════════════════
  {
    code: '613',
    theme: 'frais_fixes',
    label_fr: 'Loyers et charges locatives',
    description: 'Loyer bureaux, entrepôt, charges',
  },
  {
    code: '6132',
    theme: 'frais_fixes',
    label_fr: 'Loyer bureaux',
    description: 'Location locaux professionnels',
  },
  {
    code: '616',
    theme: 'frais_fixes',
    label_fr: 'Assurance professionnelle',
    description: 'RC Pro, multirisque, véhicule',
  },
  {
    code: '6061',
    theme: 'frais_fixes',
    label_fr: 'Eau, gaz, électricité',
    description: 'Fournitures énergie et eau',
  },
  {
    code: '6262',
    theme: 'frais_fixes',
    label_fr: 'Téléphone et internet',
    description: 'Abonnements télécoms et internet',
  },
  {
    code: '626',
    theme: 'frais_fixes',
    label_fr: 'Télécommunications',
    description: 'Téléphone, internet, poste',
  },
  {
    code: '615',
    theme: 'frais_fixes',
    label_fr: 'Entretien et réparation',
    description: 'Maintenance locaux et matériel',
  },
  {
    code: '6278',
    theme: 'frais_fixes',
    label_fr: 'Frais bancaires',
    description: 'Tenue de compte, commissions, CB',
  },
  {
    code: '627',
    theme: 'frais_fixes',
    label_fr: 'Services bancaires',
    description: 'Frais bancaires et commissions',
  },

  // ═══════════════════════════════════════════════
  // TAXES (Impôts, TVA, CFE)
  // ═══════════════════════════════════════════════
  {
    code: '695',
    theme: 'taxes',
    label_fr: 'Impôts sur les bénéfices',
    description: 'IS (Impôt sur les Sociétés)',
  },
  {
    code: '635',
    theme: 'taxes',
    label_fr: 'CFE et autres impôts',
    description: 'CFE, CVAE, taxes foncières',
  },
  {
    code: '631',
    theme: 'taxes',
    label_fr: 'Taxes sur rémunérations',
    description: 'Taxe sur salaires, apprentissage',
  },
  {
    code: '6712',
    theme: 'taxes',
    label_fr: 'Pénalités et amendes',
    description: 'Amendes fiscales, majorations',
  },
];

/**
 * Map rapide code PCG → entrée thématique
 */
export const PCG_THEME_MAP = new Map<string, PcgThemeEntry>(
  PCG_THEME_ENTRIES.map(entry => [entry.code, entry])
);

/**
 * Obtenir les entrées thématiques groupées par thème
 */
export function getPcgEntriesByTheme(): Record<PcgThemeId, PcgThemeEntry[]> {
  const grouped: Record<PcgThemeId, PcgThemeEntry[]> = {
    revenus: [],
    remunerations: [],
    fonctionnement: [],
    deplacements: [],
    frais_fixes: [],
    taxes: [],
  };

  for (const entry of PCG_THEME_ENTRIES) {
    grouped[entry.theme].push(entry);
  }

  return grouped;
}

/**
 * Obtenir le thème d'un code PCG
 * Cherche le code exact, puis par préfixe
 */
export function getPcgTheme(code: string): PcgTheme | undefined {
  const entry = PCG_THEME_MAP.get(code);
  if (entry) {
    return PCG_THEMES.find(t => t.id === entry.theme);
  }

  // Chercher par préfixe (ex: 6278 → 627 → 62)
  for (let len = code.length - 1; len >= 2; len--) {
    const prefix = code.substring(0, len);
    const prefixEntry = PCG_THEME_MAP.get(prefix);
    if (prefixEntry) {
      return PCG_THEMES.find(t => t.id === prefixEntry.theme);
    }
  }

  return undefined;
}
