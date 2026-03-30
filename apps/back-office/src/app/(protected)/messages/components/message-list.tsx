'use client';

import { Card, CardContent } from '@verone/ui';
import { Inbox } from 'lucide-react';

import { MessageCard } from './message-card';
import type { UnifiedMessage } from './message-card';

// ============================================================================
// EmptyState
// ============================================================================

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="h-12 w-12 text-muted-foreground/30 mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ============================================================================
// LoadingSkeleton
// ============================================================================

export function LoadingSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// MessageList
// ============================================================================

interface MessageListProps {
  loading: boolean;
  messages: UnifiedMessage[];
  emptyLabel: string;
  skeletonCount?: number;
}

export function MessageList({
  loading,
  messages,
  emptyLabel,
  skeletonCount,
}: MessageListProps) {
  if (loading) return <LoadingSkeleton count={skeletonCount} />;
  if (messages.length === 0) return <EmptyState message={emptyLabel} />;

  return (
    <div className="space-y-2">
      {messages.map(m => (
        <MessageCard key={`${m.type}-${m.id}`} message={m} />
      ))}
    </div>
  );
}
