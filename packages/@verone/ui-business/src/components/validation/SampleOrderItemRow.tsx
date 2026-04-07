'use client';

import type { SampleOrderItem } from './sample-order-validation.types';
import { getStatusBadge } from './sample-order-validation.helpers';

interface SampleOrderItemRowProps {
  item: SampleOrderItem;
  isSelected: boolean;
  onToggle: (id: string, checked: boolean) => void;
}

export function SampleOrderItemRow({
  item,
  isSelected,
  onToggle,
}: SampleOrderItemRowProps) {
  return (
    <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={e => onToggle(item.product_draft_id, e.target.checked)}
          className="rounded border-gray-300"
        />
      </div>
      <div className="flex-1">
        <div className="font-medium text-black">{item.product_drafts.name}</div>
        <div className="text-sm text-gray-600">{item.description}</div>
      </div>
      <div className="text-sm text-gray-600">
        {item.estimated_cost}€ • {item.delivery_time_days}j
      </div>
      {getStatusBadge(item.status)}
    </div>
  );
}
