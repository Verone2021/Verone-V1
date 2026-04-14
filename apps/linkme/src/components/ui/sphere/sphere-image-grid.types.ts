/**
 * Types et constantes pour SphereImageGrid
 *
 * @module sphere-image-grid.types
 * @since 2026-04-14
 */

// ============================================================================
// TYPES
// ============================================================================

export type Position3D = {
  x: number;
  y: number;
  z: number;
};

export type SphericalPosition = {
  theta: number;
  phi: number;
  radius: number;
};

export type WorldPosition = Position3D & {
  scale: number;
  zIndex: number;
  isVisible: boolean;
  fadeOpacity: number;
  originalIndex: number;
};

export type SphereImageData = {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
};

export type SphereImageGridProps = {
  images?: SphereImageData[];
  containerSize?: number;
  sphereRadius?: number;
  dragSensitivity?: number;
  momentumDecay?: number;
  maxRotationSpeed?: number;
  baseImageScale?: number;
  hoverScale?: number;
  perspective?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  className?: string;
};

export type RotationState = {
  x: number;
  y: number;
  z: number;
};

export type VelocityState = {
  x: number;
  y: number;
};

export type MousePosition = {
  x: number;
  y: number;
};

// ============================================================================
// MATH UTILITIES
// ============================================================================

export const SPHERE_MATH = {
  degreesToRadians: (degrees: number): number => degrees * (Math.PI / 180),
  radiansToDegrees: (radians: number): number => radians * (180 / Math.PI),

  sphericalToCartesian: (
    radius: number,
    theta: number,
    phi: number
  ): Position3D => ({
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  }),

  normalizeAngle: (angle: number): number => {
    let a = angle;
    while (a > 180) a -= 360;
    while (a < -180) a += 360;
    return a;
  },
};
