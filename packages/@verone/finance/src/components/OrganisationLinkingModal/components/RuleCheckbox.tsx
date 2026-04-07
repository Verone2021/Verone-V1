'use client';

import { cn } from '@verone/ui';
import { Settings } from 'lucide-react';

interface IRuleCheckboxProps {
  createRule: boolean;
  onCreateRuleChange: (v: boolean) => void;
}

export function RuleCheckbox({
  createRule,
  onCreateRuleChange,
}: IRuleCheckboxProps): React.JSX.Element {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all',
        createRule
          ? 'border-amber-500 bg-amber-50'
          : 'border-slate-200 hover:bg-slate-50'
      )}
    >
      <input
        type="checkbox"
        checked={createRule}
        onChange={e => onCreateRuleChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-amber-500"
      />
      <div className="flex-1">
        <div className="text-sm font-medium flex items-center gap-2">
          <Settings size={14} className="text-amber-500" />
          Créer une règle automatique
        </div>
        <div className="text-xs text-slate-500">
          Les futures transactions avec ce libellé seront automatiquement liées
        </div>
      </div>
    </label>
  );
}
