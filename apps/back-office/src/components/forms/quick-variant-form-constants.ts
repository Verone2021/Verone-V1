/**
 * Quick Variant Form — static data and options helpers
 */

export type VariantType = 'color' | 'size' | 'material' | 'pattern';

const COLOR_OPTIONS = [
  'Blanc',
  'Noir',
  'Gris',
  'Rouge',
  'Bleu',
  'Vert',
  'Jaune',
  'Orange',
  'Violet',
  'Rose',
  'Marron',
  'Beige',
  'Crème',
  'Doré',
  'Argenté',
] as const;

const SIZE_OPTIONS = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '30x30cm',
  '40x40cm',
  '50x50cm',
  '60x60cm',
  '80x80cm',
  '100x100cm',
  '120x80cm',
  '160x90cm',
  '200x100cm',
  '240x120cm',
] as const;

const MATERIAL_OPTIONS = [
  'Bois massif',
  'Métal',
  'Plastique',
  'Verre',
  'Cuir',
  'Tissu',
  'Rotin',
  'Osier',
  'Marbre',
  'Céramique',
  'Résine',
  'Bambou',
] as const;

const PATTERN_OPTIONS = [
  'Uni',
  'Rayé',
  'Carreaux',
  'Fleuri',
  'Géométrique',
  'Abstrait',
  'Vintage',
  'Moderne',
  'Classique',
  'Rustique',
] as const;

export function getVariantOptions(type: string): readonly string[] {
  switch (type) {
    case 'color':
      return COLOR_OPTIONS;
    case 'size':
      return SIZE_OPTIONS;
    case 'material':
      return MATERIAL_OPTIONS;
    case 'pattern':
      return PATTERN_OPTIONS;
    default:
      return [];
  }
}
