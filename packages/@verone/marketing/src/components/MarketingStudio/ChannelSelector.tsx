'use client';

import * as React from 'react';

import { Label } from '@verone/ui/components/ui/label';
import {
  RadioGroup,
  RadioGroupItem,
} from '@verone/ui/components/ui/radio-group';

import { TARGET_CHANNEL_VALUES, TARGET_CHANNEL_LABELS } from '../../types';
import type { TargetChannel } from '../../types';

// ============================================================================
// PROPS
// ============================================================================

interface ChannelSelectorProps {
  value: TargetChannel;
  onChange: (channel: TargetChannel) => void;
  disabled?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ChannelSelector({
  value,
  onChange,
  disabled,
}: ChannelSelectorProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={v => onChange(v as TargetChannel)}
      disabled={disabled}
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
    >
      {TARGET_CHANNEL_VALUES.map(channel => (
        <div key={channel} className="flex items-center space-x-2">
          <RadioGroupItem
            value={channel}
            id={`channel-${channel}`}
            className="h-5 w-5 md:h-4 md:w-4"
          />
          <Label
            htmlFor={`channel-${channel}`}
            className="cursor-pointer text-sm"
          >
            {TARGET_CHANNEL_LABELS[channel]}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
