'use client';

import { useMemo, useState } from 'react';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
} from '@verone/ui';
import { ActivityTimeline } from '@verone/ui';
import {
  useUserLinkmeActivity,
  buildTimelineEvents,
  filterTimelineEvents,
} from '@verone/orders/hooks/linkme';
import type { ActivityFilter } from '@verone/orders/hooks/linkme';
import { ChevronDown, Clock, Loader2 } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface UserActivityTimelineProps {
  userId: string;
  enseigneId: string | null;
  organisationId: string | null;
}

// ============================================
// FILTER CHIPS
// ============================================

const FILTER_OPTIONS: { value: ActivityFilter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'orders', label: 'Commandes' },
  { value: 'notifications', label: 'Notifications' },
];

const INITIAL_VISIBLE = 10;
const LOAD_MORE_INCREMENT = 20;

// ============================================
// COMPONENT
// ============================================

export function UserActivityTimeline({
  userId,
  enseigneId,
  organisationId,
}: UserActivityTimelineProps) {
  const { data, isLoading } = useUserLinkmeActivity(
    userId,
    enseigneId,
    organisationId
  );

  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const allEvents = useMemo(
    () => (data ? buildTimelineEvents(data) : []),
    [data]
  );

  const filteredEvents = useMemo(
    () => filterTimelineEvents(allEvents, filter),
    [allEvents, filter]
  );

  const hasMore = filteredEvents.length > visibleCount;
  const remaining = filteredEvents.length - visibleCount;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Historique
            {filteredEvents.length > 0 && (
              <span className="text-sm font-normal text-gray-500">
                ({filteredEvents.length} evenement
                {filteredEvents.length > 1 ? 's' : ''})
              </span>
            )}
          </CardTitle>
        </div>
        {/* Filter chips */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {FILTER_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setFilter(option.value);
                setVisibleCount(INITIAL_VISIBLE);
              }}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
                filter === option.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-sm text-gray-500">
              {filter === 'all'
                ? 'Aucun historique disponible'
                : 'Aucun evenement dans cette categorie'}
            </p>
          </div>
        ) : (
          <>
            <ActivityTimeline items={filteredEvents} maxItems={visibleCount} />
            {hasMore && (
              <div className="mt-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setVisibleCount(prev => prev + LOAD_MORE_INCREMENT)
                  }
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Voir plus ({remaining} restant{remaining > 1 ? 's' : ''})
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
