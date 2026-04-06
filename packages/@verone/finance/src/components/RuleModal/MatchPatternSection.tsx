'use client';

import { Button } from '@verone/ui/components/ui/button';
import { Input } from '@verone/ui/components/ui/input';
import { Label } from '@verone/ui/components/ui/label';
import { Plus, Tag, X } from 'lucide-react';

interface MatchPatternSectionProps {
  isEditMode: boolean;
  matchValue: string;
  onMatchValueChange: (value: string) => void;
  matchPatterns: string[];
  newPatternInput: string;
  onNewPatternInputChange: (value: string) => void;
  onAddPattern: () => void;
  onRemovePattern: (pattern: string) => void;
}

export function MatchPatternSection({
  isEditMode,
  matchValue,
  onMatchValueChange,
  matchPatterns,
  newPatternInput,
  onNewPatternInputChange,
  onAddPattern,
  onRemovePattern,
}: MatchPatternSectionProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <Tag className="h-4 w-4 text-slate-500" />
        {isEditMode ? 'Patterns de matching' : 'Pattern de matching'}
      </Label>
      {isEditMode ? (
        <>
          {/* Liste des patterns existants */}
          <div className="space-y-2">
            {matchPatterns.map((pattern, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border bg-slate-50 p-2"
              >
                <span className="font-mono text-sm text-slate-700">
                  {pattern}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemovePattern(pattern)}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                  disabled={matchPatterns.length <= 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {/* Ajouter un pattern */}
          <div className="flex gap-2">
            <Input
              value={newPatternInput}
              onChange={e => onNewPatternInputChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddPattern();
                }
              }}
              placeholder="Ajouter un libellé alternatif..."
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={onAddPattern}
              disabled={!newPatternInput.trim()}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Ajoutez des variantes du libellé (ex: &quot;AMÉRICO&quot;,
            &quot;AMERICO&quot;)
          </p>
        </>
      ) : (
        <Input
          value={matchValue}
          onChange={e => onMatchValueChange(e.target.value)}
          placeholder="Ex: STRIPE, AMAZON, OVH..."
          className="font-mono"
        />
      )}
      {!isEditMode && (
        <p className="text-xs text-slate-500">
          Les transactions contenant ce texte seront automatiquement classées
        </p>
      )}
    </div>
  );
}
