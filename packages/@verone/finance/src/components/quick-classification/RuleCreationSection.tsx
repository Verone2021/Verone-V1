'use client';

import { Zap } from 'lucide-react';

interface RuleCreationSectionProps {
  label: string;
  createRule: boolean;
  onCreateRuleChange: (checked: boolean) => void;
  applyToExisting: boolean;
  onApplyToExistingChange: (checked: boolean) => void;
  transactionCount?: number;
  hasConfirmApply: boolean;
}

export function RuleCreationSection({
  label,
  createRule,
  onCreateRuleChange,
  applyToExisting,
  onApplyToExistingChange,
  transactionCount,
  hasConfirmApply,
}: RuleCreationSectionProps): React.ReactNode {
  return (
    <>
      <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 p-5 transition-all hover:bg-slate-50 hover:border-slate-300">
        <input
          type="checkbox"
          checked={createRule}
          onChange={e => onCreateRuleChange(e.target.checked)}
          className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <div className="flex-1">
          <span className="font-semibold text-slate-900">
            Creer une regle automatique
          </span>
          <p className="text-sm text-slate-500 mt-0.5">
            Les prochaines transactions &quot;{label.slice(0, 30)}...&quot;
            seront classees automatiquement
          </p>
        </div>
        <Zap className="h-5 w-5 text-amber-500" />
      </label>

      {/* Option pour appliquer aux transactions existantes */}
      {createRule &&
        hasConfirmApply &&
        transactionCount &&
        transactionCount > 0 && (
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 ml-6 transition-all hover:bg-slate-100">
            <input
              type="checkbox"
              checked={applyToExisting}
              onChange={e => onApplyToExistingChange(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-slate-700">
                Appliquer aux {transactionCount} transaction(s) existante(s)
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Classifier immediatement toutes les transactions avec ce libelle
              </p>
            </div>
          </label>
        )}
    </>
  );
}
