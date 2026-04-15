'use client';

/**
 * StoreLocatorMarkers - Composants de marqueurs pour StoreLocatorMap
 *
 * @module StoreLocatorMarkers
 * @since 2026-04-14
 */

// ============================================================================
// MARKER PIN
// ============================================================================

interface MarkerPinProps {
  color: string;
  size?: number;
}

export function MarkerPin({ color, size = 28 }: MarkerPinProps) {
  return (
    <svg
      width={size}
      height={size * 1.3}
      viewBox="0 0 24 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ cursor: 'pointer' }}
    >
      <path
        d="M12 0C5.373 0 0 5.373 0 12c0 8.25 12 20 12 20s12-11.75 12-20c0-6.627-5.373-12-12-12z"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="11" r="4" fill="white" />
    </svg>
  );
}

// ============================================================================
// CLUSTER MARKER
// ============================================================================

interface ClusterMarkerProps {
  count: number;
  color: string;
  onClick: () => void;
}

export function ClusterMarker({ count, color, onClick }: ClusterMarkerProps) {
  let size = 36;
  if (count >= 100) size = 52;
  else if (count >= 50) size = 48;
  else if (count >= 20) size = 44;
  else if (count >= 10) size = 40;

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-center rounded-full text-white font-bold shadow-lg cursor-pointer transition-transform hover:scale-110"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        border: '3px solid white',
        fontSize: count >= 100 ? 14 : 12,
      }}
    >
      {count}
    </div>
  );
}
