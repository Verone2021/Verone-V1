'use client';

import { useState, useEffect } from 'react';

import { Input } from '@verone/ui';

interface QuantityInputProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export function QuantityInput({
  value,
  onChange,
  disabled,
}: QuantityInputProps) {
  const [localVal, setLocalVal] = useState(String(value));

  useEffect(() => {
    setLocalVal(String(value));
  }, [value]);

  return (
    <Input
      type="number"
      min="1"
      value={localVal}
      onChange={e => setLocalVal(e.target.value)}
      onBlur={() => {
        const parsed = parseInt(localVal);
        const final = isNaN(parsed) || parsed < 1 ? 1 : parsed;
        setLocalVal(String(final));
        onChange(final);
      }}
      disabled={disabled}
      className="w-full h-8 text-sm"
    />
  );
}
