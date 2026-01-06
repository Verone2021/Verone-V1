'use client';

/**
 * Page d'accueil LinkMe - Design Minimaliste
 *
 * Page blanche avec seulement la sphère 3D centrée.
 * Design temporaire en attente de la nouvelle maquette.
 *
 * @module HomePage
 * @since 2026-01-06
 */

import { useState, useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { Loader2, LogIn } from 'lucide-react';

import {
  SphereImageGrid,
  type SphereImageData,
} from '@/components/ui/SphereImageGrid';
import { useAuth } from '@/contexts/AuthContext';

// Images de démonstration pour la sphère
const DEMO_SPHERE_IMAGES: SphereImageData[] = Array.from(
  { length: 30 },
  (_, i) => ({
    id: `demo-${i + 1}`,
    src: '/logo-linkme.png',
    alt: `LinkMe ${i + 1}`,
  })
);

export default function HomePage(): JSX.Element {
  const { user, loading: authLoading } = useAuth();
  const [sphereImages, setSphereImages] =
    useState<SphereImageData[]>(DEMO_SPHERE_IMAGES);
  const [isLoading, setIsLoading] = useState(true);

  // Configuration
  const [config, setConfig] = useState({
    globe_enabled: true,
    globe_rotation_speed: 0.3,
  });

  // Type pour la réponse API
  type GlobeApiItem = {
    id: string;
    name: string;
    image_url: string;
    item_type: 'product' | 'organisation';
  };

  // Charger la configuration
  useEffect(() => {
    async function loadConfig(): Promise<void> {
      try {
        const response = await fetch('/api/page-config/home');
        if (response.ok) {
          const data = (await response.json()) as {
            globe_enabled: boolean;
            globe_rotation_speed: number;
          };
          setConfig({
            globe_enabled: data.globe_enabled ?? true,
            globe_rotation_speed: (data.globe_rotation_speed ?? 0.003) * 100,
          });
        }
      } catch {
        // Config par défaut
      }
    }
    void loadConfig();
  }, []);

  // Charger les images
  useEffect(() => {
    async function loadImages(): Promise<void> {
      try {
        const response = await fetch('/api/globe-items');
        if (response.ok) {
          const data = (await response.json()) as { items: GlobeApiItem[] };
          if (data.items && data.items.length > 0) {
            const baseImages = data.items.map((item: GlobeApiItem) => ({
              id: item.id,
              src: item.image_url,
              alt: item.name,
            }));

            // Dupliquer pour remplir la sphère
            const images: SphereImageData[] = [];
            for (let i = 0; i < 40; i++) {
              const baseIndex = i % baseImages.length;
              images.push({
                ...baseImages[baseIndex],
                id: `sphere-${i}`,
              });
            }
            setSphereImages(images);
          }
        }
      } catch {
        // Images de démo
      } finally {
        setIsLoading(false);
      }
    }
    void loadImages();
  }, []);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-linkme-turquoise" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center relative">
      {/* Bouton connexion en haut à droite (si non connecté) */}
      {!user && (
        <div className="absolute top-6 right-6 z-20">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-linkme-turquoise text-white rounded-full font-semibold hover:bg-linkme-turquoise/90 transition-all shadow-lg hover:shadow-xl"
          >
            <LogIn className="h-5 w-5" />
            Se connecter
          </Link>
        </div>
      )}

      {/* Contenu central : Logo + Sphère */}
      <div className="flex flex-col items-center">
        {/* Logo LinkMe centré */}
        <div className="mb-8">
          <Image
            src="/logo-linkme-full.png"
            alt="LinkMe"
            width={180}
            height={180}
            className="w-36 h-36 object-contain"
            priority
          />
        </div>

        {/* Sphère 3D */}
        {config.globe_enabled && (
          <SphereImageGrid
            images={sphereImages}
            containerSize={500}
            sphereRadius={180}
            autoRotate
            autoRotateSpeed={config.globe_rotation_speed}
            baseImageScale={0.12}
          />
        )}
      </div>
    </div>
  );
}
