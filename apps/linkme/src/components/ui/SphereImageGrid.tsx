'use client';

/**
 * SphereImageGrid - Interactive 3D Image Sphere Component
 *
 * Composant React affichant des images en sphère 3D avec distribution Fibonacci.
 * Supporte drag-to-rotate, momentum physics, auto-rotation et modal.
 *
 * Source: https://21st.dev/community/components/tonyzebastian/img-sphere/default
 *
 * @module SphereImageGrid
 * @since 2026-01-06
 * @updated 2026-04-14 - Refactoring: extraction hook + types + modal
 */

import React, { useCallback } from 'react';

import Image from 'next/image';

// Re-exports for backward compatibility
export type {
  Position3D,
  SphericalPosition,
  WorldPosition,
  SphereImageData,
  SphereImageGridProps,
} from './sphere/sphere-image-grid.types';
export { SPHERE_MATH } from './sphere/sphere-image-grid.types';

import type {
  SphereImageData,
  SphereImageGridProps,
} from './sphere/sphere-image-grid.types';
import { useSphereGrid } from './sphere/use-sphere-grid';
import { SphereSpotlightModal } from './sphere/SphereSpotlightModal';

const SphereImageGrid: React.FC<SphereImageGridProps> = ({
  images = [],
  containerSize = 400,
  sphereRadius = 200,
  dragSensitivity = 0.5,
  momentumDecay = 0.95,
  maxRotationSpeed = 5,
  baseImageScale = 0.12,
  hoverScale: _hoverScale = 1.2,
  perspective = 1000,
  autoRotate = false,
  autoRotateSpeed = 0.3,
  className = '',
}) => {
  const {
    isMounted,
    selectedImage,
    setSelectedImage,
    hoveredIndex,
    setHoveredIndex,
    containerRef,
    worldPositions,
    baseImageSize,
    handleMouseDown,
    handleTouchStart,
  } = useSphereGrid({
    images,
    containerSize,
    sphereRadius,
    dragSensitivity,
    momentumDecay,
    maxRotationSpeed,
    baseImageScale,
    autoRotate,
    autoRotateSpeed,
  });

  const renderImageNode = useCallback(
    (image: SphereImageData, index: number) => {
      const position = worldPositions[index];
      if (!position?.isVisible) return null;

      const imageSize = baseImageSize * position.scale;
      const isHovered = hoveredIndex === index;
      const finalScale = isHovered ? Math.min(1.2, 1.2 / position.scale) : 1;

      return (
        <div
          key={image.id}
          className="absolute cursor-pointer select-none transition-transform duration-200 ease-out"
          style={{
            width: `${imageSize}px`,
            height: `${imageSize}px`,
            left: `${containerSize / 2 + position.x}px`,
            top: `${containerSize / 2 + position.y}px`,
            opacity: position.fadeOpacity,
            transform: `translate(-50%, -50%) scale(${finalScale})`,
            zIndex: position.zIndex,
          }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={() => setSelectedImage(image)}
        >
          <div className="relative w-full h-full rounded-full overflow-hidden shadow-lg border-2 border-white/20">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              draggable={false}
              priority={index < 3}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      );
    },
    [
      worldPositions,
      baseImageSize,
      containerSize,
      hoveredIndex,
      setHoveredIndex,
      setSelectedImage,
    ]
  );

  if (!isMounted) {
    return (
      <div
        className="bg-gray-100 rounded-lg animate-pulse flex items-center justify-center"
        style={{ width: containerSize, height: containerSize }}
      >
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (!images.length) {
    return (
      <div
        className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
        style={{ width: containerSize, height: containerSize }}
      >
        <div className="text-gray-400 text-center">
          <p>Aucune image</p>
          <p className="text-sm">Ajoutez des images pour afficher la sphère</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div
        ref={containerRef}
        className={`relative select-none cursor-grab active:cursor-grabbing ${className}`}
        style={{
          width: containerSize,
          height: containerSize,
          perspective: `${perspective}px`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="relative w-full h-full" style={{ zIndex: 10 }}>
          {images.map((image, index) => renderImageNode(image, index))}
        </div>
      </div>

      {selectedImage && (
        <SphereSpotlightModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
};

export default SphereImageGrid;
export { SphereImageGrid };
