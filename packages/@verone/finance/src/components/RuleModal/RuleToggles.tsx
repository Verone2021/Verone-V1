'use client';

import { Switch } from '@verone/ui/components/ui/switch';

interface RuleTogglesProps {
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  allowMultipleCategories: boolean;
  onAllowMultipleCategoriesChange: (value: boolean) => void;
  justificationOptional: boolean;
  onJustificationOptionalChange: (value: boolean) => void;
}

export function RuleToggles({
  enabled,
  onEnabledChange,
  allowMultipleCategories,
  onAllowMultipleCategoriesChange,
  justificationOptional,
  onJustificationOptionalChange,
}: RuleTogglesProps) {
  return (
    <>
      {/* Statut Enabled */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <span className="font-medium text-slate-900">Règle active</span>
          <p className="text-sm text-slate-500">
            Les nouvelles transactions seront classées automatiquement
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>

      {/* Autoriser plusieurs catégories */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <span className="font-medium text-slate-900">
            Autoriser plusieurs catégories
          </span>
          <p className="text-sm text-slate-500">
            Permet de modifier la catégorie individuellement par transaction
          </p>
        </div>
        <Switch
          checked={allowMultipleCategories}
          onCheckedChange={onAllowMultipleCategoriesChange}
        />
      </div>

      {/* Justificatif facultatif */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <span className="font-medium text-slate-900">
            Justificatif facultatif
          </span>
          <p className="text-sm text-slate-500">
            Les transactions matchees n&apos;auront pas besoin de justificatif
          </p>
        </div>
        <Switch
          checked={justificationOptional}
          onCheckedChange={onJustificationOptionalChange}
        />
      </div>
    </>
  );
}
