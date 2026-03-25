'use client';

import { Badge, Button, Card, CardContent } from '@verone/ui';
import { CheckCircle2, MessageSquare, XCircle } from 'lucide-react';

import type { getOrderMissingFields } from '../../../utils/order-missing-fields';

interface StatusActionsCardProps {
  status: string;
  missingFieldsResult: ReturnType<typeof getOrderMissingFields> | null;
  approveIsPending: boolean;
  onApprove: () => void;
  onRequestInfo: () => void;
  onReject: () => void;
}

export function StatusActionsCard({
  status,
  missingFieldsResult,
  approveIsPending,
  onApprove,
  onRequestInfo,
  onReject,
}: StatusActionsCardProps) {
  const getStatusBadge = (s: string) => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      pending_approval: 'outline',
      draft: 'secondary',
      validated: 'default',
      cancelled: 'destructive',
    };
    const labels: Record<string, string> = {
      pending_approval: "En attente d'approbation",
      draft: 'Brouillon',
      validated: 'Validee',
      cancelled: 'Annulee',
      shipped: 'Expediee',
      delivered: 'Livree',
    };
    return <Badge variant={variants[s] ?? 'outline'}>{labels[s] ?? s}</Badge>;
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">{getStatusBadge(status)}</div>
        {status === 'draft' && (
          <div className="space-y-2">
            <Button
              className="w-full gap-2"
              onClick={onApprove}
              disabled={approveIsPending}
            >
              <CheckCircle2 className="h-4 w-4" />
              Approuver
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2 relative"
              onClick={onRequestInfo}
            >
              <MessageSquare className="h-4 w-4" />
              Demander complements
              {missingFieldsResult &&
                missingFieldsResult.totalCategories > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                    {missingFieldsResult.totalCategories}
                  </span>
                )}
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={onReject}
            >
              <XCircle className="h-4 w-4" />
              Refuser
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
