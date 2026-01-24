'use client';

/**
 * Composant de base pour les graphiques du dashboard
 * Container avec header, actions et contenu Recharts
 *
 * @created 2026-01-12
 */

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
import { MoreVertical, RefreshCw, Maximize2, type LucideIcon } from 'lucide-react';

interface ChartConfig {
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface ChartCardProps {
  chart: ChartConfig;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onRemove?: () => void;
  onExpand?: () => void;
  children: React.ReactNode;
}

export function ChartCard({
  chart,
  isLoading = false,
  error = null,
  onRefresh,
  onRemove,
  onExpand,
  children,
}: ChartCardProps) {
  const Icon = chart.icon;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">{chart.label}</CardTitle>
            <p className="text-xs text-muted-foreground">{chart.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onExpand && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onExpand}
            >
              <Maximize2 className="h-3.5 w-3.5" />
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
          <ChartSkeleton />
        ) : error ? (
          <ChartError message={error} onRetry={onRefresh} />
        ) : (
          <div className="h-[200px] w-full">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-[200px] w-full flex items-end gap-2 pt-4">
      {[...Array(12)].map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1"
          style={{ height: `${Math.random() * 60 + 40}%` }}
        />
      ))}
    </div>
  );
}

interface ChartErrorProps {
  message: string;
  onRetry?: () => void;
}

function ChartError({ message, onRetry }: ChartErrorProps) {
  return (
    <div className="h-[200px] flex flex-col items-center justify-center text-center">
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
