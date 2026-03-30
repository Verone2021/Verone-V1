'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Progress,
} from '@verone/ui';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Loader2,
} from 'lucide-react';

import type { PreClotureCheck, CheckStatus } from '../types';

interface ClotureChecksProps {
  checks: PreClotureCheck[];
  selectedYear: string;
}

function StatusIcon({ status }: { status: CheckStatus }) {
  switch (status) {
    case 'pass':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'warn':
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    case 'fail':
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }
}

export function ClotureChecks({ checks, selectedYear }: ClotureChecksProps) {
  const passCount = checks.filter(c => c.status === 'pass').length;
  const warnCount = checks.filter(c => c.status === 'warn').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const overallStatus =
    failCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'pass';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Vérifications pré-clôture
            </CardTitle>
            <CardDescription>
              Contrôles automatiques avant clôture de l&apos;exercice{' '}
              {selectedYear}
            </CardDescription>
          </div>
          <Badge
            variant={
              overallStatus === 'pass'
                ? 'default'
                : overallStatus === 'warn'
                  ? 'secondary'
                  : 'destructive'
            }
            className={overallStatus === 'pass' ? 'bg-green-600' : undefined}
          >
            {passCount}/{checks.length} OK
            {warnCount > 0 ? ` • ${warnCount} avert.` : ''}
            {failCount > 0 ? ` • ${failCount} bloquant(s)` : ''}
          </Badge>
        </div>
        <Progress value={(passCount / checks.length) * 100} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {checks.map(check => (
          <div
            key={check.id}
            className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
          >
            <StatusIcon status={check.status} />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{check.label}</div>
              <div className="text-sm text-muted-foreground">
                {check.description}
              </div>
              {check.detail && (
                <div className="text-xs text-muted-foreground mt-1">
                  {check.detail}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
