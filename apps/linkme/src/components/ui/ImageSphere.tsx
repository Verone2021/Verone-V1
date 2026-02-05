'use client';

/**
 * ImageSphere Component
 * Globe 3D interactif avec images flottantes
 * Basé sur la librairie cobe (WebGL léger ~8kb)
 *
 * @module ImageSphere
 * @since 2026-01-06
 */

import { useEffect, useRef, useCallback } from 'react';

import Image from 'next/image';

import createGlobe, { type COBEOptions } from 'cobe';

import { cn } from '@/lib/utils';

// Couleurs LinkMe (constantes hors composant pour éviter re-renders)
const LINKME_MARINE: [number, number, number] = [0.08, 0.15, 0.35];
const LINKME_TURQUOISE: [number, number, number] = [0.2, 0.8, 0.75];

export type GlobeImage = {
  id: string;
  url: string;
  alt: string;
  type: 'product' | 'organisation';
};

type ImageSphereProps = {
  images: GlobeImage[];
  size?: number;
  autoRotate?: boolean;
  rotationSpeed?: number;
  className?: string;
};

export function ImageSphere({
  images,
  size = 400,
  autoRotate = true,
  rotationSpeed = 0.003,
  className,
}: ImageSphereProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const phiRef = useRef(0);

  // Générer des marqueurs à partir des images (positions aléatoires mais déterministes)
  const markers = images.slice(0, 30).map((_, index) => {
    const seed = index * 137.508; // Nombre d'or pour distribution
    return {
      location: [
        Math.sin(seed) * 70, // latitude -70 à 70
        ((seed * 2.5) % 360) - 180, // longitude -180 à 180
      ] as [number, number],
      size: 0.06 + (index % 3) * 0.02,
    };
  });

  const onRender = useCallback(
    (state: Record<string, number>) => {
      if (pointerInteracting.current !== null) {
        state.phi = phiRef.current + pointerInteractionMovement.current / 200;
      } else if (autoRotate) {
        state.phi = phiRef.current;
        phiRef.current += rotationSpeed;
      }
      state.width = size * 2;
      state.height = size * 2;
    },
    [autoRotate, rotationSpeed, size]
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    let width = size * 2;

    const globeConfig: COBEOptions = {
      devicePixelRatio: 2,
      width: width,
      height: width,
      phi: 0,
      theta: 0.25,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 4,
      baseColor: LINKME_MARINE,
      markerColor: LINKME_TURQUOISE,
      glowColor: LINKME_MARINE,
      markers: markers,
      onRender: onRender,
    };

    const globe = createGlobe(canvasRef.current, globeConfig);

    // Gestion du resize
    const handleResize = (): void => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth * 2;
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      globe.destroy();
      window.removeEventListener('resize', handleResize);
    };
  }, [size, markers, onRender]);

  // Handlers pour l'interaction au pointeur
  const handlePointerDown = (
    e: React.PointerEvent<HTMLCanvasElement>
  ): void => {
    pointerInteracting.current = e.clientX;
    canvasRef.current?.style.setProperty('cursor', 'grabbing');
  };

  const handlePointerUp = (): void => {
    pointerInteracting.current = null;
    canvasRef.current?.style.setProperty('cursor', 'grab');
  };

  const handlePointerOut = (): void => {
    pointerInteracting.current = null;
    canvasRef.current?.style.setProperty('cursor', 'grab');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (pointerInteracting.current !== null) {
      const delta = e.clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
    }
  };

  return (
    <div
      className={cn('relative', className)}
      style={{
        width: size,
        height: size,
        aspectRatio: '1',
      }}
    >
      {/* Globe Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerOut}
        onMouseMove={handleMouseMove}
        style={{
          width: size,
          height: size,
          cursor: 'grab',
          contain: 'layout paint size',
          opacity: 1,
        }}
      />

      {/* Images flottantes autour du globe */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {images.slice(0, 8).map((image, index) => {
          // Positions en cercle autour du globe
          const angle = (index / 8) * Math.PI * 2;
          const radius = 42; // % from center
          const top = 50 + Math.sin(angle) * radius;
          const left = 50 + Math.cos(angle) * radius;

          return (
            <div
              key={image.id}
              className={cn(
                'absolute w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden',
                'border-2 border-white/40 shadow-xl backdrop-blur-sm',
                'animate-float bg-white/10'
              )}
              style={{
                top: `${top}%`,
                left: `${left}%`,
                transform: 'translate(-50%, -50%)',
                animationDelay: `${index * 0.4}s`,
                animationDuration: `${3 + (index % 3)}s`,
              }}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          );
        })}
      </div>

      {/* Glow effect */}
      <div
        className="absolute inset-0 pointer-events-none rounded-full"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, rgba(46, 204, 193, 0.15) 0%, transparent 50%)',
        }}
      />
    </div>
  );
}

export default ImageSphere;
