/** Mapping enum values to French display labels for catalogue filters */

export const ROOM_LABELS: Record<string, string> = {
  salon: 'Salon',
  salon_sejour: 'Salon', // fusionné avec salon (cf. migration DB)
  chambre: 'Chambre',
  bureau: 'Bureau',
  salle_à_manger: 'Salle à manger',
  salle_a_manger: 'Salle à manger',
  hall: 'Hall & Entrée',
  hall_entree: 'Hall & Entrée',
  couloir: 'Couloir',
  cuisine: 'Cuisine',
  salle_de_bain: 'Salle de bain',
  bibliotheque: 'Bibliothèque',
  terrasse: 'Terrasse',
  jardin: 'Jardin',
  enfant: 'Chambre enfant',
  dressing: 'Dressing',
};

export const STYLE_LABELS: Record<string, string> = {
  art_deco: 'Art Déco',
  boheme: 'Bohème',
  classique: 'Classique',
  contemporain: 'Contemporain',
  design: 'Design',
  industriel: 'Industriel',
  nature: 'Nature',
  scandinave: 'Scandinave',
  vintage: 'Vintage',
  minimaliste: 'Minimaliste',
  ethnique: 'Ethnique',
  japandi: 'Japandi',
};

export function getRoomLabel(value: string): string {
  return (
    ROOM_LABELS[value] ??
    value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  );
}

export function getStyleLabel(value: string): string {
  return (
    STYLE_LABELS[value] ??
    value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  );
}

/** Color name (case-insensitive) → CSS hex for pastille display */
export const COLOR_HEX_MAP: Record<string, string> = {
  // Neutres
  blanc: '#FFFFFF',
  'blanc cassé': '#F5EFE6',
  noir: '#1A1A1A',
  gris: '#9E9E9E',
  beige: '#E4D9C4',
  'beige lin': '#E8DCC4',
  écru: '#F0E5D6',
  ecru: '#F0E5D6',
  nude: '#E4C9B6',
  neutre: '#D5D2CC',
  multicolore: '#888888',

  // Bruns / bois
  marron: '#795548',
  brun: '#8B4513',
  caramel: '#C68E58',
  bois: '#8B6F47',
  naturel: '#D2B48C',
  sable: '#E4C9A0',
  ocre: '#C28840',
  ambre: '#D89A2E',
  terracotta: '#CC6644',
  rouille: '#B05B3B',

  // Verts
  vert: '#4CAF50',
  'vert foncé': '#2E7D32',
  kaki: '#6B6B3D',
  matcha: '#8A9A5B',
  thym: '#9DA88E',

  // Bleus
  bleu: '#2196F3',
  'bleu indigo': '#3F51B5',
  'bleu-vert': '#2E8B8B',
  'bleu vert': '#2E8B8B',

  // Chauds
  rose: '#E91E63',
  'rose poudré': '#E8B8B8',
  rouge: '#E53935',
  orange: '#FF6B35',
  jaune: '#F5D547',
  violet: '#8E44AD',

  // Métalliques
  doré: '#C8A951',
  'doré satiné': '#C9A961',
  chrome: '#C0C0C0',
  chromé: '#C0C0C0',
};

export function getColorHex(colorName: string): string {
  return COLOR_HEX_MAP[colorName.toLowerCase().trim()] ?? '#CCCCCC';
}

export function getColorLabel(colorName: string): string {
  const trimmed = colorName.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Splitte une valeur couleur composée ("Beige,Blanc") en plusieurs noms
 * et renvoie une clé canonique (lowercase trim) pour chaque.
 * Utilisé pour dédupliquer / regrouper case-insensitive dans la sidebar.
 */
export function expandColorValue(raw: string): string[] {
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

/** Clé de groupement insensible à la casse + sans espace périphérique */
export function canonicalColorKey(colorName: string): string {
  return colorName.toLowerCase().trim();
}
