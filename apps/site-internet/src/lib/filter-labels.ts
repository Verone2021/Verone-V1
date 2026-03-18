/** Mapping enum values to French display labels for catalogue filters */

export const ROOM_LABELS: Record<string, string> = {
  salon: 'Salon',
  chambre: 'Chambre',
  bureau: 'Bureau',
  salle_à_manger: 'Salle à manger',
  salle_a_manger: 'Salle à manger',
  hall: 'Hall / Entrée',
  cuisine: 'Cuisine',
  salle_de_bain: 'Salle de bain',
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
  naturel: '#D2B48C',
  blanc: '#FFFFFF',
  orange: '#FF6B35',
  jaune: '#F5D547',
  kaki: '#6B6B3D',
  'bleu-vert': '#2E8B8B',
  'bleu indigo': '#3F51B5',
  rouille: '#B7410E',
  terracotta: '#CC6644',
  vert: '#4CAF50',
  'vert foncé': '#2E7D32',
  multicolore: '#888888',
  noir: '#1A1A1A',
  gris: '#9E9E9E',
  beige: '#F5F0E8',
  rose: '#E91E63',
  bleu: '#2196F3',
  rouge: '#E53935',
  marron: '#795548',
  doré: '#C8A951',
};

export function getColorHex(colorName: string): string {
  return COLOR_HEX_MAP[colorName.toLowerCase()] ?? '#CCCCCC';
}

export function getColorLabel(colorName: string): string {
  return colorName.charAt(0).toUpperCase() + colorName.slice(1).toLowerCase();
}
