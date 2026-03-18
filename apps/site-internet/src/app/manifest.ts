import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vérone — Concept Store Déco & Mobilier Original',
    short_name: 'Vérone',
    description:
      'Concept store en ligne — produits originaux de déco et mobilier, sourcés avec soin, au juste prix.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1a1a1a',
    icons: [
      {
        src: '/logo-verone.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo-verone.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
