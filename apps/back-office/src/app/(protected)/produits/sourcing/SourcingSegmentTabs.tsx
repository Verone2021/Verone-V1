'use client';

import {
  SOURCING_LIST_SEGMENTS,
  SOURCING_SEGMENT_LABELS,
  type SourcingListSegment,
} from '@verone/products/utils';
import { Tabs, TabsList, TabsTrigger } from '@verone/ui';

interface SourcingSegmentTabsProps {
  value: SourcingListSegment;
  counts: Record<SourcingListSegment, number>;
  countsLoading: boolean;
  onChange: (segment: SourcingListSegment) => void;
}

function isSegment(value: string): value is SourcingListSegment {
  return (SOURCING_LIST_SEGMENTS as readonly string[]).includes(value);
}

/** En cours · En pause · Refusés · Retirés · Validés, avec leur nombre. */
export function SourcingSegmentTabs({
  value,
  counts,
  countsLoading,
  onChange,
}: SourcingSegmentTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={next => {
        if (isSegment(next)) onChange(next);
      }}
      className="w-full"
    >
      <div className="w-full overflow-x-auto">
        <TabsList variant="underline" className="w-full justify-start border-b">
          {SOURCING_LIST_SEGMENTS.map(segment => (
            <TabsTrigger
              key={segment}
              value={segment}
              variant="underline"
              className="min-h-11 md:min-h-0"
            >
              {SOURCING_SEGMENT_LABELS[segment]}
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {countsLoading ? '…' : counts[segment]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}
