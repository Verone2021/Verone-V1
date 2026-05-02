import type { Brand } from '../types';

export const BRANDS: Brand[] = [
  {
    slug: 'verone',
    name: 'Vérone',
    description: 'Marque mère premium généraliste — déco/mobilier intérieur',
    visualIdentity: 'éditorial, sophistiqué, intemporel, neutre premium',
    palette: 'taupe, écru, gris perle, blanc cassé, beige rosé, noir profond',
    keywords:
      'Architectural Digest, Vogue Living, neutral premium, timeless, refined',
    avoid: 'couleurs saturées, ambiances enfantines, kitsch, néons',
  },
  {
    slug: 'bohemia',
    name: 'Bohemia',
    description:
      'Ambiance bohème + plage — Méditerranée, lin froissé, soleil rasant',
    visualIdentity:
      'casual, chaleureux, méditerranéen, lin froissé, soleil rasant, naturel décontracté',
    palette:
      'terracotta, écru, sable, lin naturel, verts désaturés (sauge, olivier), ocre, blanc cassé',
    keywords:
      'boho coastal, Mediterranean villa, Ibiza style, sun-drenched, raw textures, linen, rattan, woven',
    avoid: 'tons pastel, ambiances industrielles, néons, plastique brillant',
  },
  {
    slug: 'solar',
    name: 'Solar',
    description: 'Électronique, luminaire, spot, powerbank — tech sleek',
    visualIdentity:
      'tech sleek, packshot rigoureux, mise en valeur de la fonction lumineuse, contraste fort',
    palette:
      'noir mat, anthracite, blanc clean, accents technologiques (cuivre brossé, lumière ambrée chaude, blanc froid 5500K)',
    keywords:
      'minimalist tech, Apple-style, modern interior, dramatic lighting, sleek industrial design, focused beam',
    avoid: "ambiances kitsch, tons pastels, accumulation d'objets, fond bohème",
  },
  {
    slug: 'flos',
    name: 'Flos',
    description:
      'Plantes séchées + bougies — nature séchée, lumière tamisée, hygge',
    visualIdentity:
      'nature séchée, doux, bohème naturel, lumière tamisée, ambiance cosy automne/hiver',
    palette:
      'tons naturels (bois clair, beige, ocre, ivoire), vert sauge, ambré chaud, cire bougie, marron chocolat, blanc cassé',
    keywords:
      'cottagecore, slow living, autumn cozy, candlelit, dried botanicals, natural materials, hygge',
    avoid: 'tons saturés froids, ambiances industrielles ou tech, plastique',
  },
];

export const getBrand = (slug: string): Brand | undefined =>
  BRANDS.find(b => b.slug === slug);
