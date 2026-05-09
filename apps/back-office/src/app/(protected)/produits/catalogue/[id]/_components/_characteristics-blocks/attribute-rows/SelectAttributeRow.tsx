'use client';

import type { AttributeSelectOption } from '../AttributeSelect';
import { AttributeSelect } from '../AttributeSelect';

export interface SelectAttributeRowProps {
  attrKey: string;
  label: string;
  value: string;
  options: AttributeSelectOption[];
  allowCustom?: boolean;
  onSave: (key: string, value: string) => void;
}

export function SelectAttributeRow({
  attrKey,
  label,
  value,
  options,
  allowCustom = false,
  onSave,
}: SelectAttributeRowProps) {
  return (
    <div className="group flex items-center gap-2 py-1.5 border-b border-neutral-100 last:border-0">
      <span className="w-32 flex-shrink-0 text-[10px] uppercase tracking-wide text-neutral-500 font-medium">
        {label}
      </span>
      <div className="flex-1 min-w-0">
        <AttributeSelect
          value={value}
          onChange={v => onSave(attrKey, v)}
          options={options}
          allowCustom={allowCustom}
        />
      </div>
    </div>
  );
}
