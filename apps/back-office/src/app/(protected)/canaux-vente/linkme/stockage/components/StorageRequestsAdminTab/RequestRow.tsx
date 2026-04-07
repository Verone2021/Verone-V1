'use client';

import { Button } from '@verone/ui';
import { cn } from '@verone/utils';
import { Loader2, Check, XCircle } from 'lucide-react';

import { type StorageRequestAdmin } from '../../../hooks/use-storage-requests-admin';

export const REQUEST_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: 'En attente',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
  reception_created: {
    label: 'Reception creee',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  rejected: { label: 'Rejetee', color: 'text-red-700', bgColor: 'bg-red-100' },
  cancelled: {
    label: 'Annulee',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  approved: {
    label: 'Approuvee',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
};

interface RequestRowProps {
  request: StorageRequestAdmin;
  onApprove?: () => void;
  onReject?: () => void;
  isApproving?: boolean;
  showActions?: boolean;
}

export function RequestRow({
  request,
  onApprove,
  onReject,
  isApproving,
  showActions,
}: RequestRowProps): React.ReactElement {
  const statusConfig = REQUEST_STATUS_CONFIG[request.status] ?? {
    label: request.status,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-2">
        <p className="font-medium text-gray-900 truncate max-w-[140px]">
          {request.affiliate_name}
        </p>
        <p className="text-xs text-gray-400 truncate max-w-[140px]">
          {request.owner_name}
        </p>
      </td>
      <td className="px-3 py-2">
        <p className="font-medium text-gray-900 truncate max-w-[160px]">
          {request.product_name}
        </p>
        <p className="text-xs text-gray-400 font-mono">{request.product_sku}</p>
      </td>
      <td className="px-3 py-2 text-center font-semibold">
        {request.quantity}
      </td>
      {showActions ? (
        <td className="px-3 py-2">
          <p className="text-xs text-gray-500 truncate max-w-[120px]">
            {request.notes ?? '-'}
          </p>
        </td>
      ) : (
        <td className="px-3 py-2">
          <span
            className={cn(
              'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
              statusConfig.bgColor,
              statusConfig.color
            )}
          >
            {statusConfig.label}
          </span>
        </td>
      )}
      <td className="px-3 py-2 text-xs text-gray-500">
        {new Date(request.created_at).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
        })}
      </td>
      {showActions && (
        <td className="px-3 py-2 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-green-600 border-green-300 hover:bg-green-50"
              onClick={onApprove}
              disabled={isApproving}
            >
              {isApproving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5 mr-1" />
              )}
              Approuver
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-red-600 border-red-300 hover:bg-red-50"
              onClick={onReject}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Rejeter
            </Button>
          </div>
        </td>
      )}
    </tr>
  );
}
