'use client';

import { Plus, X } from 'lucide-react';

import { ButtonV2 } from '@verone/ui';
import { Input } from '@verone/ui';

interface ProductCustomAttributesFormProps {
  customAttributes: Record<string, string>;
  newAttributeKey: string;
  newAttributeValue: string;
  onNewKeyChange: (v: string) => void;
  onNewValueChange: (v: string) => void;
  onAddAttribute: () => void;
  onRemoveAttribute: (key: string) => void;
}

export function ProductCustomAttributesForm({
  customAttributes,
  newAttributeKey,
  newAttributeValue,
  onNewKeyChange,
  onNewValueChange,
  onAddAttribute,
  onRemoveAttribute,
}: ProductCustomAttributesFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-black flex items-center gap-2">
        <Plus className="h-5 w-5" />
        Attributs personnalisés
      </h3>

      {Object.keys(customAttributes).length > 0 && (
        <div className="space-y-2">
          {Object.entries(customAttributes).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div className="text-sm font-medium text-black">{key}</div>
                <div className="text-sm text-gray-700">{value}</div>
              </div>
              <ButtonV2
                variant="ghost"
                size="sm"
                onClick={() => onRemoveAttribute(key)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </ButtonV2>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Input
          value={newAttributeKey}
          onChange={e => onNewKeyChange(e.target.value)}
          placeholder="Nom de l'attribut"
          className="text-sm"
        />
        <div className="flex gap-2">
          <Input
            value={newAttributeValue}
            onChange={e => onNewValueChange(e.target.value)}
            placeholder="Valeur"
            className="text-sm flex-1"
          />
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={onAddAttribute}
            disabled={!newAttributeKey.trim() || !newAttributeValue.trim()}
          >
            <Plus className="h-4 w-4" />
          </ButtonV2>
        </div>
      </div>
    </div>
  );
}
