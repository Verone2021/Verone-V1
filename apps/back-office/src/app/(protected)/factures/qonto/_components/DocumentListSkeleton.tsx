'use client';

import { Card, CardContent, Skeleton } from '@verone/ui';

interface DocumentListSkeletonProps {
  emptyMessage: string;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  children: React.ReactNode;
}

export function DocumentListSkeleton({
  emptyMessage,
  loading,
  error,
  isEmpty,
  children,
}: DocumentListSkeletonProps): React.ReactNode {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mb-4 border-destructive/50 bg-destructive/10">
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (isEmpty) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return <div className="space-y-4">{children}</div>;
}
