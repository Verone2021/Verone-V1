/**
 * Roadmap Widget Wrapper - Client Component wrapper for RSC dashboard
 *
 * Wraps the AutoRoadmapWidget for use in the server component dashboard page.
 */

'use client';

import { AutoRoadmapWidget } from '@verone/roadmap';

export function RoadmapWidgetWrapper() {
  return (
    <AutoRoadmapWidget
      minPriority="low"
      maxTasks={5}
      showStats={false}
      title="Feuille de Route"
    />
  );
}
