'use client';

import { Badge } from '@verone/ui';
import { AlertCircle, Check } from 'lucide-react';

export function renderStepBadge(complete: boolean) {
  if (complete) {
    return (
      <Badge className="bg-green-100 text-green-800 gap-1">
        <Check className="h-3 w-3" />
        Complet
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <AlertCircle className="h-3 w-3" />
      Incomplet
    </Badge>
  );
}
