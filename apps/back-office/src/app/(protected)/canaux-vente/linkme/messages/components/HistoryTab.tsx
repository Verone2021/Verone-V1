'use client';

import { useState } from 'react';
import { Badge, Card, CardContent, Separator, Skeleton } from '@verone/ui';
import { CheckCircle2, Clock, History, Hourglass, XCircle } from 'lucide-react';

import type { InfoRequestHistoryItem } from './types';
import { formatFieldLabel } from './types';
import { useInfoRequestHistory } from './hooks';

// =============================================================================
// HistoryStatusBadge
// =============================================================================

function HistoryStatusBadge({ item }: { item: InfoRequestHistoryItem }) {
  if (item.completed_at) {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Complete
      </Badge>
    );
  }
  if (item.cancelled_at) {
    return (
      <Badge className="bg-gray-100 text-gray-600 border-gray-200">
        <XCircle className="h-3 w-3 mr-1" />
        {item.cancelled_reason === 'completed_by_other'
          ? 'Autre reponse'
          : 'Annule'}
      </Badge>
    );
  }
  if (item.token_expires_at && new Date(item.token_expires_at) < new Date()) {
    return (
      <Badge className="bg-gray-100 text-gray-500 border-gray-200">
        <Clock className="h-3 w-3 mr-1" />
        Expire
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
      <Hourglass className="h-3 w-3 mr-1" />
      En attente
    </Badge>
  );
}

// =============================================================================
// HistoryTab
// =============================================================================

export function HistoryTab() {
  const { data: history, isLoading } = useInfoRequestHistory();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium">Aucune demande envoyee</p>
          <p className="text-sm mt-1">
            L&apos;historique des demandes d&apos;informations apparaitra ici
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-500">
        {history.length} demande(s) (50 dernieres)
      </div>

      {history.map(item => {
        const isExpanded = expandedId === item.id;
        const submittedEntries = item.submitted_data
          ? Object.entries(item.submitted_data)
          : [];

        return (
          <Card key={item.id}>
            <CardContent className="py-3">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-semibold text-sm">
                      {item.order_number}
                    </span>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-sm text-gray-600 truncate">
                      {item.recipient_email}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {item.recipient_type === 'requester'
                        ? 'Demandeur'
                        : 'Proprietaire'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <HistoryStatusBadge item={item} />
                    <span className="text-xs text-gray-400">
                      {new Date(item.sent_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  {item.custom_message && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">
                        Message :
                      </span>{' '}
                      <span className="text-gray-500 italic">
                        &laquo; {item.custom_message} &raquo;
                      </span>
                    </div>
                  )}

                  {item.completed_at && (
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Complete le{' '}
                        {new Date(item.completed_at).toLocaleDateString(
                          'fr-FR'
                        )}
                        {item.completed_by_email &&
                          ` par ${item.completed_by_email}`}
                      </div>

                      {submittedEntries.length > 0 && (
                        <div className="bg-green-50 rounded-lg p-2 mt-1">
                          <p className="text-xs font-medium text-green-800 mb-1">
                            Champs remplis ({submittedEntries.length}) :
                          </p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                            {submittedEntries.map(([key, val]) => (
                              <div key={key} className="text-xs text-green-700">
                                <span className="text-green-600">
                                  {formatFieldLabel(key)}
                                </span>
                                : {val}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {item.cancelled_at && (
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" />
                      Annule le{' '}
                      {new Date(item.cancelled_at).toLocaleDateString('fr-FR')}
                      {item.cancelled_reason === 'completed_by_other' &&
                        ' (autre destinataire a repondu)'}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
