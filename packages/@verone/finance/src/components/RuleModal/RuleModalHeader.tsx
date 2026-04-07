'use client';

import { cn } from '@verone/ui';
import { DialogHeader, DialogTitle } from '@verone/ui/components/ui/dialog';
import { Settings, Plus } from 'lucide-react';

import type { MatchingRule } from '../../hooks/use-matching-rules';

interface RuleModalHeaderProps {
  isEditMode: boolean;
  rule?: MatchingRule | null;
}

export function RuleModalHeader({ isEditMode, rule }: RuleModalHeaderProps) {
  return (
    <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-blue-50">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl shadow-sm',
            isEditMode ? 'bg-blue-100' : 'bg-green-100'
          )}
        >
          {isEditMode ? (
            <Settings className="h-5 w-5 text-blue-600" />
          ) : (
            <Plus className="h-5 w-5 text-green-600" />
          )}
        </div>
        <div>
          <DialogTitle className="text-lg font-semibold text-slate-900">
            {isEditMode ? 'Modifier la règle' : 'Créer une règle'}
          </DialogTitle>
          {isEditMode && rule && (
            <p className="text-sm text-slate-600 mt-0.5 max-w-sm truncate">
              {rule.match_value}
            </p>
          )}
        </div>
      </div>
    </DialogHeader>
  );
}
