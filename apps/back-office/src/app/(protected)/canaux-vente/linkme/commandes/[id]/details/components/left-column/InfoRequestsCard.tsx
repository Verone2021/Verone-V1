'use client';

import { Badge, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { CheckCircle2, Clock, Mail, XCircle } from 'lucide-react';

import type { InfoRequest } from '../types';

interface InfoRequestsCardProps {
  infoRequests: InfoRequest[];
}

export function InfoRequestsCard({ infoRequests }: InfoRequestsCardProps) {
  if (infoRequests.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-indigo-600" />
          <CardTitle className="text-base">Demandes</CardTitle>
          <Badge variant="secondary" className="ml-auto text-xs">
            {infoRequests.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...infoRequests]
            .sort(
              (a, b) =>
                new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
            )
            .map(req => {
              const isPending = !req.completed_at && !req.cancelled_at;
              const isCompleted = !!req.completed_at;
              const isCancelled = !!req.cancelled_at;
              return (
                <div
                  key={req.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    isPending
                      ? 'border-yellow-200 bg-yellow-50'
                      : isCompleted
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                  }`}
                >
                  {isPending && (
                    <Clock className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  )}
                  {isCompleted && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  )}
                  {isCancelled && (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">
                        {req.recipient_email}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {req.recipient_type === 'requester'
                          ? 'Demandeur'
                          : 'Propriétaire'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Envoyé le{' '}
                      {new Date(req.sent_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {isCompleted && req.completed_at && (
                        <span className="text-green-700 ml-2">
                          — Complété le{' '}
                          {new Date(req.completed_at).toLocaleDateString(
                            'fr-FR',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }
                          )}
                        </span>
                      )}
                      {isCancelled && req.cancelled_reason && (
                        <span className="text-red-700 ml-2">
                          — Raison : {req.cancelled_reason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
