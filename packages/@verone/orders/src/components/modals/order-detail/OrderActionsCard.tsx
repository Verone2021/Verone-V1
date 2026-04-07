'use client';

import { useRouter } from 'next/navigation';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { FileText, Mail, ExternalLink } from 'lucide-react';

import type { SalesOrder } from '@verone/orders/hooks';
import type { LinkedDocument } from '../SendOrderDocumentsModal';

export interface OrderActionsCardProps {
  order: SalesOrder;
  readOnly: boolean;
  channelRedirectUrl?: string | null;
  linkedDocuments: LinkedDocument[];
  onShowSendDocsModal: () => void;
}

export function OrderActionsCard({
  order,
  readOnly,
  channelRedirectUrl,
  linkedDocuments,
  onShowSendDocsModal,
}: OrderActionsCardProps) {
  const router = useRouter();

  return (
    <>
      {/* Card Notes (si existe) */}
      {order.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-3 w-3" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-700 whitespace-pre-wrap">
              {order.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Card Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {channelRedirectUrl && (
            <ButtonV2
              variant="default"
              size="sm"
              className="w-full justify-start"
              onClick={() => router.push(channelRedirectUrl)}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Gérer dans {order.sales_channel?.name ?? 'CMS'}
            </ButtonV2>
          )}

          {!readOnly && (
            <ButtonV2
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={onShowSendDocsModal}
            >
              <Mail className="h-3 w-3 mr-1" />
              Envoyer documents
              {linkedDocuments.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-auto text-[10px] px-1.5 py-0"
                >
                  {linkedDocuments.length}
                </Badge>
              )}
            </ButtonV2>
          )}

          {readOnly && !channelRedirectUrl && (
            <p className="text-xs text-gray-500 text-center py-2">
              Mode lecture seule
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
