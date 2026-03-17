import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vérone — Mobilier & Décoration Haut de Gamme',
    short_name: 'Vérone',
    description:
      "Mobilier et décoration d'intérieur haut de gamme pour sublimer votre espace de vie.",
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
