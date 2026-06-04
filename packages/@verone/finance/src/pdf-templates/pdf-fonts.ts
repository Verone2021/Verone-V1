import { Font } from '@react-pdf/renderer';

/**
 * Enregistrement des polices de marque Vérone pour les PDF @react-pdf/renderer.
 *
 * Bodoni Moda (titres) + Montserrat (texte), instances statiques TTF servies
 * depuis `apps/back-office/public/fonts/`. Les PDF sont générés côté navigateur,
 * donc `src` pointe une URL absolue résolue sur l'origine du back-office.
 *
 * Remplace l'usage historique d'Helvetica (cf. note dans `shared-styles.ts`).
 * Familles enregistrées : 'Montserrat' (400, 600) et 'Bodoni Moda' (700).
 */

let registered = false;

export function registerVeronePdfFonts(): void {
  if (registered) return;
  registered = true;

  Font.register({
    family: 'Montserrat',
    fonts: [
      { src: '/fonts/montserrat-400.ttf', fontWeight: 400 },
      { src: '/fonts/montserrat-600.ttf', fontWeight: 600 },
    ],
  });

  Font.register({
    family: 'Bodoni Moda',
    fonts: [{ src: '/fonts/bodoni-moda-700.ttf', fontWeight: 700 }],
  });

  // Évite les césures hasardeuses sur les libellés produits/colonnes des PDF.
  Font.registerHyphenationCallback(word => [word]);
}
