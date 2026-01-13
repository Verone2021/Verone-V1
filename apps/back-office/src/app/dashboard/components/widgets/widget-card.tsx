'use client';

/**
 * Composant de base pour les widgets du dashboard
 * Container avec header, actions et contenu
 *
 * @created 2026-01-12
 */

import Link from 'next/link';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
} from '@verone/ui';
import { ExternalLink, MoreVertical, RefreshCw } from 'lucide-react';

import type { WidgetDefinition } from '../../lib/widget-catalog';

export interface WidgetCardProps {
  widget: WidgetDefinition;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onRemove?: () => void;
  linkTo?: string;
  children: React.ReactNode;
}

export function WidgetCard({
  widget,
  isLoading = false,
  error = null,
  onRefresh,
  onRemove,
  linkTo,
  children,
}: WidgetCardProps) {
  const Icon = widget.icon;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">{widget.label}</CardTitle>
        </div>

        <div className="flex items-center gap-1">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          )}

          {linkTo && (
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <Link href={linkTo}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}

          {onRemove && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onRemove} className="text-red-600">
                  Retirer du dashboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        {isLoading ? (
          <WidgetSkeleton />
        ) : error ? (
          <WidgetError message={error} onRetry={onRefresh} />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function WidgetSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2 w-1/2" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

interface WidgetErrorProps {
  message: string;
  onRetry?: () => void;
}

function WidgetError({ message, onRetry }: WidgetErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <p className="text-sm text-muted-foreground mb-2">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Réessayer
        </Button>
      )}
    </div>
  );
}
